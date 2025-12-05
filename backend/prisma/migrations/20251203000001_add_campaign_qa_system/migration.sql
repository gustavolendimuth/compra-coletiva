-- AlterTable User: Add campaign chat fields
ALTER TABLE "users" ADD COLUMN "messageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "answeredCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "spamScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "lastMessageAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "isBanned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable CampaignMessage
CREATE TABLE "campaign_messages" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" TIMESTAMP(3),
    "answer" TEXT,
    "answeredAt" TIMESTAMP(3),
    "answeredBy" TEXT,
    "spamScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_messages_campaignId_isPublic_createdAt_idx" ON "campaign_messages"("campaignId", "isPublic", "createdAt");

-- CreateIndex
CREATE INDEX "campaign_messages_senderId_createdAt_idx" ON "campaign_messages"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "campaign_messages_campaignId_isPublic_idx" ON "campaign_messages"("campaignId", "isPublic");

-- AddForeignKey
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_answeredBy_fkey" FOREIGN KEY ("answeredBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
