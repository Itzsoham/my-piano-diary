import { studentRouter } from "@/server/api/routers/student";
import { lessonRouter } from "@/server/api/routers/lesson";
import { reportRouter } from "@/server/api/routers/report";
import { userRouter } from "@/server/api/routers/user";
import { pieceRouter } from "@/server/api/routers/piece";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  student: studentRouter,
  lesson: lessonRouter,
  report: reportRouter,
  user: userRouter,
  piece: pieceRouter,
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
