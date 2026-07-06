import { describe, it, expect } from "vitest";

import {
  calculateRemaining,
  derivePaymentStatus,
  expectedByMonth,
  summarizeOutstanding,
} from "@/lib/payment";

describe("calculateRemaining", () => {
  it("returns the shortfall when underpaid", () => {
    expect(calculateRemaining(200, 50)).toBe(150);
  });

  it("clamps at 0 when paid in full or overpaid", () => {
    expect(calculateRemaining(200, 200)).toBe(0);
    expect(calculateRemaining(200, 300)).toBe(0); // never negative
  });

  it("handles a zero-expected month", () => {
    expect(calculateRemaining(0, 0)).toBe(0);
  });
});

describe("derivePaymentStatus", () => {
  it("is UNPAID when nothing received", () => {
    expect(derivePaymentStatus(200, 0)).toBe("UNPAID");
    expect(derivePaymentStatus(0, 0)).toBe("UNPAID");
  });

  it("is PARTIAL when some but not all is received", () => {
    expect(derivePaymentStatus(200, 100)).toBe("PARTIAL");
  });

  it("is PAID when received meets or exceeds expected", () => {
    expect(derivePaymentStatus(200, 200)).toBe("PAID");
    expect(derivePaymentStatus(200, 300)).toBe("PAID");
  });
});

describe("expectedByMonth", () => {
  it("buckets completed-lesson rates by the zone's year-month", () => {
    const map = expectedByMonth(
      [
        { date: new Date("2026-02-15T00:00:00Z"), rate: 300 },
        { date: new Date("2026-02-20T00:00:00Z"), rate: 100 },
        { date: new Date("2026-03-01T00:00:00Z"), rate: 50 },
      ],
      "Asia/Ho_Chi_Minh",
    );
    expect(map.get("2026-2")).toBe(400);
    expect(map.get("2026-3")).toBe(50);
  });
});

describe("summarizeOutstanding", () => {
  it("clamps per month so an overpaid month can't cancel an underpaid one", () => {
    // Feb: expected 200, paid 300 (over). Mar: expected 200, paid 100 (under).
    const res = summarizeOutstanding(
      [
        { studentId: "s1", date: new Date("2026-02-15T00:00:00Z"), rate: 200 },
        { studentId: "s1", date: new Date("2026-03-15T00:00:00Z"), rate: 200 },
      ],
      [
        { studentId: "s1", year: 2026, month: 2, received: 300 },
        { studentId: "s1", year: 2026, month: 3, received: 100 },
      ],
      "Asia/Ho_Chi_Minh",
    );
    expect(res.totalExpected).toBe(400);
    expect(res.totalReceived).toBe(400);
    // Per-month clamp → 0 + 100 = 100 (all-time netting would give 0).
    expect(res.totalOutstanding).toBe(100);
  });

  it("counts a paid month with no lessons as received but not outstanding", () => {
    const res = summarizeOutstanding(
      [],
      [{ studentId: "s1", year: 2026, month: 2, received: 150 }],
      "Asia/Ho_Chi_Minh",
    );
    expect(res.totalExpected).toBe(0);
    expect(res.totalReceived).toBe(150);
    expect(res.totalOutstanding).toBe(0);
  });
});
