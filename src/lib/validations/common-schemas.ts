import { z } from "zod";

/**
 * Common validation schemas reusable across the app
 */

// ID validation
export const idSchema = z.string().min(1, "ID is required").trim();

export const uuidSchema = z.string().uuid("Invalid ID format");

// Common field validations
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")
  .toLowerCase()
  .trim();

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .trim();

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(100, "Password must be less than 100 characters");

export const dateSchema = z
  .union([z.date(), z.string().datetime()])
  .transform((d) => new Date(d));

export const dateStringSchema = z
  .string()
  .date("Invalid date format (YYYY-MM-DD)");

export const descriptionSchema = z
  .string()
  .max(1000, "Description must be less than 1000 characters")
  .trim()
  .optional();

// Pagination
export const paginationSchema = z.object({
  page: z
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),
  limit: z
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .optional()
    .default(10),
});

export const searchSchema = z.object({
  query: z
    .string()
    .max(100, "Search query must be less than 100 characters")
    .trim()
    .optional(),
});

// Status enums
export const lessonStatusSchema = z.enum(["PENDING", "COMPLETE", "CANCELLED"], {
  errorMap: () => ({ message: "Invalid lesson status" }),
});

// Student validation
export const createStudentSchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  phoneNumber: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, "Invalid phone number format")
    .max(20)
    .optional(),
  levelId: idSchema.optional(),
  notes: descriptionSchema,
  avatar: z.string().url().optional(),
});

export const updateStudentSchema = createStudentSchema.partial().extend({
  id: idSchema,
});

// Lesson validation
export const createLessonSchema = z.object({
  studentId: idSchema,
  date: dateSchema,
  duration: z
    .number()
    .int("Duration must be an integer")
    .min(15, "Lesson must be at least 15 minutes")
    .max(480, "Lesson must be at most 480 minutes"),
  status: lessonStatusSchema.optional(),
  pieceId: idSchema.optional(),
});

export const updateLessonSchema = z.object({
  id: idSchema,
  date: dateSchema.optional(),
  duration: z
    .number()
    .int("Duration must be an integer")
    .min(15, "Lesson must be at least 15 minutes")
    .max(480, "Lesson must be at most 480 minutes")
    .optional(),
  status: lessonStatusSchema.optional(),
});

// Piece validation
export const createPieceSchema = z.object({
  title: nameSchema,
  level: z.string().max(50, "Level must be less than 50 characters").optional(),
  description: descriptionSchema,
});

export const updatePieceSchema = createPieceSchema.partial().extend({
  id: idSchema,
});

// Attendance validation
// Attendance is now part of Lesson model, use lesson update schemas

// Report validation
export const createReportSchema = z.object({
  studentId: idSchema,
  lessonId: idSchema.optional(),
  title: nameSchema,
  content: z
    .string()
    .min(1, "Report content is required")
    .max(5000, "Report must be less than 5000 characters")
    .trim(),
  date: dateSchema.optional(),
});

export const updateReportSchema = createReportSchema.partial().extend({
  id: idSchema,
});

// User validation
export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  image: z.string().url("Invalid image URL").optional(),
});

// Batch operations
export const batchDeleteSchema = z.object({
  ids: z
    .array(idSchema, { errorMap: () => ({ message: "Invalid IDs array" }) })
    .min(1, "At least one ID is required")
    .max(100, "Cannot delete more than 100 items at once"),
});

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

/**
 * Helper function to validate data with a schema
 */
export const validate = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): ValidationResult<T> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join(".");
    errors[path] = error.message;
  });

  return { success: false, errors };
};

/**
 * Inferred types
 */
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type CreatePieceInput = z.infer<typeof createPieceSchema>;
export type UpdatePieceInput = z.infer<typeof updatePieceSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type BatchDeleteInput = z.infer<typeof batchDeleteSchema>;
