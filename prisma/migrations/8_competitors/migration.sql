-- Tracked competitors, surfaced on /competitors. Sourced from the "CI
-- Launcher" tool's public data, kept in sync by re-running the seed script.

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subgroup" TEXT,
    "positioning" TEXT,
    "website" TEXT,
    "overview" TEXT,
    "keyFacts" TEXT,
    "differentiation" TEXT,
    "lastUpdated" TIMESTAMP(3),
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorSource" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_name_key" ON "Competitor"("name");

-- CreateIndex
CREATE INDEX "Competitor_category_idx" ON "Competitor"("category");

-- CreateIndex
CREATE INDEX "CompetitorSource_competitorId_idx" ON "CompetitorSource"("competitorId");

-- AddForeignKey
ALTER TABLE "CompetitorSource" ADD CONSTRAINT "CompetitorSource_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
