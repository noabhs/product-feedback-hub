-- Files attached to an Ask chat as context. Additive: a new table only.

-- CreateTable
CREATE TABLE "AskDocument" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AskDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AskDocument_conversationId_idx" ON "AskDocument"("conversationId");

-- AddForeignKey
ALTER TABLE "AskDocument" ADD CONSTRAINT "AskDocument_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AskConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
