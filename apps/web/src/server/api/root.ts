import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { daimoRouter } from "./routers/daimo";
import { pledgeRouter } from "@/server/api/routers/pledge";
import { eventRouter } from "@/server/api/routers/event";
import { clerkRouter } from "@/server/api/routers/clerk";
import { coverMeRouter } from "./routers/cover-me";

export const appRouter = createTRPCRouter({
  daimo: daimoRouter,
  // new routers
  clerk: clerkRouter,
  pledge: pledgeRouter,
  event: eventRouter,
  coverMe: coverMeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
