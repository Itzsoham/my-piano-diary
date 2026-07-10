/**
 * Shared tuition math for monthly reports.
 *
 * Extracted verbatim from the single-student report view so the combined
 * family sheet computes money the EXACT same way (frozen per-lesson rate,
 * online/in-person split, per-lesson rate exceptions). Any change here must
 * apply to both views — that's the whole point of sharing it.
 */

/** Minimal lesson shape the tuition math needs. */
export interface TuitionLesson {
  status: string;
  isOnline: boolean;
  rate: number;
}

/** A rate charged for some lessons in a group that differs from the reference. */
export interface RateException {
  rate: number;
  count: number;
  sum: number;
}

/** Summary of one group of lessons (in-person OR online). */
export interface GroupSummary {
  /** The rate we show on the main tuition line. */
  referenceRate: number;
  /** How many lessons were charged at the reference rate. */
  standardCount: number;
  /** Sum of the standard-rate lessons. */
  standardSum: number;
  /** Lessons charged a different rate, grouped by that rate. */
  exceptions: RateException[];
  /** Total charged across the whole group (standard + exceptions). */
  total: number;
  /** Number of lessons in the group. */
  count: number;
}

/**
 * Summarize a group of lessons into a reference rate + any exceptions (lessons
 * charged a different rate, e.g. a per-lesson override), so those are noted
 * apart. Returns null for an empty group.
 */
export const summarizeGroup = (
  items: { rate: number }[],
  configRate: number,
): GroupSummary | null => {
  const [firstLesson] = items;
  if (!firstLesson) {
    return null;
  }

  const counts = new Map<number, number>();
  for (const l of items) {
    counts.set(l.rate, (counts.get(l.rate) ?? 0) + 1);
  }
  // Most common rate charged in this group (the mode).
  let mode = firstLesson.rate;
  let modeCount = 0;
  for (const [rate, count] of counts) {
    if (count > modeCount) {
      mode = rate;
      modeCount = count;
    }
  }
  // Prefer the configured rate when set AND actually used, else the mode.
  let referenceRate = configRate > 0 ? configRate : mode;
  if (!counts.has(referenceRate)) {
    referenceRate = mode;
  }

  const exceptionMap = new Map<number, RateException>();
  let standardCount = 0;
  let standardSum = 0;
  for (const l of items) {
    if (l.rate === referenceRate) {
      standardCount += 1;
      standardSum += l.rate;
    } else {
      const existing = exceptionMap.get(l.rate) ?? {
        rate: l.rate,
        count: 0,
        sum: 0,
      };
      existing.count += 1;
      existing.sum += l.rate;
      exceptionMap.set(l.rate, existing);
    }
  }

  return {
    referenceRate,
    standardCount,
    standardSum,
    exceptions: [...exceptionMap.values()].sort((a, b) => a.rate - b.rate),
    total: items.reduce((sum, l) => sum + l.rate, 0),
    count: items.length,
  };
};

export interface TuitionResult<T> {
  /** Completed lessons only (the ones that count toward tuition). */
  validLessons: T[];
  totalSessions: number;
  /** Sum of every completed lesson's frozen rate. */
  totalTuition: number;
  inPersonSummary: GroupSummary | null;
  onlineSummary: GroupSummary | null;
  /** True when the student has BOTH in-person and online lessons this month. */
  bothGroups: boolean;
}

/**
 * Compute tuition for a set of lessons. Filters to COMPLETE, splits
 * online/in-person, and summarizes each group against the student's
 * configured reference rates.
 */
export const computeTuition = <T extends TuitionLesson>(
  lessons: T[],
  rates: { inPersonRate: number; onlineRate: number },
): TuitionResult<T> => {
  const validLessons = lessons.filter((l) => l.status === "COMPLETE");
  const totalSessions = validLessons.length;
  const totalTuition = validLessons.reduce((sum, l) => sum + l.rate, 0);
  const onlineSessions = validLessons.filter((l) => l.isOnline);
  const inPersonSessions = validLessons.filter((l) => !l.isOnline);

  const inPersonSummary = summarizeGroup(inPersonSessions, rates.inPersonRate);
  const onlineSummary = summarizeGroup(onlineSessions, rates.onlineRate);

  return {
    validLessons,
    totalSessions,
    totalTuition,
    inPersonSummary,
    onlineSummary,
    bothGroups: Boolean(inPersonSummary) && Boolean(onlineSummary),
  };
};
