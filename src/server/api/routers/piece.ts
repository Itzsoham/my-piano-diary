import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  createPieceSchema,
  updatePieceSchema,
  idSchema,
} from "@/lib/validations/common-schemas";

export const pieceRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const teacher = await ctx.db.teacher.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!teacher) {
      return [];
    }

    return ctx.db.piece.findMany({
      where: {
        teacherId: teacher.id,
      },
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
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      const piece = await ctx.db.piece.findFirst({
        where: {
          id: input.id,
          teacherId: teacher.id,
        },
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
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      return ctx.db.piece.create({
        data: {
          teacher: { connect: { id: teacher.id } },
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

      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Verify piece belongs to teacher
      const piece = await ctx.db.piece.findFirst({
        where: {
          id,
          teacherId: teacher.id,
        },
      });

      if (!piece) {
        throw new Error("Piece not found");
      }

      return ctx.db.piece.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Verify piece belongs to teacher
      const piece = await ctx.db.piece.findFirst({
        where: {
          id: input.id,
          teacherId: teacher.id,
        },
      });

      if (!piece) {
        throw new Error("Piece not found");
      }

      return ctx.db.piece.delete({
        where: { id: input.id },
      });
    }),
});
