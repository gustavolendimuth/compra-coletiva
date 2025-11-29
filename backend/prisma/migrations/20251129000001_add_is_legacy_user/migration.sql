-- AlterTable: Add isLegacyUser field to users table
ALTER TABLE "users" ADD COLUMN "isLegacyUser" BOOLEAN NOT NULL DEFAULT false;

-- Remove the unique constraint on name (will be replaced with partial unique index)
DROP INDEX IF EXISTS "users_name_key";

-- Create partial unique index: only enforce uniqueness for non-legacy users
CREATE UNIQUE INDEX "users_name_key" ON "users"("name") WHERE "isLegacyUser" = false;
