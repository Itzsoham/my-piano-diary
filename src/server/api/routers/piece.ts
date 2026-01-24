import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const pieceRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.piece.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            lessons: true,
          },
        },
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const piece = await ctx.db.piece.findUnique({
        where: { id: input.id },
        include: {
          lessons: {
            orderBy: { date: "desc" },
            take: 10,
            include: {
              student: true,
            },
          },
          _count: {
            select: {
              lessons: true,
            },
          },
        },
      });

      if (!piece) {
        throw new Error("Piece not found");
      }

      return piece;
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        level: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.piece.create({
        data: {
          title: input.title,
          description: input.description,
          level: input.level,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        level: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      return ctx.db.piece.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.piece.delete({
        where: { id: input.id },
      });
    }),
});
