-- AlterTable
ALTER TABLE "placements" ADD COLUMN "archivedAt" DATETIME;

-- CreateIndex
CREATE INDEX "placements_studentId_status_idx" ON "placements"("studentId", "status");

-- CreateIndex
CREATE INDEX "placements_supervisorId_status_idx" ON "placements"("supervisorId", "status");
