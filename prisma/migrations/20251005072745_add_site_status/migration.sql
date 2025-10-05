-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "practiceAreas" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agreementExpirationDate" DATETIME,
    "agreementStartMonth" INTEGER,
    "agreementStartYear" INTEGER,
    "staffHasActiveLicense" TEXT,
    "supervisorTraining" TEXT
);
INSERT INTO "new_sites" ("active", "address", "agreementExpirationDate", "agreementStartMonth", "agreementStartYear", "city", "contactEmail", "contactName", "contactPhone", "createdAt", "id", "name", "practiceAreas", "staffHasActiveLicense", "state", "supervisorTraining", "zip") SELECT "active", "address", "agreementExpirationDate", "agreementStartMonth", "agreementStartYear", "city", "contactEmail", "contactName", "contactPhone", "createdAt", "id", "name", "practiceAreas", "staffHasActiveLicense", "state", "supervisorTraining", "zip" FROM "sites";
DROP TABLE "sites";
ALTER TABLE "new_sites" RENAME TO "sites";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
