import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  createPieceSchema,
  updatePieceSchema,
  idSchema,
} from "@/lib/validations/common-schemas";

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
    .input(z.object({ id: idSchema }))
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
    .input(createPieceSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.piece.create({
        data: {
          title: input.title,
          difficulty: input.difficulty,
          description: input.description,
        },
      });
    }),

  update: protectedProcedure
    .input(updatePieceSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      return ctx.db.piece.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.piece.delete({
        where: { id: input.id },
      });
    }),
});
