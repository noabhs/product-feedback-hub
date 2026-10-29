-- The ticket naming review tool: reviews, their items, and an audit log of every
-- rename made in Jira.

-- CreateTable
CREATE TABLE "NamingReview" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "viewUrl" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NamingReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NamingItem" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "current" TEXT NOT NULL,
    "proposed" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT 'pending',
    "data" JSONB NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NamingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NamingAudit" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "by" TEXT NOT NULL,
    "reviewId" TEXT,
    "action" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "itemKey" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "error" TEXT,
    "reverted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NamingAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NamingReview_createdAt_idx" ON "NamingReview"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NamingItem_reviewId_key_key" ON "NamingItem"("reviewId", "key");

-- CreateIndex
CREATE INDEX "NamingItem_reviewId_order_idx" ON "NamingItem"("reviewId", "order");

-- CreateIndex
CREATE INDEX "NamingAudit_at_idx" ON "NamingAudit"("at");

-- AddForeignKey
ALTER TABLE "NamingItem" ADD CONSTRAINT "NamingItem_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "NamingReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
