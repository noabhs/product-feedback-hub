-- CreateTable
CREATE TABLE "FeedbackSyncState" (
    "source" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedbackSyncState_pkey" PRIMARY KEY ("source")
);
