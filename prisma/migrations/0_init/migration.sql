-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "productArea" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "persona" TEXT,
    "oneLiner" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "client" TEXT,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'SHEET',
    "date" TIMESTAMP(3),
    "wtp" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscoveryQuestion" (
    "id" TEXT NOT NULL,
    "productArea" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "persona" TEXT,
    "question" TEXT NOT NULL,
    "notesIntent" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveryQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productArea" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "format" TEXT,
    "topics" TEXT,
    "link" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Insight_productArea_idx" ON "Insight"("productArea");

-- CreateIndex
CREATE INDEX "Insight_client_idx" ON "Insight"("client");

-- CreateIndex
CREATE INDEX "Insight_theme_idx" ON "Insight"("theme");

-- CreateIndex
CREATE INDEX "DiscoveryQuestion_productArea_idx" ON "DiscoveryQuestion"("productArea");

-- CreateIndex
CREATE INDEX "DiscoveryQuestion_theme_idx" ON "DiscoveryQuestion"("theme");

