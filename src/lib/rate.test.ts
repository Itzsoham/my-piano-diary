import { describe, it, expect } from "vitest";

import { effectiveLessonRate } from "@/lib/rate";

describe("effectiveLessonRate", () => {
  const student = { lessonRate: 300, onlineLessonRate: 200 };

  it("uses the online rate for online lessons", () => {
    expect(effectiveLessonRate(student, true)).toBe(200);
  });

  it("uses the in-person rate for in-person lessons", () => {
    expect(effectiveLessonRate(student, false)).toBe(300);
  });

  it("handles unset (0) rates", () => {
    expect(effectiveLessonRate({ lessonRate: 0, onlineLessonRate: 0 }, true)).toBe(
      0,
    );
    expect(
      effectiveLessonRate({ lessonRate: 500, onlineLessonRate: 0 }, false),
    ).toBe(500);
  });
});
