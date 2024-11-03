import {
  DEFAULT_MIN_TICKETS,
  DESCRIPTION_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  PROPOSAL_NAME_MAX_LENGTH,
} from "@/lib/constants";
import { generateProposalId, getPimlicoClient } from "@/lib/delegator";
import { getProposalNFTs } from "@/lib/proposalNFT";
import { Status, type EventStatus } from "@/lib/types";
import { directionFilterSchema, queryFilterSchema } from "@/lib/validators";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { events, pledges } from "@/server/db/schema";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";

export const eventRouter = createTRPCRouter({
  create: privateProcedure
    .input(
      z.object({
        expiresAt: z.date(),
        happensAt: z.date(),
        endsAt: z.date().optional(),
        title: z.string().min(10).max(PROPOSAL_NAME_MAX_LENGTH),
        description: z.string().max(DESCRIPTION_MAX_LENGTH),
        imageUrl: z.string().optional(),
        pledgePrice: z.number().int().nonnegative(),
        minTickets: z.number().int().positive().min(DEFAULT_MIN_TICKETS),
        location: z.string().max(LOCATION_MAX_LENGTH).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { walletAddress } = ctx.user.publicMetadata;

      if (!walletAddress) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "You must have a gator wallet to create a proposal",
        });
      }

      // Generate a random BigInt for the nonce
      const nonce = BigInt(`0x${crypto.randomBytes(16).toString("hex")}`);

      // Generate deterministic proposal address
      const proposalAddress = generateProposalId(
        walletAddress,
        input.pledgePrice * input.minTickets,
        nonce,
      );

      const res = await ctx.db
        .insert(events)
        .values({
          proposalAddress,
          nonce,
          userId: ctx.user.id,
          pledgePrice: input.pledgePrice,
          minTickets: input.minTickets,
          expiresAt: input.expiresAt,
          happensAt: input.happensAt,
          endsAt: input.endsAt,
          title: input.title,
          description: input.description,
          location: input.location,
          imageUrl: input.imageUrl,
        })
        .returning();

      return res[0];
    }),

  fulfill: privateProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        pledges: z.array(z.string().cuid2()),
        hash: z.custom<`0x${string}`>(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db
        .update(events)
        .set({ status: Status.PENDING })
        .where(and(eq(events.id, input.id), eq(events.userId, ctx.user.id)))
        .returning();

      const evt = res[0];
      if (!evt) {
        throw new Error("Invalid event ID");
      }

      const pimlicoClient = getPimlicoClient();
      for (let i = 0; i < 3; i++) {
        try {
          const receipt = await pimlicoClient.waitForUserOperationReceipt({
            hash: input.hash,
            timeout: 60_000,
          });
          if (!receipt.success) {
            throw new Error("UserOperation failed: " + receipt.reason);
          }
          // Update accepted bids
          await ctx.db
            .update(pledges)
            .set({ accepted: true })
            .where(inArray(pledges.id, input.pledges))
            .returning();

          // Update event status
          await ctx.db
            .update(events)
            .set({
              status: Status.COMPLETED,
            })
            .where(eq(events.id, input.id));

          return receipt;
        } catch (err) {
          if (err instanceof Error) {
          }
          const status = await pimlicoClient.getUserOperationStatus({
            hash: input.hash,
          });
          switch (status.status) {
            case "not_found":
            case "reverted":
            case "rejected":
            case "failed":
              // Update proposal status
              await ctx.db
                .update(events)
                .set({
                  status: Status.ACTIVE,
                })
                .where(eq(events.id, input.id))
                .returning();
              throw new Error("UserOp failed: " + status.status);
            default:
              break;
          }
        }
      }
      throw new Error("UserOp timed out");
    }),

  filter: privateProcedure
    .input(
      z.object({
        direction: directionFilterSchema.optional(),
        query: queryFilterSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const q = input.query ?? "explore";
      const d = input.direction ?? (q === "explore" ? "desc" : "asc");
      const sortDate = q === "explore" ? events.createdAt : events.happensAt;
      let s: EventStatus[] = [];
      switch (q) {
        case "created":
          s = ["active", "pending", "completed", "expired", "canceled"];
          break;
        case "attending":
          s = ["completed"];
          break;
        default: // explore, pledged
          s = ["active", "expired"];
          break;
      }
      const res = await ctx.db.query.events.findMany({
        where: inArray(events.status, s),
        orderBy: d === "asc" ? asc(sortDate) : desc(sortDate),
      });

      // Check for expired events and update status
      const expired = res.filter(
        (event) =>
          event.status === Status.ACTIVE && event.expiresAt < new Date(),
      );
      if (expired.length > 0) {
        // update status before returning response to client
        for (const event of res) {
          if (expired.find((e) => e.id === event.id)) {
            event.status = Status.EXPIRED;
          }
        }
        // actually update the database
        try {
          await ctx.db
            .update(events)
            .set({
              status: Status.EXPIRED,
            })
            .where(
              inArray(
                events.id,
                expired.map((event) => event.id),
              ),
            );
        } catch (error) {
          console.error(error);
        }
      }

      switch (q) {
        case "created":
          return res.filter((event) => event.userId === ctx.user.id);
        case "attending":
          const acceptedPledges = await ctx.db.query.pledges.findMany({
            where: and(
              eq(pledges.accepted, true),
              or(
                and(eq(pledges.attendeeId, ctx.user.id)),
                and(
                  isNull(pledges.attendeeId),
                  eq(pledges.userId, ctx.user.id),
                ),
              ),
            ),
          });
          return res.filter((event) =>
            acceptedPledges.some((p) => p.eventId === event.id),
          );
        case "pledged":
          const userPledges = await ctx.db.query.pledges.findMany({
            where: or(
              and(eq(pledges.attendeeId, ctx.user.id)),
              and(isNull(pledges.attendeeId), eq(pledges.userId, ctx.user.id)),
            ),
          });
          const userPledgedEvents = userPledges.map((p) => p.eventId);
          return res.filter((event) => userPledgedEvents.includes(event.id));
        default:
          return res;
      }
    }),

  byStatus: publicProcedure
    .input(
      z.object({
        status: z.custom<EventStatus>(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.events.findMany({
        where: and(eq(events.status, input.status)),
        orderBy: asc(events.happensAt),
      });
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.events.findFirst({
        where: and(eq(events.id, input.id)),
      });
    }),

  update: privateProcedure
    .input(
      z.object({
        id: z.string().cuid2(),
        title: z.string().min(10).max(PROPOSAL_NAME_MAX_LENGTH).optional(),
        description: z.string().max(DESCRIPTION_MAX_LENGTH).optional(),
        imageUrl: z.string().optional(),
        location: z.string().max(LOCATION_MAX_LENGTH).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const res = await ctx.db
        .update(events)
        .set(updateData)
        .where(and(eq(events.id, id), eq(events.userId, ctx.user.id)))
        .returning();

      if (res.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found or you don't have permission to update it",
        });
      }
      return res[0];
    }),

  cancel: privateProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db
        .update(events)
        .set({ status: Status.CANCELED })
        .where(
          and(
            eq(events.id, input.id),
            eq(events.userId, ctx.user.id),
            eq(events.status, Status.ACTIVE),
          ),
        )
        .returning();

      if (res.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found or not eligible for cancellation",
        });
      }

      const ev = res[0]!;

      return ev;
    }),

  // Get proposals the user has created
  byMe: privateProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.events.findMany({
      where: eq(events.userId, ctx.user.id),
      orderBy: asc(events.expiresAt),
    });
  }),

  attending: privateProcedure.query(async ({ ctx }) => {
    const { walletAddress } = ctx.user.publicMetadata;
    if (!walletAddress) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "You must have a gator wallet to create a proposal",
      });
    }

    const tickets = await getProposalNFTs(walletAddress);
    if (tickets.length === 0) {
      return [];
    }
    const eventsWithNFTs = await ctx.db.query.events.findMany({
      where: and(
        inArray(
          events.proposalAddress,
          tickets.map((t) => t.proposalId as `0x${string}`),
        ),
        eq(events.userId, ctx.user.id),
      ),
      orderBy: asc(events.expiresAt),
    });
    return eventsWithNFTs;
  }),

  pledges: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }) => {
      const _pledges = await ctx.db.query.pledges.findMany({
        where: eq(pledges.eventId, input.id),
      });

      if (!ctx.auth.userId) {
        return {
          count: _pledges.length,
          mine: null,
        };
      }

      const user = await clerkClient().users.getUser(ctx.auth.userId);

      if (!user) {
        return {
          count: _pledges.length,
          mine: null,
        };
      }

      const myPledge = _pledges.find((p) => {
        if (p.attendeeId) {
          return p.attendeeId === user.id;
        }
        return p.userId === user.id;
      });

      return {
        count: _pledges.length,
        mine: myPledge,
      };
    }),
});
