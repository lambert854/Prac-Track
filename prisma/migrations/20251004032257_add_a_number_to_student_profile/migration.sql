/*
  Warnings:

  - Added the required column `aNumber` to the `student_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_student_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "aNumber" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "cohort" TEXT NOT NULL,
    "requiredHours" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_student_profiles" ("cohort", "id", "notes", "program", "requiredHours", "term", "userId", "aNumber") 
SELECT "cohort", "id", "notes", "program", "requiredHours", "term", "userId", 
       'A000' || printf('%04d', ROW_NUMBER() OVER (ORDER BY "id")) 
FROM "student_profiles";
DROP TABLE "student_profiles";
ALTER TABLE "new_student_profiles" RENAME TO "student_profiles";
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");
CREATE UNIQUE INDEX "student_profiles_aNumber_key" ON "student_profiles"("aNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
