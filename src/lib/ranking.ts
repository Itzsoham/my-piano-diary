/**
 * Shared ranking maths for the two score boards — the dashboard's
 * "Top Students This Month" card and the all-time /leaderboard page.
 *
 * Two rules drive everything in here:
 *
 * 1. **Rank is decided by the average alone.** Two students with the same
 *    average hold the same rank (standard competition ranking: 1, 1, 3, ...).
 *    Lesson count never promotes anyone out of a tie — it only decides the
 *    display order *within* a tie group, so the list is stable rather than
 *    random. Anything that changes rank must change the average.
 *
 * 2. **Averages are compared exactly, never as rounded display values.**
 *    Rounding first would tie a 4.96-over-25-lessons with a single 5, and
 *    would split 4.949 from 4.951 into different ranks. Scores are integers,
 *    so an average is the rational `scoreSum / ratedCount`; comparing two of
 *    them cross-multiplied stays in exact integer arithmetic.
 */

export type ScoreAggregate = {
  studentName: string;
  scoreSum: number;
  ratedCount: number;
};

export type Ranked<T> = T & {
  /** Rounded to 2dp for display. Rank is computed on the exact average. */
  avgScore: number;
  rank: number;
};

/**
 * Exact `a.average === b.average`, via cross-multiplication. Both sides stay
 * integers (scores are 1-5), so this never inherits float drift the way
 * `a.sum / a.count === b.sum / b.count` would.
 */
export const sameAverage = (a: ScoreAggregate, b: ScoreAggregate) =>
  a.scoreSum * b.ratedCount === b.scoreSum * a.ratedCount;

/** Descending by exact average. Positive => `b` sorts first. */
export const compareAverageDesc = (a: ScoreAggregate, b: ScoreAggregate) =>
  b.scoreSum * a.ratedCount - a.scoreSum * b.ratedCount;

const roundTo2dp = (value: number) => Math.round(value * 100) / 100;

/**
 * Sorts by exact average, then assigns standard competition ranks.
 *
 * Entries with `ratedCount === 0` are dropped — an unrated student has no
 * average to rank, and giving them 0 would bury them below a genuine 1.0.
 */
export function rankByAverage<T extends ScoreAggregate>(
  entries: T[],
): Ranked<T>[] {
  const sorted = entries
    .filter((entry) => entry.ratedCount > 0)
    .sort((a, b) => {
      const byAverage = compareAverageDesc(a, b);
      if (byAverage !== 0) return byAverage;

      // Same rank either way — these only keep the order stable. More rated
      // lessons reads first because it is the better-evidenced average.
      if (b.ratedCount !== a.ratedCount) return b.ratedCount - a.ratedCount;
      return a.studentName.localeCompare(b.studentName);
    });

  let rank = 0;
  let previous: T | null = null;

  return sorted.map((entry, index) => {
    if (!previous || !sameAverage(previous, entry)) {
      rank = index + 1;
    }
    previous = entry;

    return {
      ...entry,
      avgScore: roundTo2dp(entry.scoreSum / entry.ratedCount),
      rank,
    };
  });
}

/**
 * `slice(0, limit)` but never through the middle of a tie group — if the 6th
 * student holds the same rank as the 5th, cutting at 5 silently drops someone
 * who is, by the board's own rules, equal to the last student shown.
 */
export function takeWithTies<T extends { rank: number }>(
  ranked: T[],
  limit: number,
): T[] {
  const boundary = ranked[limit - 1];
  if (!boundary) return ranked;

  return ranked.filter(
    (entry, index) => index < limit || entry.rank === boundary.rank,
  );
}

/**
 * Splits a ranked list into podium columns + the list below.
 *
 * The podium is the longest prefix of at most `maxColumns` students that ends
 * on a **rank boundary**. That matters because the pedestal is a claim: if
 * three students tie at rank 3 and we take the first three rows, the one who
 * happened to sort into slot 3 gets a bronze pedestal while two students with
 * the identical average get a plain list row. Shrinking the podium to the last
 * complete tier keeps the medal honest — worst case (everybody tied) there is
 * no podium at all, which is the truthful rendering of that data.
 */
export function splitPodium<T extends { rank: number }>(
  ranked: T[],
  maxColumns = 3,
): { podium: T[]; runners: T[] } {
  let size = Math.min(maxColumns, ranked.length);

  while (size > 0) {
    const last = ranked[size - 1];
    const next = ranked[size];
    if (!last || !next || next.rank !== last.rank) break;
    size -= 1;
  }

  return { podium: ranked.slice(0, size), runners: ranked.slice(size) };
}

/**
 * `5` and `4.5` read nicer as "5.0"/"4.5" than "5.00", but a 3-lesson 4.33
 * average must not be flattened to "4.3" — at 1dp it would print the same as
 * a genuinely different 4.25 average that sits at a different rank, which is
 * exactly the "why do two rows show the same number but different places?"
 * confusion. So: 1dp when the 2dp value ends in a zero, 2dp otherwise.
 */
export const formatScore = (value: number) => {
  const scaled = Math.round(value * 100);
  return scaled % 10 === 0
    ? (scaled / 100).toFixed(1)
    : (scaled / 100).toFixed(2);
};

/**
 * Ties share a rank, so the board is not a fixed 1st/2nd/3rd/4th/5th ladder —
 * two students can legitimately both be "1st" and the next student "3rd".
 * Spell the number out for assistive tech rather than assuming a position.
 */
export const ordinal = (rank: number) => {
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;

  switch (rank % 10) {
    case 1:
      return `${rank}st`;
    case 2:
      return `${rank}nd`;
    case 3:
      return `${rank}rd`;
    default:
      return `${rank}th`;
  }
};
