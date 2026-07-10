import { describe, it, expect } from "vitest";

import { computeTuition, summarizeGroup } from "@/lib/report/tuition";

type L = { status: string; isOnline: boolean; rate: number };
const lesson = (rate: number, isOnline = false, status = "COMPLETE"): L => ({
  status,
  isOnline,
  rate,
});

describe("summarizeGroup", () => {
  it("returns null for an empty group", () => {
    expect(summarizeGroup([], 200)).toBeNull();
  });

  it("uses the configured rate as the reference when it is actually charged", () => {
    const summary = summarizeGroup(
      [{ rate: 200 }, { rate: 200 }, { rate: 200 }],
      200,
    );
    expect(summary).toMatchObject({
      referenceRate: 200,
      standardCount: 3,
      standardSum: 600,
      exceptions: [],
      total: 600,
      count: 3,
    });
  });

  it("splits per-lesson rate overrides into exceptions", () => {
    const summary = summarizeGroup(
      [{ rate: 200 }, { rate: 200 }, { rate: 250 }],
      200,
    );
    expect(summary?.standardCount).toBe(2);
    expect(summary?.standardSum).toBe(400);
    expect(summary?.exceptions).toEqual([{ rate: 250, count: 1, sum: 250 }]);
    expect(summary?.total).toBe(650);
  });

  it("falls back to the mode when the configured rate is unset (0)", () => {
    const summary = summarizeGroup([{ rate: 150 }, { rate: 150 }], 0);
    expect(summary?.referenceRate).toBe(150);
    expect(summary?.exceptions).toEqual([]);
  });
});

describe("computeTuition", () => {
  it("sums each completed lesson's frozen rate", () => {
    const result = computeTuition(
      [lesson(200), lesson(200), lesson(200), lesson(200)],
      { inPersonRate: 200, onlineRate: 150 },
    );
    expect(result.totalSessions).toBe(4);
    expect(result.totalTuition).toBe(800);
    expect(result.bothGroups).toBe(false);
    expect(result.onlineSummary).toBeNull();
    expect(result.inPersonSummary?.total).toBe(800);
  });

  it("splits online and in-person and reports both groups", () => {
    const result = computeTuition(
      [lesson(200), lesson(200), lesson(200), lesson(150, true), lesson(150, true)],
      { inPersonRate: 200, onlineRate: 150 },
    );
    expect(result.totalTuition).toBe(900);
    expect(result.bothGroups).toBe(true);
    expect(result.inPersonSummary?.total).toBe(600);
    expect(result.onlineSummary?.total).toBe(300);
  });

  it("excludes non-complete lessons from tuition", () => {
    const result = computeTuition(
      [lesson(200), lesson(200, false, "PENDING"), lesson(200, false, "CANCELLED")],
      { inPersonRate: 200, onlineRate: 150 },
    );
    expect(result.totalSessions).toBe(1);
    expect(result.totalTuition).toBe(200);
  });

  it("handles an empty month", () => {
    const result = computeTuition([], { inPersonRate: 200, onlineRate: 150 });
    expect(result.totalSessions).toBe(0);
    expect(result.totalTuition).toBe(0);
    expect(result.inPersonSummary).toBeNull();
    expect(result.onlineSummary).toBeNull();
    expect(result.bothGroups).toBe(false);
  });

  it("grand total equals the sum of per-student totals (family merge invariant)", () => {
    const cherry = computeTuition([lesson(200), lesson(200)], {
      inPersonRate: 200,
      onlineRate: 150,
    });
    const ruby = computeTuition(
      [lesson(200), lesson(200), lesson(200), lesson(150, true)],
      { inPersonRate: 200, onlineRate: 150 },
    );
    const grand = cherry.totalTuition + ruby.totalTuition;
    expect(grand).toBe(400 + 750);
  });
});
