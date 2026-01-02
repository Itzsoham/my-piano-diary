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
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });
  }),

  getByGuid: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const student = await ctx.db.student.findUnique({
        where: { id: input.id },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          lessons: {
            orderBy: { date: "desc" },
            take: 10,
          },
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      return student;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        teacherId: z.string(),
        avatar: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.student.create({
        data: {
          name: input.name,
          avatar: input.avatar,
          notes: input.notes,
          teacher: { connect: { id: input.teacherId } },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        avatar: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      return ctx.db.student.update({
        where: { id },
        data,
      });
    }),
});
