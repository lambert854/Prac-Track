/*
  Warnings:

  - You are about to drop the column `term` on the `placements` table. All the data in the column will be lost.
  - Added the required column `classId` to the `placements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "supervisor_profiles" ADD COLUMN "highestDegree" TEXT;
ALTER TABLE "supervisor_profiles" ADD COLUMN "licenseNumber" TEXT;
ALTER TABLE "supervisor_profiles" ADD COLUMN "licensedSW" TEXT;
ALTER TABLE "supervisor_profiles" ADD COLUMN "otherDegree" TEXT;

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "hours" INTEGER NOT NULL,
    "facultyId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "classes_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "classId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "requiredHours" INTEGER NOT NULL,
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
    CONSTRAINT "placements_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "placements_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_placements" ("approvedAt", "approvedBy", "cellPolicy", "checklist", "complianceChecklist", "declinedAt", "declinedBy", "endDate", "facultyId", "facultyNotes", "id", "learningContract", "requiredHours", "siteId", "startDate", "status", "studentId", "supervisorId") SELECT "approvedAt", "approvedBy", "cellPolicy", "checklist", "complianceChecklist", "declinedAt", "declinedBy", "endDate", "facultyId", "facultyNotes", "id", "learningContract", "requiredHours", "siteId", "startDate", "status", "studentId", "supervisorId" FROM "placements";
DROP TABLE "placements";
ALTER TABLE "new_placements" RENAME TO "placements";
CREATE INDEX "placements_facultyId_idx" ON "placements"("facultyId");
CREATE INDEX "placements_supervisorId_idx" ON "placements"("supervisorId");
CREATE INDEX "placements_siteId_idx" ON "placements"("siteId");
CREATE INDEX "placements_classId_idx" ON "placements"("classId");
CREATE INDEX "placements_studentId_idx" ON "placements"("studentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "classes_name_key" ON "classes"("name");
