-- AlterTable: add image metadata fields to products
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "imageKey" TEXT,
  ADD COLUMN IF NOT EXISTS "imageStorageType" "ImageStorageType";
