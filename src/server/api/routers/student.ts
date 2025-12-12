import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

export const studentRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.student.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), teacherId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.student.create({
        data: {
          name: input.name,
          teacher: { connect: { id: input.teacherId } },
        },
      });
    }),
});
