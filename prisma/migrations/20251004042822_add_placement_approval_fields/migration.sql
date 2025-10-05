-- AlterTable
ALTER TABLE "placements" ADD COLUMN "approvedAt" DATETIME;
ALTER TABLE "placements" ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "placements" ADD COLUMN "declinedAt" DATETIME;
ALTER TABLE "placements" ADD COLUMN "declinedBy" TEXT;
ALTER TABLE "placements" ADD COLUMN "facultyNotes" TEXT;
