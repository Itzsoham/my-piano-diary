import { describe, expect, it } from "vitest";

import {
  addPracticeVideoSchema,
  createParentAccountSchema,
  setPaymentQrSchema,
  updateParentAccountSchema,
  updatePracticeVideoCommentSchema,
} from "./api-schemas";

const CUID = "cstudent0000000";

describe("createParentAccountSchema", () => {
  it("accepts valid parent account input", () => {
    const valid = {
      name: "Mrs. Linh Nguyen",
      email: "linh@example.com",
      password: "secretpassword123",
      studentIds: [CUID],
    };
    expect(createParentAccountSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects password shorter than 8 chars", () => {
    const short = {
      name: "Mrs. Linh Nguyen",
      email: "linh@example.com",
      password: "short",
      studentIds: [CUID],
    };
    expect(createParentAccountSchema.safeParse(short).success).toBe(false);
  });

  it("rejects empty studentIds list", () => {
    const emptyStudents = {
      name: "Mrs. Linh Nguyen",
      email: "linh@example.com",
      password: "secretpassword123",
      studentIds: [],
    };
    expect(createParentAccountSchema.safeParse(emptyStudents).success).toBe(
      false,
    );
  });

  it("rejects invalid email", () => {
    const badEmail = {
      name: "Mrs. Linh Nguyen",
      email: "not-an-email",
      password: "secretpassword123",
      studentIds: [CUID],
    };
    expect(createParentAccountSchema.safeParse(badEmail).success).toBe(false);
  });
});

describe("updateParentAccountSchema", () => {
  it("accepts partial updates", () => {
    expect(
      updateParentAccountSchema.safeParse({
        parentId: CUID,
        name: "New Name",
      }).success,
    ).toBe(true);

    expect(
      updateParentAccountSchema.safeParse({
        parentId: CUID,
        password: "newsecretpassword",
      }).success,
    ).toBe(true);
  });

  it("rejects short password when provided", () => {
    expect(
      updateParentAccountSchema.safeParse({
        parentId: CUID,
        password: "123",
      }).success,
    ).toBe(false);
  });
});

describe("setPaymentQrSchema", () => {
  const samplePngBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

  it("accepts valid base64 PNG data URL", () => {
    const res = setPaymentQrSchema.safeParse({
      dataUrl: samplePngBase64,
      name: "My Bank QR",
      note: "Scan to pay",
    });
    expect(res.success).toBe(true);
  });

  it("rejects SVG data URLs (security)", () => {
    const svgDataUrl = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=";
    const res = setPaymentQrSchema.safeParse({
      dataUrl: svgDataUrl,
    });
    expect(res.success).toBe(false);
  });

  it("rejects raw HTTP URLs (must be base64 data URL)", () => {
    const res = setPaymentQrSchema.safeParse({
      dataUrl: "https://example.com/qr.png",
    });
    expect(res.success).toBe(false);
  });

  it("rejects oversized dataUrl (> 400KB)", () => {
    const oversized =
      "data:image/png;base64," + "A".repeat(400_001);
    const res = setPaymentQrSchema.safeParse({
      dataUrl: oversized,
    });
    expect(res.success).toBe(false);
  });
});

describe("addPracticeVideoSchema", () => {
  it("accepts valid practice video input", () => {
    const valid = {
      studentId: CUID,
      title: "Minuet in G",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      note: "Great progress today",
    };
    expect(addPracticeVideoSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects non-HTTP protocols (e.g. javascript:)", () => {
    const bad = {
      studentId: CUID,
      title: "Minuet in G",
      url: "javascript:alert(1)",
    };
    expect(addPracticeVideoSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects empty or too short title", () => {
    const bad = {
      studentId: CUID,
      title: "A",
      url: "https://youtu.be/dQw4w9WgXcQ",
    };
    expect(addPracticeVideoSchema.safeParse(bad).success).toBe(false);
  });
});

describe("updatePracticeVideoCommentSchema", () => {
  it("accepts teacher feedback up to 2000 chars", () => {
    const valid = {
      videoId: CUID,
      teacherComment: "Wonderful fingering on measure 4!",
    };
    expect(updatePracticeVideoCommentSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts null to clear comment", () => {
    const valid = {
      videoId: CUID,
      teacherComment: null,
    };
    expect(updatePracticeVideoCommentSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects comment exceeding 2000 characters", () => {
    const invalid = {
      videoId: CUID,
      teacherComment: "x".repeat(2001),
    };
    expect(updatePracticeVideoCommentSchema.safeParse(invalid).success).toBe(
      false,
    );
  });
});
