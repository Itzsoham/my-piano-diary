import { describe, it, expect } from "vitest";

import {
  lessonStatusSchema,
  updateUserSchema,
} from "@/lib/validations/common-schemas";
import {
  addPaymentTransactionSchema,
  createRecurringLessonSchema,
} from "@/lib/validations/api-schemas";

// A minimal string that satisfies zod's .cuid() (starts with "c", 8+ chars).
const CUID = "ctestid00000";

describe("lessonStatusSchema", () => {
  it("accepts the three live statuses", () => {
    for (const s of ["PENDING", "COMPLETE", "CANCELLED"]) {
      expect(lessonStatusSchema.safeParse(s).success).toBe(true);
    }
  });

  it("rejects the retired MAKEUP status", () => {
    expect(lessonStatusSchema.safeParse("MAKEUP").success).toBe(false);
  });
});

describe("updateUserSchema.image", () => {
  it("accepts an empty string (cleared avatar) and a valid URL", () => {
    expect(updateUserSchema.safeParse({ image: "" }).success).toBe(true);
    expect(
      updateUserSchema.safeParse({ image: "https://x.com/a.png" }).success,
    ).toBe(true);
  });

  it("rejects a non-URL, non-empty string", () => {
    expect(updateUserSchema.safeParse({ image: "not-a-url" }).success).toBe(
      false,
    );
  });
});

describe("addPaymentTransactionSchema.amount", () => {
  const base = { studentId: CUID, month: 2, year: 2026 };

  it("accepts a reasonable amount", () => {
    expect(
      addPaymentTransactionSchema.safeParse({ ...base, amount: 500 }).success,
    ).toBe(true);
  });

  it("rejects amounts below 1 and above the 10,000,000 cap", () => {
    expect(
      addPaymentTransactionSchema.safeParse({ ...base, amount: 0 }).success,
    ).toBe(false);
    expect(
      addPaymentTransactionSchema.safeParse({ ...base, amount: 10_000_001 })
        .success,
    ).toBe(false);
    // The overflow case that previously slipped through into an int4 column.
    expect(
      addPaymentTransactionSchema.safeParse({ ...base, amount: 3_000_000_000 })
        .success,
    ).toBe(false);
  });
});

describe("createRecurringLessonSchema", () => {
  const base = {
    studentId: CUID,
    dayOfWeek: 3,
    time: "18:30",
    duration: 60,
    recurrenceMonths: 1,
    timezone: "Asia/Ho_Chi_Minh",
  };

  it("accepts a valid recurrence", () => {
    expect(
      createRecurringLessonSchema.safeParse({ ...base, startDate: "2026-02-04" })
        .success,
    ).toBe(true);
  });

  it("rejects an impossible date", () => {
    expect(
      createRecurringLessonSchema.safeParse({ ...base, startDate: "2026-13-45" })
        .success,
    ).toBe(false);
  });

  it("rejects an invalid IANA timezone", () => {
    expect(
      createRecurringLessonSchema.safeParse({
        ...base,
        startDate: "2026-02-04",
        timezone: "Not/AZone",
      }).success,
    ).toBe(false);
  });
});
