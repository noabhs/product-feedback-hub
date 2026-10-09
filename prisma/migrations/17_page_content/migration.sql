-- Owner-editable markdown pages (first use: Analytics -> Hub data).

-- CreateTable
CREATE TABLE "PageContent" (
    "slug" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageContent_pkey" PRIMARY KEY ("slug")
);
