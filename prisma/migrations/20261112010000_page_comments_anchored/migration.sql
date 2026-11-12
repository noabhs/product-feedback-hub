-- Anchor, replies and resolve for page comments. Additive: every new column is
-- nullable or has a default, so rows from the first migration stay valid.
ALTER TABLE "PageComment"
  ADD COLUMN "parentId" TEXT,
  ADD COLUMN "selector" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "snippet" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "relX" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "relY" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "absX" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "absY" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "resolvedAt" TIMESTAMP(3),
  ADD COLUMN "resolvedBy" TEXT;

-- CreateIndex
CREATE INDEX "PageComment_parentId_idx" ON "PageComment"("parentId");

-- AddForeignKey
ALTER TABLE "PageComment" ADD CONSTRAINT "PageComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PageComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
