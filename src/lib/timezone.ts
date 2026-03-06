/**
 * Timezone utility functions for consistent date/time handling across the app
 *
 * Architecture:
 * - Database stores UTC timestamps
 * - User/Teacher has timezone preference (IANA timezone string)
 * - Client sends timezone with requests
 * - Server converts between UTC and user timezone
 */

import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz";

/**
 * Get the browser's timezone
 * @returns IANA timezone string (e.g., "Asia/Kolkata", "America/New_York")
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert a date in a specific timezone to UTC
 * Use this when saving to database
 *
 * @param date - Date object in user's timezone
 * @param timezone - IANA timezone string
 * @returns Date object in UTC
 *
 * @example
 * // User in Vietnam selects Feb 4, 18:30
 * const localDate = new Date(2026, 1, 4, 18, 30);
 * const utcDate = toUTC(localDate, "Asia/Ho_Chi_Minh");
 * // Result: 2026-02-04T11:30:00.000Z (UTC)
 */
export function toUTC(date: Date, timezone: string): Date {
  return fromZonedTime(date, timezone);
}

/**
 * Convert a UTC date to a specific timezone
 * Use this when displaying to user
 *
 * @param utcDate - Date object in UTC (from database)
 * @param timezone - IANA timezone string
 * @returns Date object in user's timezone
 *
 * @example
 * // Database has: 2026-02-04T11:30:00.000Z
 * const utcDate = new Date("2026-02-04T11:30:00.000Z");
 * const localDate = fromUTC(utcDate, "Asia/Kolkata");
 * // User in India sees: Feb 4, 17:00
 */
export function fromUTC(utcDate: Date, timezone: string): Date {
  return toZonedTime(utcDate, timezone);
}

/**
 * Get start of day (00:00:00) in a specific timezone, returned as UTC
 *
 * @param date - Any date
 * @param timezone - IANA timezone string
 * @returns UTC date representing start of day in that timezone
 *
 * @example
 * // User wants lessons for Feb 4 in Vietnam
 * const startOfDay = getStartOfDayUTC(new Date(2026, 1, 4), "Asia/Ho_Chi_Minh");
 * // Returns: 2026-02-03T17:00:00.000Z (which is Feb 4 00:00 in Vietnam)
 */
export function getStartOfDayUTC(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  const startOfDay = new Date(zonedDate);
  startOfDay.setHours(0, 0, 0, 0);
  return fromZonedTime(startOfDay, timezone);
}

/**
 * Get end of day (23:59:59.999) in a specific timezone, returned as UTC
 *
 * @param date - Any date
 * @param timezone - IANA timezone string
 * @returns UTC date representing end of day in that timezone
 */
export function getEndOfDayUTC(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone);
  const endOfDay = new Date(zonedDate);
  endOfDay.setHours(23, 59, 59, 999);
  return fromZonedTime(endOfDay, timezone);
}

/**
 * Format a UTC date for display in a specific timezone
 *
 * @param utcDate - Date in UTC
 * @param timezone - IANA timezone string
 * @param formatString - date-fns format string
 * @returns Formatted string
 *
 * @example
 * const utcDate = new Date("2026-02-04T11:30:00.000Z");
 * formatInTimezone(utcDate, "Asia/Kolkata", "PPp");
 * // Returns: "Feb 4, 17:00 PM"
 */
export function formatInTimezone(
  utcDate: Date,
  timezone: string,
  formatString = "PPp",
): string {
  return formatTz(utcDate, formatString, { timeZone: timezone });
}

/**
 * Create a date in a specific timezone
 * Useful when user selects date/time from UI
 *
 * @param year
 * @param month - 0-indexed (0 = January)
 * @param day
 * @param hour
 * @param minute
 * @param timezone - IANA timezone string
 * @returns UTC date
 *
 * @example
 * // User in Vietnam selects Feb 4, 18:30
 * const utcDate = createDateInTimezone(2026, 1, 4, 18, 30, "Asia/Ho_Chi_Minh");
 * // Returns UTC date that represents Feb 4, 18:30 Vietnam time
 */
export function createDateInTimezone(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  timezone: string,
): Date {
  // Create date string in ISO format without timezone
  const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;

  // Create date as if it were in the specified timezone
  const localDate = new Date(dateString);

  // Convert to UTC
  return fromZonedTime(localDate, timezone);
}

/**
 * Get start of month (1st day, 00:00:00) in a specific timezone, returned as UTC
 *
 * @param month - 1-indexed (1 = January, 12 = December)
 * @param year - Full year
 * @param timezone - IANA timezone string
 * @returns UTC date representing start of month in that timezone
 *
 * @example
 * // Get start of February 2026 in Vietnam timezone
 * const startOfMonth = getStartOfMonthUTC(2, 2026, "Asia/Ho_Chi_Minh");
 * // Returns: 2026-01-31T17:00:00.000Z (which is Feb 1 00:00 in Vietnam)
 */
export function getStartOfMonthUTC(
  month: number,
  year: number,
  timezone: string,
): Date {
  return createDateInTimezone(year, month - 1, 1, 0, 0, timezone);
}

/**
 * Get end of month (last day, 23:59:59.999) in a specific timezone, returned as UTC
 *
 * @param month - 1-indexed (1 = January, 12 = December)
 * @param year - Full year
 * @param timezone - IANA timezone string
 * @returns UTC date representing end of month in that timezone
 *
 * @example
 * // Get end of February 2026 in Vietnam timezone
 * const endOfMonth = getEndOfMonthUTC(2, 2026, "Asia/Ho_Chi_Minh");
 * // Returns: 2026-03-02T16:59:59.999Z (which is Feb 28 23:59:59.999 in Vietnam)
 */
export function getEndOfMonthUTC(
  month: number,
  year: number,
  timezone: string,
): Date {
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;

  // Start of next month in user's timezone
  const nextMonthStart = createDateInTimezone(
    nextMonthYear,
    nextMonth - 1,
    1,
    0,
    0,
    timezone,
  );

  // Subtract 1ms to get the last millisecond of the current month in UTC
  return new Date(nextMonthStart.getTime() - 1);
}

/**
 * Check if two dates are the same day in a specific timezone
 *
 * @param date1
 * @param date2
 * @param timezone
 * @returns true if same day in that timezone
 */
export function isSameDayInTimezone(
  date1: Date,
  date2: Date,
  timezone: string,
): boolean {
  const d1 = fromUTC(date1, timezone);
  const d2 = fromUTC(date2, timezone);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Validate if a string is a valid IANA timezone
 *
 * @param timezone - String to validate
 * @returns true if valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Common timezones for quick selection
 */
export const COMMON_TIMEZONES = [
  { label: "India Standard Time", value: "Asia/Kolkata" },
  { label: "Vietnam Time", value: "Asia/Ho_Chi_Minh" },
  { label: "Singapore Time", value: "Asia/Singapore" },
  { label: "China Standard Time", value: "Asia/Shanghai" },
  { label: "Japan Standard Time", value: "Asia/Tokyo" },
  { label: "Eastern Time (US)", value: "America/New_York" },
  { label: "Pacific Time (US)", value: "America/Los_Angeles" },
  { label: "Central European Time", value: "Europe/Paris" },
  { label: "British Time", value: "Europe/London" },
  { label: "UTC", value: "UTC" },
] as const;
