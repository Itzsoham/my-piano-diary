/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth", () => ({
  auth: vi.fn(),
  getServerAuthSession: vi.fn(),
}));

import { appRouter } from "@/server/api/root";

// Helper to create mocked callers
function createMockContext({
  role = "TEACHER" as "TEACHER" | "PARENT",
  userId = "user-teacher-1",
  teacherId = "teacher-1",
  parentId = "parent-1",
  studentIds = ["student-1"],
  dbOverrides = {},
} = {}) {
  const mockDb = {
    teacher: {
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        if (where.userId === "user-teacher-1") {
          return { id: teacherId, userId: "user-teacher-1", timezone: "UTC" };
        }
        return null;
      }),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    parent: {
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        if (where.userId === "user-parent-1") {
          return {
            id: parentId,
            userId: "user-parent-1",
            teacherId,
            studentLinks: studentIds.map((sId) => ({ studentId: sId })),
          };
        }
        return null;
      }),
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    student: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
    },
    practiceVideo: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    lesson: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    paymentMonth: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn().mockImplementation(async (cb) => cb(mockDb)),
    ...dbOverrides,
  };

  return {
    ctx: {
      db: mockDb as any,
      session: {
        user: {
          id: userId,
          role,
          timezone: "UTC",
        },
        expires: "2099-01-01",
      } as any,
      headers: new Headers(),
    },
    mockDb,
  };
}

describe("Security boundary: Role enforcement", () => {
  it("rejects parent user calling teacherProcedure (parent.list)", async () => {
    const { ctx } = createMockContext({
      role: "PARENT",
      userId: "user-parent-1",
    });
    const caller = appRouter.createCaller(ctx);

    await expect(caller.parent.list()).rejects.toThrowError(
      /Teacher account required/i,
    );
  });

  it("rejects teacher user calling parentProcedure (portal.overview)", async () => {
    const { ctx } = createMockContext({
      role: "TEACHER",
      userId: "user-teacher-1",
    });
    const caller = appRouter.createCaller(ctx);

    await expect(caller.portal.overview()).rejects.toThrowError(
      /Parent account required/i,
    );
  });
});

describe("Security boundary: Parent student scoping", () => {
  it("rejects parent posting video for an unlinked student ID", async () => {
    const { ctx } = createMockContext({
      role: "PARENT",
      userId: "user-parent-1",
      studentIds: ["cstudent1111111"],
    });
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.addVideo({
        studentId: "cforeign0000000",
        title: "Unauthorized Piece",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      }),
    ).rejects.toThrowError(
      /You can only post videos for your linked children/i,
    );
  });

  it("rejects parent deleting a video posted by someone else", async () => {
    const { ctx, mockDb } = createMockContext({
      role: "PARENT",
      userId: "user-parent-1",
      studentIds: ["cstudent1111111"],
    });
    mockDb.practiceVideo.findFirst = vi.fn().mockResolvedValue({
      id: "cvideos0000000",
      studentId: "cstudent1111111",
      postedById: "different-user-id",
    });

    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.portal.deleteVideo({
        videoId: "cvideos0000000",
      }),
    ).rejects.toThrowError(
      /You can only delete your own practice video posts/i,
    );
  });
});

describe("Teacher feedback loop", () => {
  it("allows teacher to update comment on practice video", async () => {
    const { ctx, mockDb } = createMockContext({
      role: "TEACHER",
      userId: "user-teacher-1",
    });
    mockDb.practiceVideo.findFirst = vi.fn().mockResolvedValue({
      id: "cvideos0000000",
      teacherId: "teacher-1",
    });
    mockDb.practiceVideo.update = vi.fn().mockResolvedValue({
      id: "cvideos0000000",
      teacherComment: "Great tempo!",
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.parent.updateVideoComment({
      videoId: "cvideos0000000",
      teacherComment: "Great tempo!",
    });

    expect(result.teacherComment).toBe("Great tempo!");
    expect(mockDb.practiceVideo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cvideos0000000" },
        data: { teacherComment: "Great tempo!" },
      }),
    );
  });
});
