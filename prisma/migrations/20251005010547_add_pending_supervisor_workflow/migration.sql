/*
  Warnings:

  - You are about to drop the column `requiredHoursOverride` on the `placements` table. All the data in the column will be lost.
  - You are about to drop the column `requiredHours` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `term` on the `student_profiles` table. All the data in the column will be lost.
  - Added the required column `requiredHours` to the `placements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `term` to the `placements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "faculty_profiles" ADD COLUMN "honorific" TEXT;
ALTER TABLE "faculty_profiles" ADD COLUMN "roomNumber" TEXT;

-- CreateTable
CREATE TABLE "pending_supervisors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "title" TEXT,
    "siteId" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pending_supervisors_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pending_supervisors_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pending_supervisors_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_placements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "supervisorId" TEXT,
    "facultyId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "requiredHours" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "complianceChecklist" TEXT,
    "cellPolicy" TEXT,
    "learningContract" TEXT,
    "checklist" TEXT,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "declinedAt" DATETIME,
    "declinedBy" TEXT,
    "facultyNotes" TEXT,
    CONSTRAINT "placements_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "placements_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "placements_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "placements_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_placements" ("approvedAt", "approvedBy", "complianceChecklist", "declinedAt", "declinedBy", "endDate", "facultyId", "facultyNotes", "id", "siteId", "startDate", "status", "studentId", "supervisorId") SELECT "approvedAt", "approvedBy", "complianceChecklist", "declinedAt", "declinedBy", "endDate", "facultyId", "facultyNotes", "id", "siteId", "startDate", "status", "studentId", "supervisorId" FROM "placements";
DROP TABLE "placements";
ALTER TABLE "new_placements" RENAME TO "placements";
CREATE INDEX "placements_facultyId_idx" ON "placements"("facultyId");
CREATE INDEX "placements_supervisorId_idx" ON "placements"("supervisorId");
CREATE INDEX "placements_siteId_idx" ON "placements"("siteId");
CREATE INDEX "placements_studentId_idx" ON "placements"("studentId");
CREATE TABLE "new_student_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "aNumber" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "cohort" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_student_profiles" ("aNumber", "cohort", "id", "notes", "program", "userId") SELECT "aNumber", "cohort", "id", "notes", "program", "userId" FROM "student_profiles";
DROP TABLE "student_profiles";
ALTER TABLE "new_student_profiles" RENAME TO "student_profiles";
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");
CREATE UNIQUE INDEX "student_profiles_aNumber_key" ON "student_profiles"("aNumber");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "firstName", "id", "lastLogin", "lastName", "passwordHash", "phone", "resetToken", "resetTokenExpiry", "role", "updatedAt") SELECT "createdAt", "email", "firstName", "id", "lastLogin", "lastName", "passwordHash", "phone", "resetToken", "resetTokenExpiry", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "pending_supervisors_placementId_key" ON "pending_supervisors"("placementId");
