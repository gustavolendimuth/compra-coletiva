-- Add default address fields for users
ALTER TABLE "users" ADD COLUMN "addressCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "defaultZipCode" TEXT;
ALTER TABLE "users" ADD COLUMN "defaultAddress" TEXT;
ALTER TABLE "users" ADD COLUMN "defaultAddressNumber" TEXT;
ALTER TABLE "users" ADD COLUMN "defaultNeighborhood" TEXT;
ALTER TABLE "users" ADD COLUMN "defaultCity" TEXT;
ALTER TABLE "users" ADD COLUMN "defaultState" TEXT;
ALTER TABLE "users" ADD COLUMN "defaultLatitude" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "defaultLongitude" DOUBLE PRECISION;
