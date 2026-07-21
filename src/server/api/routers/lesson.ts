import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  createLessonSchema,
  updateLessonSchema,
  idSchema,
  lessonStatusSchema,
} from "@/lib/validations/common-schemas";
import {
  markAttendanceSchema,
  createRecurringLessonSchema,
} from "@/lib/validations/api-schemas";
import {
  getStartOfMonthUTC,
  getEndOfMonthUTC,
  createDateInTimezone,
} from "@/lib/timezone";
import { effectiveLessonRate } from "@/lib/rate";

export const lessonRouter = createTRPCRouter({
  // Get all lessons with filters
  getAll: protectedProcedure
    .input(
      z.object({
        studentId: idSchema.optional(),
        from: z.date().optional(),
        to: z.date().optional(),
        status: lessonStatusSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [];
      }

      const dateFilter =
        input.from || input.to
          ? {
              date: {
                ...(input.from && { gte: input.from }),
                ...(input.to && { lte: input.to }),
              },
            }
          : {};

      return ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          ...(input.studentId && { studentId: input.studentId }),
          ...(input.status && { status: input.status }),
          ...dateFilter,
        },
        include: {
          student: true,
          piece: true,
        },
        orderBy: { date: "desc" },
      });
    }),
  // Get lessons for a specific month
  getForMonth: protectedProcedure
    .input(
      z.object({
        year: z.number().int().min(1900).max(2100),
        month: z.number().int().min(1).max(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const timezone = ctx.session.user.timezone ?? "UTC";
      const startDate = getStartOfMonthUTC(input.month, input.year, timezone);
      const endDate = getEndOfMonthUTC(input.month, input.year, timezone);

      // Get teacher
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [];
      }

      return ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          piece: true,
        },
        orderBy: {
          date: "asc",
        },
      });
    }),

  // Get lessons for a specific date range
  getInRange: protectedProcedure
    .input(
      z.object({
        start: z.date(),
        end: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        return [];
      }

      return ctx.db.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: input.start,
            lte: input.end,
          },
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          piece: true,
        },
        orderBy: {
          date: "asc",
        },
      });
    }),

  // Create a new lesson
  create: protectedProcedure
    .input(createLessonSchema)
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Verify student belongs to teacher
      const student = await ctx.db.student.findFirst({
        where: {
          id: input.studentId,
          teacherId: teacher.id,
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      // Verify piece belongs to teacher if pieceId is provided
      if (input.pieceId) {
        const piece = await ctx.db.piece.findFirst({
          where: {
            id: input.pieceId,
            teacherId: teacher.id,
          },
        });

        if (!piece) {
          throw new Error("Piece not found");
        }
      }

      // Check for duplicate lesson at the same date/time for this student
      const existingLesson = await ctx.db.lesson.findFirst({
        where: {
          studentId: input.studentId,
          date: input.date,
        },
      });

      if (existingLesson) {
        const lessonTime = input.date.toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        throw new Error(
          `A lesson already exists for this student on ${lessonTime}. Please choose a different date or time.`,
        );
      }

      return ctx.db.lesson.create({
        data: {
          studentId: input.studentId,
          teacherId: teacher.id,
          date: input.date, // Date is already in UTC from client serialization
          duration: input.duration,
          status: "PENDING",
          isOnline: input.isOnline,
          // Snapshot the applicable rate onto the lesson so history stays frozen.
          rate: effectiveLessonRate(student, input.isOnline),
          pieceId: input.pieceId,
        },
        include: {
          student: true,
        },
      });
    }),

  // Update lesson
  update: protectedProcedure
    .input(updateLessonSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Verify lesson belongs to teacher
      const lesson = await ctx.db.lesson.findFirst({
        where: {
          id,
          teacherId: teacher.id,
        },
      });

      if (!lesson) {
        throw new Error("Lesson not found");
      }

      // Verify piece belongs to teacher if pieceId is being updated
      if (data.pieceId !== undefined && data.pieceId !== null) {
        const piece = await ctx.db.piece.findFirst({
          where: {
            id: data.pieceId,
            teacherId: teacher.id,
          },
        });

        if (!piece) {
          throw new Error("Piece not found");
        }
      }

      // Toggling a lesson's online flag re-stamps its rate to the student's
      // CURRENT applicable rate — even on older lessons (a deliberate per-lesson
      // change, unlike a bulk student-rate edit which leaves the past frozen).
      let onlinePatch: { isOnline: boolean; rate: number } | undefined;
      if (data.isOnline !== undefined) {
        const student = await ctx.db.student.findUnique({
          where: { id: lesson.studentId },
          select: { lessonRate: true, onlineLessonRate: true },
        });

        if (student) {
          onlinePatch = {
            isOnline: data.isOnline,
            rate: effectiveLessonRate(student, data.isOnline),
          };
        }
      }

      return ctx.db.lesson.update({
        where: { id },
        data: {
          ...(data.date && { date: data.date }),
          ...(data.duration && { duration: data.duration }),
          ...(data.status && { status: data.status }),
          ...(data.pieceId !== undefined && { pieceId: data.pieceId }),
          ...onlinePatch,
        },
        include: {
          student: true,
        },
      });
    }),

  // Delete lesson
  delete: protectedProcedure
    .input(z.object({ id: idSchema }))
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Verify lesson belongs to teacher
      const lesson = await ctx.db.lesson.findFirst({
        where: {
          id: input.id,
          teacherId: teacher.id,
        },
      });

      if (!lesson) {
        throw new Error("Lesson not found");
      }

      return ctx.db.lesson.delete({
        where: { id: input.id },
      });
    }),

  // Mark attendance
  markAttendance: protectedProcedure
    .input(markAttendanceSchema)
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Verify lesson belongs to teacher
      const lesson = await ctx.db.lesson.findFirst({
        where: {
          id: input.lessonId,
          teacherId: teacher.id,
        },
      });

      if (!lesson) {
        throw new Error("Lesson not found");
      }

      // Rate handling, in priority order:
      // 1. An explicit per-lesson rate override always wins.
      // 2. Otherwise, flipping online/in-person re-derives from the student rate.
      const ratePatch: { isOnline?: boolean; rate?: number } = {};
      if (input.isOnline !== undefined) {
        ratePatch.isOnline = input.isOnline;
      }
      if (input.rate !== undefined) {
        ratePatch.rate = input.rate;
      } else if (input.isOnline !== undefined) {
        const student = await ctx.db.student.findUnique({
          where: { id: lesson.studentId },
          select: { lessonRate: true, onlineLessonRate: true },
        });

        if (student) {
          ratePatch.rate = effectiveLessonRate(student, input.isOnline);
        }
      }

      // Score only makes sense on a COMPLETE lesson — clear it whenever the
      // status moves away from COMPLETE, otherwise apply whatever the
      // teacher sent (a number to rate it, null to leave it unrated).
      const scorePatch: { score?: number | null } =
        input.status !== "COMPLETE"
          ? { score: null }
          : input.score !== undefined
            ? { score: input.score }
            : {};

      // Update lesson with attendance information
      return ctx.db.lesson.update({
        where: {
          id: input.lessonId,
        },
        data: {
          status: input.status,
          actualMin: input.actualMin,
          cancelReason: input.cancelReason,
          note: input.note,
          ...ratePatch,
          ...scorePatch,
        },
        include: {
          student: true,
          piece: true,
        },
      });
    }),

  // Create recurring lessons
  createRecurring: protectedProcedure
    .input(createRecurringLessonSchema)
    .mutation(async ({ ctx, input }) => {
      const teacher = await ctx.db.teacher.findUnique({
        where: { userId: ctx.session.user.id },
      });

      if (!teacher) {
        throw new Error("Teacher not found");
      }

      // Verify student belongs to teacher
      const student = await ctx.db.student.findFirst({
        where: {
          id: input.studentId,
          teacherId: teacher.id,
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      // Verify piece belongs to teacher if pieceId is provided
      if (input.pieceId) {
        const piece = await ctx.db.piece.findFirst({
          where: {
            id: input.pieceId,
            teacherId: teacher.id,
          },
        });

        if (!piece) {
          throw new Error("Piece not found");
        }
      }

      const lessonsToCreate = [];
      const timezone = input.timezone;

      // Parse date string and time
      const [year = 0, month = 1, day = 1] = input.startDate
        .split("-")
        .map(Number);
      const [hours = 0, minutes = 0] = input.time.split(":").map(Number);

      // Walk the recurrence on a UTC "civil calendar" cursor (Date.UTC plus the
      // getUTC*/setUTC* methods) so the weekday and day arithmetic never depend
      // on the server's own timezone. Each matched civil day is then converted
      // to a real UTC instant in the user's timezone via createDateInTimezone.
      // (Previously this built a local Date but read/mutated it with
      // getUTCDay/setUTCDate/setUTCHours, so occurrences shifted by the host
      // offset on any non-UTC host — correct on Vercel, wrong in local dev.)
      const endCursor = new Date(Date.UTC(year, month - 1, day));
      endCursor.setUTCMonth(endCursor.getUTCMonth() + input.recurrenceMonths);

      const startWeekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
      const daysUntilTarget = (input.dayOfWeek - startWeekday + 7) % 7;

      // First occurrence: the given date if it already falls on the target
      // weekday, otherwise the next matching weekday after it.
      const cursor = new Date(Date.UTC(year, month - 1, day));
      cursor.setUTCDate(cursor.getUTCDate() + daysUntilTarget);

      // Collect all lesson dates by walking week by week.
      const potentialDates: Date[] = [];
      while (cursor < endCursor) {
        potentialDates.push(
          createDateInTimezone(
            cursor.getUTCFullYear(),
            cursor.getUTCMonth(),
            cursor.getUTCDate(),
            hours,
            minutes,
            timezone,
          ),
        );
        cursor.setUTCDate(cursor.getUTCDate() + 7);
      }

      // Check for existing lessons at these dates
      const existingLessons = await ctx.db.lesson.findMany({
        where: {
          studentId: input.studentId,
          date: {
            in: potentialDates,
          },
        },
        select: {
          date: true,
        },
      });

      // If there are conflicts, throw an error with details
      if (existingLessons.length > 0) {
        const conflictDates = existingLessons
          .map((lesson) =>
            lesson.date.toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          )
          .join(", ");

        throw new Error(
          `Cannot create recurring lessons. ${existingLessons.length} lesson(s) already exist at: ${conflictDates}. Please choose a different day or time.`,
        );
      }

      // No conflicts, create all lessons
      const recurringRate = effectiveLessonRate(student, input.isOnline);
      for (const lessonDate of potentialDates) {
        lessonsToCreate.push({
          studentId: input.studentId,
          teacherId: teacher.id,
          date: lessonDate,
          duration: input.duration,
          status: "PENDING" as const,
          isOnline: input.isOnline,
          rate: recurringRate,
          pieceId: input.pieceId,
        });
      }

      if (lessonsToCreate.length === 0) {
        throw new Error(
          "No lessons to create. The date range may be too short or invalid.",
        );
      }

      // Bulk create
      await ctx.db.lesson.createMany({
        data: lessonsToCreate,
      });

      return { count: lessonsToCreate.length };
    }),
});
