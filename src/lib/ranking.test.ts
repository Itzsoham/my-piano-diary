import { describe, it, expect } from "vitest";

import {
  formatScore,
  ordinal,
  rankByAverage,
  splitPodium,
  takeWithTies,
} from "@/lib/ranking";

const student = (studentName: string, scores: number[]) => ({
  studentName,
  scoreSum: scores.reduce((sum, score) => sum + score, 0),
  ratedCount: scores.length,
});

describe("rankByAverage", () => {
  it("gives students with the same average the same rank", () => {
    const ranked = rankByAverage([
      student("Jubi", [5, 5]),
      student("Ben", [5]),
      student("Merry", [4]),
    ]);

    expect(ranked.map((entry) => [entry.studentName, entry.rank])).toEqual([
      ["Jubi", 1],
      ["Ben", 1],
      ["Merry", 3],
    ]);
  });

  it("does not let lesson count break a tie for rank", () => {
    const ranked = rankByAverage([
      student("Ben", [5]),
      student("Jubi", [5, 5, 5, 5]),
    ]);

    // Jubi sorts first (better-evidenced average) but neither outranks the
    // other — rank is decided by the average alone.
    expect(ranked.map((entry) => entry.studentName)).toEqual(["Jubi", "Ben"]);
    expect(ranked.every((entry) => entry.rank === 1)).toBe(true);
  });

  it("skips the standard competition rank after a tie", () => {
    const ranked = rankByAverage([
      student("A", [5]),
      student("B", [5]),
      student("C", [5]),
      student("D", [4]),
    ]);

    expect(ranked.map((entry) => entry.rank)).toEqual([1, 1, 1, 4]);
  });

  it("ranks on the exact average, not the rounded display value", () => {
    // 4.96 displays as "5.0" at one decimal place, but it is not a 5.
    const ranked = rankByAverage([
      student("Rounder", Array<number>(24).fill(5).concat(4)),
      student("Perfect", [5]),
    ]);

    expect(ranked.map((entry) => [entry.studentName, entry.rank])).toEqual([
      ["Perfect", 1],
      ["Rounder", 2],
    ]);
  });

  it("does not split near-identical averages that are genuinely equal", () => {
    // 9/2 and 18/4 are the same average via different lesson counts; float
    // division would be fine here, cross-multiplication guarantees it.
    const ranked = rankByAverage([
      student("Two", [5, 4]),
      student("Four", [5, 4, 5, 4]),
    ]);

    expect(ranked.every((entry) => entry.rank === 1)).toBe(true);
  });

  it("drops students with no rated lessons rather than ranking them at zero", () => {
    const ranked = rankByAverage([
      student("Rated", [3]),
      student("Unrated", []),
    ]);

    expect(ranked.map((entry) => entry.studentName)).toEqual(["Rated"]);
  });

  it("orders a tie by lesson count, then alphabetically", () => {
    const ranked = rankByAverage([
      student("Zoe", [4]),
      student("Amy", [4]),
      student("Kit", [4, 4]),
    ]);

    expect(ranked.map((entry) => entry.studentName)).toEqual([
      "Kit",
      "Amy",
      "Zoe",
    ]);
  });
});

describe("takeWithTies", () => {
  const ranked = [
    { rank: 1 },
    { rank: 1 },
    { rank: 3 },
    { rank: 3 },
    { rank: 3 },
    { rank: 3 },
    { rank: 7 },
  ];

  it("keeps everyone who ties with the last student inside the limit", () => {
    expect(takeWithTies(ranked, 5)).toHaveLength(6);
  });

  it("cuts exactly at the limit when it lands on a rank boundary", () => {
    expect(takeWithTies(ranked, 6)).toHaveLength(6);
  });

  it("returns everything when the list is shorter than the limit", () => {
    expect(takeWithTies([{ rank: 1 }], 5)).toHaveLength(1);
  });
});

describe("splitPodium", () => {
  it("keeps the classic three columns when the top three ranks are distinct", () => {
    const { podium, runners } = splitPodium([
      { rank: 1 },
      { rank: 2 },
      { rank: 3 },
      { rank: 4 },
    ]);

    expect(podium).toHaveLength(3);
    expect(runners).toHaveLength(1);
  });

  it("shrinks rather than handing a medal to one of several tied students", () => {
    // 1, 1, 3, 3, 3 — cutting at three would put one 4.0 student on a bronze
    // pedestal and two identical 4.0 students in the list below.
    const { podium, runners } = splitPodium([
      { rank: 1 },
      { rank: 1 },
      { rank: 3 },
      { rank: 3 },
      { rank: 3 },
    ]);

    expect(podium.map((entry) => entry.rank)).toEqual([1, 1]);
    expect(runners.map((entry) => entry.rank)).toEqual([3, 3, 3]);
  });

  it("drops the podium entirely when everyone is tied", () => {
    const { podium, runners } = splitPodium([
      { rank: 1 },
      { rank: 1 },
      { rank: 1 },
      { rank: 1 },
    ]);

    expect(podium).toHaveLength(0);
    expect(runners).toHaveLength(4);
  });
});

describe("formatScore", () => {
  it("keeps whole and half scores at one decimal", () => {
    expect(formatScore(5)).toBe("5.0");
    expect(formatScore(4.5)).toBe("4.5");
    expect(formatScore(4.7)).toBe("4.7");
  });

  it("shows a second decimal when one would flatten distinct averages", () => {
    expect(formatScore(13 / 3)).toBe("4.33");
    expect(formatScore(17 / 4)).toBe("4.25");
  });
});

describe("ordinal", () => {
  it("handles the teens", () => {
    expect(ordinal(11)).toBe("11th");
    expect(ordinal(12)).toBe("12th");
    expect(ordinal(13)).toBe("13th");
  });

  it("handles the usual suffixes", () => {
    expect(ordinal(1)).toBe("1st");
    expect(ordinal(2)).toBe("2nd");
    expect(ordinal(3)).toBe("3rd");
    expect(ordinal(4)).toBe("4th");
    expect(ordinal(21)).toBe("21st");
  });
});
