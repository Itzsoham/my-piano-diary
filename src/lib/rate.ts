/**
 * Rate helpers
 *
 * Money in this app is frozen per-lesson: every Lesson stores the đ `rate` it
 * earned, captured from the student's applicable rate at the time. Online
 * lessons use `onlineLessonRate`, in-person lessons use `lessonRate`.
 *
 * - Past months stay frozen because their lessons keep the rate they were
 *   stamped with.
 * - Changing a student's rate re-stamps only current-month + future lessons.
 * - Toggling a single lesson's online flag re-stamps just that lesson to the
 *   student's current applicable rate (even on older lessons).
 */

export type StudentRates = {
  lessonRate: number;
  onlineLessonRate: number;
};

/**
 * The đ amount a lesson should earn given the student's current rates and
 * whether the lesson is online.
 */
export function effectiveLessonRate(
  student: StudentRates,
  isOnline: boolean,
): number {
  return isOnline ? student.onlineLessonRate : student.lessonRate;
}
