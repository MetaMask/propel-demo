import { generatePayment } from "@/lib/daimo";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const daimoRouter = createTRPCRouter({
  generatePayment: privateProcedure
    .input(z.object({ amount: z.number(), redirectUri: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const address = ctx.user.publicMetadata.walletAddress;
      if (!address) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You must link a valid wallet address to your account",
        });
      }
      const payment = await generatePayment({
        amount: input.amount,
        address,
        redirectUri: input.redirectUri,
      });
      return payment;
    }),
});
