import { z } from "zod";

/**
 * Attendance status types
 */
export type AttendanceStatus = "PRESENT" | "ABSENT" | "MAKEUP";

/**
 * Zod schema for attendance status
 */
export const attendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "MAKEUP"]);
