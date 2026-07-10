import { describe, it, expect } from "vitest";

import {
  buildWeeksData,
  hasSixthWeek,
  resolveWeeks,
  type WeeksData,
} from "@/lib/report/attendance";

// Local-time dates so getWeekOfMonth/getDate (which read local time) are stable
// regardless of the test runner's timezone.
const lesson = (year: number, month0: number, day: number, status = "COMPLETE") => ({
  date: new Date(year, month0, day),
  status,
  cancelReason: null,
});

describe("buildWeeksData", () => {
  it("buckets every lesson into weeks 1-6 and preserves day + status", () => {
    const weeks = buildWeeksData([
      lesson(2026, 5, 1),
      lesson(2026, 5, 15),
      lesson(2026, 5, 30, "CANCELLED"),
    ]);

    const cells = Object.values(weeks).flat();
    expect(cells.map((c) => c.day).sort((a, b) => a - b)).toEqual([1, 15, 30]);

    const first = cells.find((c) => c.day === 1);
    expect(first?.status).toBe("COMPLETE");
    const last = cells.find((c) => c.day === 30);
    expect(last?.status).toBe("CANCELLED");
  });

  it("returns empty buckets for a month with no lessons", () => {
    const weeks = buildWeeksData([]);
    expect(Object.values(weeks).flat()).toHaveLength(0);
  });
});

describe("hasSixthWeek", () => {
  const empty: WeeksData = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

  it("is false when week 6 is empty", () => {
    expect(hasSixthWeek(empty)).toBe(false);
  });

  it("is true when week 6 has a lesson", () => {
    const wd: WeeksData = {
      ...empty,
      6: [{ day: 31, status: "COMPLETE", cancelReason: null }],
    };
    expect(hasSixthWeek(wd)).toBe(true);
  });
});

describe("resolveWeeks", () => {
  const empty: WeeksData = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  const withSix: WeeksData = {
    ...empty,
    6: [{ day: 31, status: "COMPLETE", cancelReason: null }],
  };

  it("returns 5 columns when no one has a 6th week", () => {
    expect(resolveWeeks([empty, empty])).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns 6 columns when ANY student has a 6th week (union)", () => {
    expect(resolveWeeks([empty, withSix])).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
