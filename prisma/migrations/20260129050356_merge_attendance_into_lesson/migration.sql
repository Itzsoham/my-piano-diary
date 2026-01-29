/*
  Warnings:

  - You are about to drop the `Attendance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_lessonId_fkey";

-- AlterEnum
ALTER TYPE "LessonStatus" ADD VALUE 'PENDING';

CREATE INDEX "Lesson_teacherId_date_idx" ON "Lesson"("teacherId", "date");

-- CreateIndex
CREATE INDEX "Lesson_studentId_date_idx" ON "Lesson"("studentId", "date");
