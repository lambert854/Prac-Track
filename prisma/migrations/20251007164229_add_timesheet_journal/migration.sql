-- CreateTable
CREATE TABLE "timesheet_journals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placementId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "tasksSummary" TEXT NOT NULL,
    "highLowPoints" TEXT,
    "competencies" TEXT NOT NULL,
    "practiceBehaviors" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "otherComments" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "timesheet_journals_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
