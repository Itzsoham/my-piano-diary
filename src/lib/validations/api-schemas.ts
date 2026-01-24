import { z } from "zod";

/**
 * Student validation schemas
 */
export const createStudentSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  avatar: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional(),
});

export const updateStudentSchema = z.object({
  id: z.string().uuid("Invalid student ID"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim()
    .optional(),
  avatar: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional(),
});

export const deleteStudentSchema = z.object({
  id: z.string().uuid("Invalid student ID"),
});

export const getStudentSchema = z.object({
  id: z.string().uuid("Invalid student ID"),
});

/**
 * Piece validation schemas
 */
export const createPieceSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  level: z.string().max(50, "Level must be less than 50 characters").optional(),
});

export const updatePieceSchema = z.object({
  id: z.string().uuid("Invalid piece ID"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  level: z.string().max(50, "Level must be less than 50 characters").optional(),
});

export const deletePieceSchema = z.object({
  id: z.string().uuid("Invalid piece ID"),
});

export const getPieceSchema = z.object({
  id: z.string().uuid("Invalid piece ID"),
});

/**
 * Lesson validation schemas
 */
export const createLessonSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  date: z
    .date()
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: "Invalid date",
    }),
  duration: z
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration must be less than 8 hours"),
  pieceId: z.string().uuid("Invalid piece ID").optional(),
});

export const updateLessonSchema = z.object({
  id: z.string().uuid("Invalid lesson ID"),
  date: z
    .date()
    .refine((date) => date instanceof Date && !isNaN(date.getTime()), {
      message: "Invalid date",
    })
    .optional(),
  duration: z
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration must be less than 8 hours")
    .optional(),
  status: z.enum(["COMPLETE", "MAKEUP", "CANCELLED"]).optional(),
  cancelReason: z
    .string()
    .max(500, "Cancel reason must be less than 500 characters")
    .optional(),
});

export const deleteLessonSchema = z.object({
  id: z.string().uuid("Invalid lesson ID"),
});

export const getMonthLessonsSchema = z.object({
  year: z
    .number()
    .int()
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
  month: z
    .number()
    .int()
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
});

/**
 * Attendance validation schemas
 */
export const markAttendanceSchema = z.object({
  lessonId: z.string().uuid("Invalid lesson ID"),
  status: z.enum(["PRESENT", "ABSENT", "MAKEUP"]),
  actualMin: z
    .number()
    .int()
    .min(0, "Actual minutes must be positive")
    .max(480, "Actual minutes must be less than 8 hours"),
  reason: z
    .string()
    .max(500, "Reason must be less than 500 characters")
    .optional(),
  note: z
    .string()
    .max(1000, "Note must be less than 1000 characters")
    .optional(),
});

/**
 * Report validation schemas
 */
export const getStudentReportSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  month: z
    .number()
    .int()
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  year: z
    .number()
    .int()
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
});

export const upsertReportSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  month: z
    .number()
    .int()
    .min(1, "Month must be between 1 and 12")
    .max(12, "Month must be between 1 and 12"),
  year: z
    .number()
    .int()
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier"),
  summary: z
    .string()
    .max(2000, "Summary must be less than 2000 characters")
    .optional(),
  comments: z
    .string()
    .max(2000, "Comments must be less than 2000 characters")
    .optional(),
  nextMonthPlan: z
    .string()
    .max(2000, "Next month plan must be less than 2000 characters")
    .optional(),
});

/**
 * User profile validation schemas
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .trim()
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters")
    .optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
});

export const updateTeacherRateSchema = z.object({
  hourlyRate: z
    .number()
    .min(0, "Hourly rate must be positive")
    .max(10000, "Hourly rate seems unreasonably high"),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type DeleteStudentInput = z.infer<typeof deleteStudentSchema>;
export type GetStudentInput = z.infer<typeof getStudentSchema>;

export type CreatePieceInput = z.infer<typeof createPieceSchema>;
export type UpdatePieceInput = z.infer<typeof updatePieceSchema>;
export type DeletePieceInput = z.infer<typeof deletePieceSchema>;
export type GetPieceInput = z.infer<typeof getPieceSchema>;

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type DeleteLessonInput = z.infer<typeof deleteLessonSchema>;
export type GetMonthLessonsInput = z.infer<typeof getMonthLessonsSchema>;

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

export type GetStudentReportInput = z.infer<typeof getStudentReportSchema>;
export type UpsertReportInput = z.infer<typeof upsertReportSchema>;

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateTeacherRateInput = z.infer<typeof updateTeacherRateSchema>;
