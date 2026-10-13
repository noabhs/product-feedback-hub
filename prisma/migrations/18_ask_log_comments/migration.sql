-- CreateTable
CREATE TABLE "AskLogComment" (
    "id" TEXT NOT NULL,
    "askLogId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AskLogComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AskLogComment_askLogId_idx" ON "AskLogComment"("askLogId");

-- AddForeignKey
ALTER TABLE "AskLogComment" ADD CONSTRAINT "AskLogComment_askLogId_fkey" FOREIGN KEY ("askLogId") REFERENCES "AskLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
