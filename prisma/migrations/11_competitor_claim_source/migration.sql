-- A claim pushed from the Slack sync, or typed in by hand, has no
-- CompetitorDocument, so it had nowhere to say where it came from and the claims
-- table could only show "Entered by hand". These two columns carry the link and
-- its label for those claims. Both nullable and additive: documents keep
-- supplying the source for claims read out of them.

-- AlterTable
ALTER TABLE "CompetitorInsight" ADD COLUMN "sourceUrl" TEXT;
ALTER TABLE "CompetitorInsight" ADD COLUMN "sourceLabel" TEXT;
