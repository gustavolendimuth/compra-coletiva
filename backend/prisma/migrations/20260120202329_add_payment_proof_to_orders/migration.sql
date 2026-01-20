-- AlterTable
ALTER TABLE "orders" ADD COLUMN "paymentProofUrl" TEXT,
ADD COLUMN "paymentProofKey" TEXT,
ADD COLUMN "paymentProofStorageType" "ImageStorageType";
