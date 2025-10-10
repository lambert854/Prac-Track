-- AlterTable
ALTER TABLE "sites" ADD COLUMN "learningContractStatus" TEXT;

-- CreateTable
CREATE TABLE "agency_learning_contracts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tokenExpiry" DATETIME NOT NULL,
    "sentToEmail" TEXT NOT NULL,
    "sentToName" TEXT,
    "submittedAt" DATETIME,
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "agencyEmail" TEXT NOT NULL,
    "agencyName" TEXT NOT NULL,
    "agencyAddress" TEXT NOT NULL,
    "agencyCity" TEXT NOT NULL,
    "agencyState" TEXT NOT NULL,
    "agencyZip" TEXT NOT NULL,
    "agencyTelephone" TEXT NOT NULL,
    "agencyDirector" TEXT NOT NULL,
    "fieldInstructorName" TEXT,
    "fieldInstructorFirstName" TEXT,
    "fieldInstructorLastName" TEXT,
    "fieldInstructorDegree" TEXT,
    "fieldInstructorLicense" TEXT,
    "fieldInstructorLicenseType" TEXT,
    "fieldInstructorResume" TEXT,
    "resourcesAvailable" TEXT,
    "servicesProvided" TEXT,
    "learningPlan" TEXT,
    "learningOpportunities" TEXT,
    "supervisionArrangement" TEXT,
    "instructionMethods" TEXT,
    "orientationArrangements" TEXT,
    "specialRequirements" TEXT,
    "handicapAccommodations" TEXT,
    "handicapAccommodationsDetails" TEXT,
    "promotionalMaterials" TEXT,
    "comments" TEXT,
    "completedByName" TEXT,
    "completedByTitle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agency_learning_contracts_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agency_learning_contracts_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "agency_learning_contracts_siteId_key" ON "agency_learning_contracts"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "agency_learning_contracts_token_key" ON "agency_learning_contracts"("token");
