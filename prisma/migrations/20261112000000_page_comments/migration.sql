-- CreateTable
CREATE TABLE "PageComment" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageComment_path_idx" ON "PageComment"("path");
