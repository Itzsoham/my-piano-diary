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
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

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
          date: input.date,
          duration: input.duration,
          status: "PENDING",
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

      return ctx.db.lesson.update({
        where: { id },
        data: {
          ...(data.date && { date: data.date }),
          ...(data.duration && { duration: data.duration }),
          ...(data.status && { status: data.status }),
          ...(data.pieceId !== undefined && { pieceId: data.pieceId }),
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

      // Parse date string manually
      const [year = 0, month = 1, day = 1] = input.startDate
        .split("-")
        .map(Number);
      const [hours = 0, minutes = 0] = input.time.split(":").map(Number);

      console.log("[SERVER DEBUG] Recurring lesson input:");
      console.log("  startDate:", input.startDate);
      console.log("  time:", input.time, "parsed:", { hours, minutes });
      console.log("  dayOfWeek:", input.dayOfWeek);
      console.log(
        "  timezoneOffset (client's offset from UTC):",
        input.timezoneOffset,
      );
      console.log(
        "  server timezone:",
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      );

      // Create date in UTC, then adjust for client's timezone
      // The client's timezoneOffset is in minutes (e.g., -330 for IST means UTC+5:30)
      // We need to create the date as if it were in the client's timezone
      //
      // Example: User in IST selects Wednesday 7:00 PM
      // - timezoneOffset = -330 (IST is UTC+5:30, so offset is -330)
      // - We want to store: Wednesday 7:00 PM IST = Wednesday 1:30 PM UTC
      // - UTC time = local time - offset = 19:00 - (-330 min) = 19:00 + 330 min = 13:30 UTC ✓

      // Create a UTC date string and parse it
      const utcDateString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00.000Z`;

      // Parse as UTC, then adjust for client's timezone offset
      const utcDate = new Date(utcDateString);
      // Add the timezone offset to convert from "client local time interpreted as UTC" to "actual UTC"
      // timezoneOffset is negative for east of UTC (e.g., -330 for IST)
      // So we ADD the offset to get UTC time
      utcDate.setMinutes(utcDate.getMinutes() + input.timezoneOffset);

      console.log("  utcDateString:", utcDateString);
      console.log("  utcDate after offset adjustment:", utcDate.toISOString());

      // For day-of-week calculation, we need to work in client's local timezone
      // Create dates that represent the client's local time
      const clientLocalStartOfDay = new Date(utcDateString);
      clientLocalStartOfDay.setUTCHours(0, 0, 0, 0);

      const recurrenceMonths = input.recurrenceMonths;

      // Calculate end date in client's local context (add months)
      const clientLocalEndDate = new Date(clientLocalStartOfDay);
      clientLocalEndDate.setUTCMonth(
        clientLocalEndDate.getUTCMonth() + recurrenceMonths,
      );

      // Start from the selected date/time in client's local context
      const currentClientLocal = new Date(utcDateString);

      console.log(
        "  clientLocalStartOfDay:",
        clientLocalStartOfDay.toISOString(),
      );
      console.log("  clientLocalEndDate:", clientLocalEndDate.toISOString());
      console.log("  currentClientLocal:", currentClientLocal.toISOString());

      // If currentDate day is not the target day, move forward (in client's local context)
      // Note: getUTCDay() gives us the day in UTC, which matches client's local day for the date string
      while (currentClientLocal.getUTCDay() !== input.dayOfWeek) {
        currentClientLocal.setUTCDate(currentClientLocal.getUTCDate() + 1);
      }

      console.log(
        "  firstMatch (client local context):",
        currentClientLocal.toISOString(),
      );

      // 2. Loop week by week and collect all potential dates (in client's local context)
      const potentialDates: Date[] = [];
      while (currentClientLocal < clientLocalEndDate) {
        // Convert from client local context to actual UTC by adding timezone offset
        const actualUtcDate = new Date(currentClientLocal);
        actualUtcDate.setMinutes(
          actualUtcDate.getMinutes() + input.timezoneOffset,
        );
        potentialDates.push(actualUtcDate);
        currentClientLocal.setUTCDate(currentClientLocal.getUTCDate() + 7);
      }

      console.log(
        "  potentialDates (UTC):",
        potentialDates.map((date) => date.toISOString()),
      );
      console.log(
        "  potentialDates (client local display):",
        potentialDates.map((date) => {
          // Show what these dates look like in client's timezone
          const localDate = new Date(date);
          localDate.setMinutes(localDate.getMinutes() - input.timezoneOffset);
          return `${localDate.toISOString()} (UTC) -> day ${localDate.getUTCDay()}`;
        }),
      );

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
      for (const lessonDate of potentialDates) {
        lessonsToCreate.push({
          studentId: input.studentId,
          teacherId: teacher.id,
          date: lessonDate,
          duration: input.duration,
          status: "PENDING" as const,
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
