-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "pickupZipCode" TEXT,
ADD COLUMN     "pickupAddress" TEXT,
ADD COLUMN     "pickupAddressNumber" TEXT,
ADD COLUMN     "pickupComplement" TEXT,
ADD COLUMN     "pickupNeighborhood" TEXT,
ADD COLUMN     "pickupCity" TEXT,
ADD COLUMN     "pickupState" TEXT,
ADD COLUMN     "pickupLatitude" DOUBLE PRECISION,
ADD COLUMN     "pickupLongitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "campaigns_pickupLatitude_pickupLongitude_idx" ON "campaigns"("pickupLatitude", "pickupLongitude");

-- CreateIndex
CREATE INDEX "campaigns_pickupCity_idx" ON "campaigns"("pickupCity");