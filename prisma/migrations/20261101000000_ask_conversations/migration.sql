-- AlterTable
ALTER TABLE "AskLog" ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "standaloneQuestion" TEXT,
ADD COLUMN     "turnIndex" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AskConversation" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pendingQuestion" TEXT,
    "sourcePool" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AskConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AskConversation_actor_updatedAt_idx" ON "AskConversation"("actor", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AskLog_conversationId_turnIndex_key" ON "AskLog"("conversationId", "turnIndex");

-- AddForeignKey
ALTER TABLE "AskLog" ADD CONSTRAINT "AskLog_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AskConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
