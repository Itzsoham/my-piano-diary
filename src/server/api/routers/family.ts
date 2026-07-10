import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { idSchema } from "@/lib/validations/common-schemas";
import { getStartOfMonthUTC, getEndOfMonthUTC } from "@/lib/timezone";

const familyNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .trim();

// A family bundles at least two students so their sheets can be merged.
const memberIdsSchema = z
  .array(idSchema)
  .min(2, "A family needs at least 2 students")
  .max(20, "A family can have at most 20 students");

const monthSchema = z.number().int().min(1).max(12);
const yearSchema = z.number().int().min(2000).max(2100);

const memberInclude = {
  members: {
    orderBy: { position: "asc" as const },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          avatar: true,
          lessonRate: true,
          onlineLessonRate: true,
        },
      },
    },
  },
};

export const familyRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const teacher = await ctx.db.teacher.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!teacher) {
      return [];
    }

    return ctx.db.family.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: "desc" },
      include: memberInclude,
    });
  }),

  create: protectedProcedure
    .input(z.object({ name: familyNameSchema, memberIds: memberIdsSchema }))
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // De-dupe (defensive) and verify EVERY student belongs to this teacher.
      const uniqueIds = [...new Set(input.memberIds)];
      if (uniqueIds.length < 2) {
        throw new Error("A family needs at least 2 students");
      }
      const ownedCount = await ctx.db.student.count({
        where: { id: { in: uniqueIds }, teacherId: teacher.id },
      });
      if (ownedCount !== uniqueIds.length) {
        throw new Error("One or more students not found");
      }

      return ctx.db.family.create({
        data: {
          teacherId: teacher.id,
          name: input.name,
          members: {
            create: uniqueIds.map((studentId, index) => ({
              studentId,
              position: index,
            })),
          },
        },
        include: memberInclude,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: idSchema,
        name: familyNameSchema.optional(),
        memberIds: memberIdsSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      const family = await ctx.db.family.findFirst({
        where: { id: input.id, teacherId: teacher.id },
        select: { id: true },
      });

      if (!family) {
        throw new Error("Family not found");
      }

      let uniqueIds: string[] | null = null;
      if (input.memberIds) {
        uniqueIds = [...new Set(input.memberIds)];
        if (uniqueIds.length < 2) {
          throw new Error("A family needs at least 2 students");
        }
        const ownedCount = await ctx.db.student.count({
          where: { id: { in: uniqueIds }, teacherId: teacher.id },
        });
        if (ownedCount !== uniqueIds.length) {
          throw new Error("One or more students not found");
        }
      }

      const memberIds = uniqueIds;

      return ctx.db.$transaction(async (tx) => {
        await tx.family.update({
          where: { id: input.id },
          data: {
            ...(input.name !== undefined && { name: input.name }),
          },
        });

        // Rebuild the membership set so positions stay contiguous and ordered.
        if (memberIds) {
          await tx.familyMember.deleteMany({ where: { familyId: input.id } });
          await tx.familyMember.createMany({
            data: memberIds.map((studentId, index) => ({
              familyId: input.id,
              studentId,
              position: index,
            })),
          });
        }

        return tx.family.findUniqueOrThrow({
          where: { id: input.id },
          include: memberInclude,
        });
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

      const family = await ctx.db.family.findFirst({
        where: { id: input.id, teacherId: teacher.id },
        select: { id: true },
      });

      if (!family) {
        throw new Error("Family not found");
      }

      return ctx.db.family.delete({ where: { id: input.id } });
    }),

  // Combined monthly sheet for a whole family: each member's lessons for the
  // month + their frozen rates. The client reuses the shared tuition/attendance
  // libs so per-student totals and the grand total match the individual reports.
  getCombinedReport: protectedProcedure
    .input(
      z.object({
        familyId: idSchema,
        month: monthSchema,
        year: yearSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
        include: { user: true },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      const family = await ctx.db.family.findFirst({
        where: { id: input.familyId, teacherId: teacher.id },
        include: memberInclude,
      });

      if (!family) {
        throw new Error("Family not found");
      }

      const timezone = teacher.user.timezone ?? "UTC";
      const startDate = getStartOfMonthUTC(input.month, input.year, timezone);
      const endDate = getEndOfMonthUTC(input.month, input.year, timezone);

      const studentIds = family.members.map((member) => member.student.id);

      // One query for every member's lessons, then group in memory preserving
      // the family's member order.
      const lessons = studentIds.length
        ? await ctx.db.lesson.findMany({
            where: {
              studentId: { in: studentIds },
              date: { gte: startDate, lte: endDate },
            },
            orderBy: { date: "asc" },
          })
        : [];

      const lessonsByStudent = new Map<string, typeof lessons>();
      for (const lesson of lessons) {
        const list = lessonsByStudent.get(lesson.studentId) ?? [];
        list.push(lesson);
        lessonsByStudent.set(lesson.studentId, list);
      }

      return {
        family: { id: family.id, name: family.name },
        month: input.month,
        year: input.year,
        teacherName: teacher.user?.name ?? null,
        students: family.members.map((member) => ({
          id: member.student.id,
          name: member.student.name,
          avatar: member.student.avatar,
          inPersonRate: member.student.lessonRate,
          onlineRate: member.student.onlineLessonRate,
          lessons: lessonsByStudent.get(member.student.id) ?? [],
        })),
      };
    }),
});
