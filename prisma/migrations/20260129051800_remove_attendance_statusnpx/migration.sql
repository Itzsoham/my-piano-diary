/*
  Warnings:

  - You are about to drop the column `attendance` on the `Lesson` table. All the data in the column will be lost.

*/
-- Begin migration
-- Step 1: Drop the attendance column
ALTER TABLE "Lesson" DROP COLUMN "attendance";

-- Step 2: Drop the AttendanceStatus enum
DROP TYPE "AttendanceStatus";

-- Step 3: Set default value for status 
ALTER TABLE "Lesson" ALTER COLUMN "status" SET DEFAULT 'PENDING';
