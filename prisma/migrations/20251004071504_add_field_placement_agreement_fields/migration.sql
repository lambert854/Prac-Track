-- AlterTable
ALTER TABLE "sites" ADD COLUMN "agreementExpirationDate" DATETIME;
ALTER TABLE "sites" ADD COLUMN "agreementStartMonth" INTEGER;
ALTER TABLE "sites" ADD COLUMN "agreementStartYear" INTEGER;
ALTER TABLE "sites" ADD COLUMN "staffHasActiveLicense" TEXT;
ALTER TABLE "sites" ADD COLUMN "supervisorTraining" TEXT;
