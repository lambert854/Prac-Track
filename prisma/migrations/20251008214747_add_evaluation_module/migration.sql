-- AlterTable
ALTER TABLE "placements" ADD COLUMN "finalEvaluationDue" DATETIME;
ALTER TABLE "placements" ADD COLUMN "midtermEvaluationDue" DATETIME;

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placementId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "studentMsg" TEXT,
    "supervisorMsg" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evaluations_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "evaluation_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "submittedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "answers" TEXT,
    "lastSavedAt" DATETIME,
    "lockedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evaluation_submissions_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "evaluations_placementId_type_idx" ON "evaluations"("placementId", "type");

-- CreateIndex
CREATE INDEX "evaluation_submissions_evaluationId_role_idx" ON "evaluation_submissions"("evaluationId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_submissions_evaluationId_role_key" ON "evaluation_submissions"("evaluationId", "role");
