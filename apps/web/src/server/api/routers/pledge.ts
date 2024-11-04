import { getUSDCBalance } from "@/lib/delegator";
import { userPledgesFilter } from "@/lib/utils";
import { delegationSchema } from "@/lib/validators";
import {
  createCallerFactory,
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { coverMe, events, pledges } from "@/server/db/schema";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const pledgeRouter = createTRPCRouter({
  placed: privateProcedure
    .input(z.object({ eventId: z.string().cuid2().optional() }))
    .query(async ({ ctx, input }) => {
      if (input.eventId) {
        return await ctx.db.query.pledges.findMany({
          where: userPledgesFilter({
            userId: ctx.user.id,
            eventId: input.eventId,
          }),
        });
      } else {
        return await ctx.db.query.pledges.findMany({
          where: userPledgesFilter({
            userId: ctx.user.id,
          }),
        });
      }
    }),

  create: privateProcedure
    .input(
      z.object({
        eventId: z.string().cuid2(),
        amount: z.number(),
        delegation: delegationSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has already pledged on this proposal
      const prev = await createCaller(ctx).placed({ eventId: input.eventId });
      if (prev.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already pledged on this event",
        });
      }

      // Get the event to fetch the pledge price
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
      });
      if (!event) {
        console.error(`Event ${input.eventId} not found`);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (input.amount < event.pledgePrice) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Amount must be greater than or equal to the minimum pledge amount",
        });
      }

      // Create new pledge
      const [newPledge] = await ctx.db
        .insert(pledges)
        .values({
          userId: ctx.user.id,
          eventId: input.eventId,
          delegation: input.delegation,
          amount: input.amount,
          attendeeAddress: ctx.user.publicMetadata.walletAddress,
          attendeeId: ctx.user.id,
        })
        .returning();

      return newPledge;
    }),

  cancel: privateProcedure
    .input(z.object({ pledgeId: z.string().cuid2() }))
    .mutation(async ({ ctx, input }) => {
      const p = await ctx.db.query.pledges.findFirst({
        where: userPledgesFilter({
          userId: ctx.user.id,
          pledgeId: input.pledgeId,
        }),
      });
      if (!p) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pledge not found",
        });
      }
      if (p.accepted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel an accepted pledge",
        });
      }

      // TODO: Mark pledge as cancelled instead of deleting it
      const deleted = await ctx.db
        .delete(pledges)
        .where(eq(pledges.id, input.pledgeId))
        .returning();

      const coverMeRequest = await ctx.db.query.coverMe.findFirst({
        where: and(
          eq(coverMe.eventId, p.eventId),
          eq(coverMe.requesterId, p.userId),
        ),
      });

      if (coverMeRequest) {
        await ctx.db
          .update(coverMe)
          .set({
            coveredById: null,
          })
          .where(eq(coverMe.id, coverMeRequest.id));
      }

      return deleted[0];
    }),

  all: publicProcedure
    .input(z.object({ eventId: z.string().cuid2() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.pledges.findMany({
        where: eq(pledges.eventId, input.eventId),
      });
    }),

  valid: privateProcedure
    .input(z.object({ eventId: z.string().cuid2() }))
    .query(async ({ ctx, input }) => {
      const ev = await ctx.db.query.events.findFirst({
        where: and(
          eq(events.id, input.eventId),
          eq(events.userId, ctx.user.id),
        ),
      });

      if (!ev) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found or not active",
        });
      }

      const evPledges = await ctx.db.query.pledges.findMany({
        where: eq(pledges.eventId, input.eventId),
      });

      // Map of user wallet address to remaining balance,
      // since the same user might have multiple pledges
      const remainingBalance = new Map<string, bigint>();
      const validPledges = [];

      for (const p of evPledges) {
        const user = await clerkClient().users.getUser(p.userId);
        const userWalletAddress = user.publicMetadata?.walletAddress;

        if (!userWalletAddress) {
          continue;
        }

        const balance =
          remainingBalance.get(userWalletAddress) ??
          (await getUSDCBalance(userWalletAddress));

        if (balance >= BigInt(p.amount)) {
          validPledges.push(p);
          remainingBalance.set(userWalletAddress, balance - BigInt(p.amount));
        }
      }

      const ready = validPledges.length >= ev.minTickets;

      return {
        pledges: validPledges,
        isEventReady: ready,
      };
    }),

  createCovered: privateProcedure
    .input(
      z.object({
        coverMeRequestId: z.string().cuid2(),
        delegation: delegationSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const coverMeRequest = await ctx.db.query.coverMe.findFirst({
        where: eq(coverMe.id, input.coverMeRequestId),
      });
      if (!coverMeRequest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cover request not found",
        });
      }
      // Check if user has already pledged on this proposal
      const prev = await ctx.db.query.pledges.findFirst({
        where: userPledgesFilter({
          userId: coverMeRequest.requesterId,
          eventId: coverMeRequest.eventId,
        }),
      });

      if (prev) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The requester has already pledged on this event",
        });
      }

      const requester = await clerkClient().users.getUser(
        coverMeRequest.requesterId,
      );

      // Get the event to fetch the pledge price
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, coverMeRequest.eventId),
      });

      if (!event) {
        console.error(`Event ${coverMeRequest.eventId} not found`);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Create new pledge
      const [newPledge] = await ctx.db
        .insert(pledges)
        .values({
          userId: ctx.user.id,
          eventId: event.id,
          delegation: input.delegation,
          amount: event.pledgePrice,
          attendeeAddress: requester.publicMetadata?.walletAddress,
          attendeeId: requester.id,
        })
        .returning();

      await ctx.db
        .update(coverMe)
        .set({
          coveredById: ctx.user.id,
        })
        .where(eq(coverMe.id, input.coverMeRequestId));

      return newPledge;
    }),
});

const createCaller = createCallerFactory(pledgeRouter);
