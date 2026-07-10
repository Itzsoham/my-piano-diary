/**
 * Shared attendance-grid math for monthly reports.
 *
 * Extracted from the single-student report view so the combined family sheet
 * lays out weeks identically. Crucially, `resolveWeeks` takes the UNION across
 * students: if ANY student has a 6th week that month, every row shows 6 week
 * columns so the rows stay aligned.
 */

import { getWeekOfMonth, getDate } from "date-fns";

/** Minimal lesson shape the attendance grid needs. */
export interface AttendanceLesson {
  date: Date;
  status: string;
  cancelReason?: string | null;
}

export interface WeekCell {
  day: number;
  status: string;
  cancelReason?: string | null;
}

/** Lessons bucketed by week-of-month (1-6). */
export type WeeksData = Record<number, WeekCell[]>;

/** Bucket a student's lessons into weeks 1-6 (week starts on Monday). */
export const buildWeeksData = (lessons: AttendanceLesson[]): WeeksData => {
  const weeksData: WeeksData = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  lessons.forEach((lesson) => {
    const week = getWeekOfMonth(lesson.date, { weekStartsOn: 1 });
    const day = getDate(lesson.date);
    const status = lesson.status ?? "PENDING";
    if (weeksData[week]) {
      weeksData[week].push({ day, status, cancelReason: lesson.cancelReason });
    }
  });

  return weeksData;
};

/** Whether a bucketed month actually uses a 6th week. */
export const hasSixthWeek = (weeksData: WeeksData): boolean =>
  Boolean(weeksData[6] && weeksData[6].length > 0);

/**
 * The week columns to render. Pass one WeeksData for a single student, or many
 * for a family: the result is [1..6] if ANY of them has a 6th week, else [1..5].
 */
export const resolveWeeks = (weeksList: WeeksData[]): number[] =>
  weeksList.some(hasSixthWeek) ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
