-- The text behind each CompetitorSource link, read once by the ingest script
-- (scripts/ingest-competitors.ts) and stored so "Ask the hub" can quote
-- competitor material without fetching anything at question time.
--
-- Rows are written for failures and skips as well as successes: a service
-- account reaches some of these Drive files and not others, and coverage is
-- only knowable if the misses are recorded.

-- CreateTable
CREATE TABLE "CompetitorDocument" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "sourceId" TEXT,
    "externalId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "text" TEXT,
    "summary" TEXT,
    "sensitivity" TEXT,
    "sensitivityReason" TEXT,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "sourceUpdatedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "condenseVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorDocument_competitorId_externalId_key" ON "CompetitorDocument"("competitorId", "externalId");

-- CreateIndex
CREATE INDEX "CompetitorDocument_competitorId_idx" ON "CompetitorDocument"("competitorId");

-- CreateIndex
CREATE INDEX "CompetitorDocument_status_idx" ON "CompetitorDocument"("status");

-- CreateIndex
CREATE INDEX "CompetitorDocument_sensitivity_idx" ON "CompetitorDocument"("sensitivity");

-- AddForeignKey
ALTER TABLE "CompetitorDocument" ADD CONSTRAINT "CompetitorDocument_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
