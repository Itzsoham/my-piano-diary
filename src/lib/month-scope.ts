/**
 * Shared vocabulary for the month picker that scopes the dashboard and the
 * ranking board.
 *
 * The scope lives in the URL (`?month=6&year=2026`) so a chosen month is
 * shareable, survives a refresh, and renders the same on the server as on the
 * client. What an *absent* scope means differs per page — "the teacher's
 * current month" on the dashboard, "all time" on the ranking board — so this
 * module only parses and formats; it never picks the default.
 */

export type MonthScope = { month: number; year: number };

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** The `<Select>` value that stands for "no month scope at all". */
export const ALL_TIME_KEY = "all";

export const isValidMonthScope = (scope: MonthScope) =>
  Number.isInteger(scope.month) &&
  scope.month >= 1 &&
  scope.month <= 12 &&
  Number.isInteger(scope.year) &&
  scope.year >= 2000 &&
  scope.year <= 2100;

/** `{ month: 6, year: 2026 }` -> `"2026-6"`. Stable, so it keys a `<Select>`. */
export const monthScopeKey = (scope: MonthScope) =>
  `${scope.year}-${scope.month}`;

export function parseMonthScopeKey(
  key: string | null | undefined,
): MonthScope | null {
  if (!key || key === ALL_TIME_KEY) return null;

  const [yearPart, monthPart] = key.split("-");
  return parseMonthScopeParams(monthPart, yearPart);
}

/**
 * Reads a scope out of two loose query-string values. Anything malformed —
 * a hand-edited URL, a stale bookmark — comes back as `null` rather than
 * throwing, so the caller falls back to its own default.
 */
export function parseMonthScopeParams(
  month: string | null | undefined,
  year: string | null | undefined,
): MonthScope | null {
  const scope = {
    month: Number.parseInt(month ?? "", 10),
    year: Number.parseInt(year ?? "", 10),
  };

  return isValidMonthScope(scope) ? scope : null;
}

export const formatMonthScope = (scope: MonthScope) =>
  `${MONTH_NAMES[scope.month - 1] ?? ""} ${scope.year}`;

export const formatShortMonthScope = (scope: MonthScope) =>
  `${SHORT_MONTH_NAMES[scope.month - 1] ?? ""} ${scope.year}`;

export const previousMonthScope = (scope: MonthScope): MonthScope =>
  scope.month === 1
    ? { month: 12, year: scope.year - 1 }
    : { month: scope.month - 1, year: scope.year };

export const sameMonthScope = (
  a: MonthScope | null,
  b: MonthScope | null,
): boolean =>
  a === null || b === null ? a === b : a.month === b.month && a.year === b.year;

/** Newest first — the order every month picker lists its options in. */
export const compareMonthScopeDesc = (a: MonthScope, b: MonthScope) =>
  b.year - a.year || b.month - a.month;
