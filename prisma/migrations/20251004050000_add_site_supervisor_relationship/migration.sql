-- CreateTable
CREATE TABLE "supervisor_profiles_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "title" TEXT,
    CONSTRAINT "supervisor_profiles_new_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "supervisor_profiles_new_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Copy existing data and map organizationName to siteId
INSERT INTO "supervisor_profiles_new" ("id", "userId", "siteId", "title")
SELECT 
    sp.id,
    sp."userId",
    s.id as "siteId",
    sp.title
FROM "supervisor_profiles" sp
JOIN "sites" s ON s.name = sp."organizationName";

-- DropTable
DROP TABLE "supervisor_profiles";

-- RenameTable
ALTER TABLE "supervisor_profiles_new" RENAME TO "supervisor_profiles";

-- CreateIndex
CREATE UNIQUE INDEX "supervisor_profiles_userId_key" ON "supervisor_profiles"("userId");
