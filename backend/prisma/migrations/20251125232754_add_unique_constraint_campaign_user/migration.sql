-- CreateIndex
CREATE UNIQUE INDEX "orders_campaignId_userId_key" ON "orders"("campaignId", "userId");
