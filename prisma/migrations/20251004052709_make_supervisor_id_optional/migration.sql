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
    "requiredHoursOverride" INTEGER,
    "complianceChecklist" TEXT,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "declinedAt" DATETIME,
    "declinedBy" TEXT,
    "facultyNotes" TEXT,
    CONSTRAINT "placements_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "placements_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "placements_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "placements_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_placements" ("approvedAt", "approvedBy", "complianceChecklist", "declinedAt", "declinedBy", "endDate", "facultyId", "facultyNotes", "id", "requiredHoursOverride", "siteId", "startDate", "status", "studentId", "supervisorId") SELECT "approvedAt", "approvedBy", "complianceChecklist", "declinedAt", "declinedBy", "endDate", "facultyId", "facultyNotes", "id", "requiredHoursOverride", "siteId", "startDate", "status", "studentId", "supervisorId" FROM "placements";
DROP TABLE "placements";
ALTER TABLE "new_placements" RENAME TO "placements";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
