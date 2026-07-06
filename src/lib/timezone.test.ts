import { describe, it, expect } from "vitest";

import {
  toUTC,
  fromUTC,
  formatInTimezone,
  isSameDayInTimezone,
  getStartOfMonthUTC,
  getEndOfMonthUTC,
  createDateInTimezone,
  isValidTimezone,
} from "@/lib/timezone";

// Note: these assertions are all zone-explicit, so they hold regardless of the
// machine's own timezone. To exercise host-TZ-dependent code paths, launch with
// a forced zone (see the "test:tz" script), since mutating process.env.TZ at
// runtime is a no-op on Windows.
describe("timezone helpers", () => {
  // Kolkata: Feb 5 00:00 · New York: Feb 4 13:30 (EST)
  const u = new Date("2026-02-04T18:30:00.000Z");

  it("formatInTimezone renders the target zone, not the host's", () => {
    expect(formatInTimezone(u, "Asia/Kolkata", "yyyy-MM-dd HH:mm")).toBe(
      "2026-02-05 00:00",
    );
    expect(formatInTimezone(u, "America/New_York", "yyyy-MM-dd HH:mm")).toBe(
      "2026-02-04 13:30",
    );
  });

  it("toUTC(fromUTC(u)) round-trips exactly for several zones, incl. DST", () => {
    for (const tz of [
      "Asia/Kolkata",
      "America/New_York",
      "Europe/London",
      "UTC",
    ]) {
      expect(toUTC(fromUTC(u, tz), tz).toISOString()).toBe(u.toISOString());
    }
    // After US Eastern spring-forward (2026-03-08) → EDT.
    const dst = new Date("2026-03-09T18:30:00.000Z");
    expect(
      toUTC(fromUTC(dst, "America/New_York"), "America/New_York").toISOString(),
    ).toBe(dst.toISOString());
    expect(formatInTimezone(dst, "America/New_York", "HH:mm")).toBe("14:30");
  });

  it("month boundaries respect the configured zone", () => {
    const start = getStartOfMonthUTC(2, 2026, "Asia/Ho_Chi_Minh");
    const end = getEndOfMonthUTC(2, 2026, "Asia/Ho_Chi_Minh");
    expect(start.toISOString()).toBe("2026-01-31T17:00:00.000Z");
    expect(formatInTimezone(start, "Asia/Ho_Chi_Minh", "yyyy-MM-dd HH:mm")).toBe(
      "2026-02-01 00:00",
    );
    expect(formatInTimezone(end, "Asia/Ho_Chi_Minh", "yyyy-MM-dd HH:mm")).toBe(
      "2026-02-28 23:59",
    );
    expect(end.getTime()).toBeLessThan(
      getStartOfMonthUTC(3, 2026, "Asia/Ho_Chi_Minh").getTime(),
    );
  });

  it("createDateInTimezone builds the correct UTC instant", () => {
    // Feb 4, 18:30 Vietnam (UTC+7) = 11:30 UTC. (month arg is 0-indexed)
    expect(
      createDateInTimezone(2026, 1, 4, 18, 30, "Asia/Ho_Chi_Minh").toISOString(),
    ).toBe("2026-02-04T11:30:00.000Z");
  });

  it("isSameDayInTimezone compares the calendar day in the given zone", () => {
    const a = new Date("2026-02-04T18:30:00.000Z"); // NY Feb 4 · Kolkata Feb 5
    const b = new Date("2026-02-04T20:00:00.000Z"); // NY Feb 4 15:00 · Kolkata Feb 5 01:30
    expect(isSameDayInTimezone(a, b, "America/New_York")).toBe(true);
    expect(isSameDayInTimezone(a, b, "Asia/Kolkata")).toBe(true);
    const c = new Date("2026-02-04T02:00:00.000Z"); // NY Feb 3 21:00
    expect(isSameDayInTimezone(a, c, "America/New_York")).toBe(false);
  });

  it("isValidTimezone validates IANA strings", () => {
    expect(isValidTimezone("Asia/Kolkata")).toBe(true);
    expect(isValidTimezone("America/New_York")).toBe(true);
    expect(isValidTimezone("Not/AZone")).toBe(false);
    expect(isValidTimezone("")).toBe(false);
  });
});
