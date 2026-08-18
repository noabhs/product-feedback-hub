-- Persists every "Ask the feedback" question with the answer Claude gave, so the
-- team can browse what has already been asked and so bad answers can be rated
-- and fixed. Before this, /api/ai/qa logged only the question text into
-- Event.label (truncated at 200 chars) and dropped the answer entirely.

-- CreateTable
CREATE TABLE "AskLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sourceIds" TEXT NOT NULL DEFAULT '[]',
    "matchedCount" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "rating" TEXT,
    "ratingNote" TEXT,
    "ratedBy" TEXT,
    "ratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AskLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AskLog_createdAt_idx" ON "AskLog"("createdAt");

-- CreateIndex
CREATE INDEX "AskLog_rating_idx" ON "AskLog"("rating");
