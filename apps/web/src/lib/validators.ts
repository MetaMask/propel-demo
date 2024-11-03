import type deployedContracts from "@/contracts/deployedContracts";
import { z } from "zod";

export const chainIdSchema = z.custom<keyof typeof deployedContracts>();

export const delegationSchema = z.object({
  delegate: z.custom<`0x${string}`>(),
  delegator: z.custom<`0x${string}`>(),
  authority: z.custom<`0x${string}`>(),
  caveats: z.array(
    z.object({
      enforcer: z.custom<`0x${string}`>(),
      terms: z.custom<`0x${string}`>(),
      args: z.custom<`0x${string}`>(),
    }),
  ),
  salt: z.bigint(),
  signature: z.custom<`0x${string}`>(),
});

// For filtering events
export const directionFilterSchema = z.enum(["asc", "desc"]);
export const queryFilterSchema = z.enum([
  "explore",
  "created",
  "pledged",
  "attending",
]);

export const searchParamsSchema = z.object({
  q: queryFilterSchema.optional(),
  d: directionFilterSchema.optional(),
});
