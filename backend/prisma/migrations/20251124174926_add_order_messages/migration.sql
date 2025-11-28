-- CreateEnum
CREATE TYPE "MessageSenderType" AS ENUM ('ADMIN', 'CUSTOMER');

-- CreateTable
CREATE TABLE "order_messages" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderType" "MessageSenderType" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_messages_orderId_idx" ON "order_messages"("orderId");

-- AddForeignKey
ALTER TABLE "order_messages" ADD CONSTRAINT "order_messages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
