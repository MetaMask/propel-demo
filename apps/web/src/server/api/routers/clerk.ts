import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { clerkClient } from "@clerk/nextjs/server";
import type { PublicUser } from "@/lib/types";

export const clerkRouter = createTRPCRouter({
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await clerkClient().users.getUser(input.id);
      const email = user.primaryEmailAddress?.emailAddress;

      if (!email) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const walletAddress = user.publicMetadata?.walletAddress;

      const publicUser: PublicUser = {
        id: user.id,
        email,
        name: user.fullName ?? undefined,
        imageUrl: user.imageUrl,
        walletAddress,
      };

      return publicUser;
    }),

  map: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .query(async ({ input }) => {
      if (!input.ids.length) {
        return new Map<string, PublicUser>();
      }
      const users = await clerkClient().users.getUserList({
        userId: input.ids,
      });
      const publicUsers = users.data
        .map((u) => ({
          id: u.id,
          email: u.primaryEmailAddress?.emailAddress,
          name: u.fullName ?? undefined,
          imageUrl: u.imageUrl,
          walletAddress: u.publicMetadata?.walletAddress,
        }))
        .filter((u) => u.email);
      const userMap = new Map(publicUsers.map((u) => [u.id, u as PublicUser]));
      return userMap;
    }),

  updateWalletAddress: privateProcedure
    .input(
      z.object({
        walletAddress: z.custom<`0x${string}`>(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await clerkClient().users.updateUserMetadata(ctx.user.id, {
        publicMetadata: {
          walletAddress: input.walletAddress,
        },
      });
    }),
});
