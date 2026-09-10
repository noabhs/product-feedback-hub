-- Competitor documents now yield discrete claims instead of one prose summary
-- each. A summary could not be filtered, could not be cited to a single
-- statement, and forced one sensitivity tag onto documents that mix shareable
-- product facts with pricing that must not leave the building.
--
-- So CompetitorDocument keeps only what it is good for — provenance, coverage,
-- freshness, and the verbatim text as an audit trail — and the claims move to
-- CompetitorInsight, filed by topic the way feedback is filed by product area.

-- AlterTable: the document no longer carries the condensed prose or a
-- document-wide sensitivity; both are properties of individual claims.
ALTER TABLE "CompetitorDocument" DROP COLUMN IF EXISTS "summary";
ALTER TABLE "CompetitorDocument" DROP COLUMN IF EXISTS "sensitivity";
ALTER TABLE "CompetitorDocument" DROP COLUMN IF EXISTS "sensitivityReason";
ALTER TABLE "CompetitorDocument" RENAME COLUMN "condenseVersion" TO "extractVersion";

-- DropIndex: the dropped column took its index with it.
DROP INDEX IF EXISTS "CompetitorDocument_sensitivity_idx";

-- CreateTable
CREATE TABLE "CompetitorInsight" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "documentId" TEXT,
    "oneLiner" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "topics" TEXT[],
    "productAreas" TEXT[],
    "confidence" TEXT NOT NULL,
    "sensitivity" TEXT NOT NULL,
    "sensitivityReason" TEXT,
    "asOf" TIMESTAMP(3),
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompetitorInsight_competitorId_idx" ON "CompetitorInsight"("competitorId");

-- CreateIndex
CREATE INDEX "CompetitorInsight_documentId_idx" ON "CompetitorInsight"("documentId");

-- CreateIndex
CREATE INDEX "CompetitorInsight_confidence_idx" ON "CompetitorInsight"("confidence");

-- CreateIndex
CREATE INDEX "CompetitorInsight_sensitivity_idx" ON "CompetitorInsight"("sensitivity");

-- AddForeignKey
ALTER TABLE "CompetitorInsight" ADD CONSTRAINT "CompetitorInsight_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: a deleted document leaves its claims standing but orphaned,
-- rather than silently taking the extracted knowledge with it.
ALTER TABLE "CompetitorInsight" ADD CONSTRAINT "CompetitorInsight_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CompetitorDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
