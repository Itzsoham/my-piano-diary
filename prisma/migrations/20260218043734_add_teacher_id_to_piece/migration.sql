/*
  Warnings:

  - Added the required column `teacherId` to the `Piece` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add teacherId column as nullable first
ALTER TABLE "Piece" ADD COLUMN "teacherId" TEXT;

-- Step 2: Assign existing pieces to the first teacher (or you can delete orphaned pieces)
-- Option A: Assign to first teacher
UPDATE "Piece" 
SET "teacherId" = (SELECT "id" FROM "Teacher" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "teacherId" IS NULL;

-- Option B (commented out): Delete pieces that don't belong to any teacher
-- DELETE FROM "Piece" WHERE "teacherId" IS NULL;

-- Step 3: Make teacherId NOT NULL
ALTER TABLE "Piece" ALTER COLUMN "teacherId" SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "Piece" ADD CONSTRAINT "Piece_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
