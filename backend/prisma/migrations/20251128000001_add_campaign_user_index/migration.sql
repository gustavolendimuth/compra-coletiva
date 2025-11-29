-- CreateIndex (non-unique for legacy compatibility)
CREATE INDEX IF NOT EXISTS "orders_campaignId_userId_idx" ON "orders"("campaignId", "userId");
