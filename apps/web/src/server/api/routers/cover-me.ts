import { clerkClient } from "@clerk/nextjs/server";
import { createTRPCRouter, privateProcedure, publicProcedure } from "../trpc";
import { coverMe, events } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const coverMeRouter = createTRPCRouter({
  create: privateProcedure
    .input(z.object({ eventId: z.string().cuid2() }))
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.query.events.findFirst({
        where: eq(events.id, input.eventId),
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      const existingRequest = await ctx.db.query.coverMe.findFirst({
        where: and(
          eq(coverMe.eventId, input.eventId),
          eq(coverMe.requesterId, ctx.user.id),
        ),
      });

      if (existingRequest) {
        return existingRequest;
      }

      const requester = await clerkClient.users.getUser(ctx.user.id);

      const [coverMeRequest] = await ctx.db
        .insert(coverMe)
        .values({
          eventId: input.eventId,
          requesterId: ctx.user.id,
          requesterAddress: requester.publicMetadata.walletAddress!,
        })
        .returning();

      return coverMeRequest;
    }),

  get: publicProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ ctx, input }) => {
      const request = await ctx.db.query.coverMe.findFirst({
        where: eq(coverMe.id, input.id),
        with: {
          event: true,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cover request not found",
        });
      }

      if (!request.event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      return request;
    }),
});
