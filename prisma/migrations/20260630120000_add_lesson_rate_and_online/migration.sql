-- AlterTable: add a separate online rate on Student
ALTER TABLE "Student" ADD COLUMN "onlineLessonRate" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: add per-lesson online flag and a frozen rate snapshot on Lesson
ALTER TABLE "Lesson"
  ADD COLUMN "isOnline" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "rate" INTEGER NOT NULL DEFAULT 0;

-- Backfill: existing lessons are treated as in-person (offline) and snapshot
-- the student's current lessonRate so historical earnings stay unchanged.
UPDATE "Lesson"
SET "rate" = "Student"."lessonRate"
FROM "Student"
WHERE "Lesson"."studentId" = "Student"."id";
