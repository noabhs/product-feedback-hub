-- One feedback entry can touch several product areas, so productArea (a single
-- value) becomes productAreas (a text array).
--
-- Order matters and the whole file runs in one transaction: the array is
-- populated from the old column before that column is dropped, so no entry can
-- lose its area even if a later statement fails.

-- AlterTable
ALTER TABLE "Insight" ADD COLUMN "productAreas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Carry every existing entry over. Blank or null areas become an empty array
-- rather than an array containing an empty string.
UPDATE "Insight"
SET "productAreas" = ARRAY["productArea"]
WHERE "productArea" IS NOT NULL AND btrim("productArea") <> '';

-- DropIndex
DROP INDEX IF EXISTS "Insight_productArea_idx";

-- AlterTable
ALTER TABLE "Insight" DROP COLUMN "productArea";

-- GIN, because the area filter queries this with hasSome (`&&`), which a btree
-- index cannot serve.
CREATE INDEX "Insight_productAreas_idx" ON "Insight" USING GIN ("productAreas");
