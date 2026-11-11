-- CreateEnum
CREATE TYPE "PaymentReleaseTrigger" AS ENUM ('ON_ACTIVE', 'ON_CLOSED', 'ON_SENT', 'ON_SHIPPING_UPDATED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_RELEASED';

-- AlterTable: Add payment release fields to campaigns
ALTER TABLE "campaigns" ADD COLUMN "paymentReleaseTrigger" "PaymentReleaseTrigger" NOT NULL DEFAULT 'ON_ACTIVE';
ALTER TABLE "campaigns" ADD COLUMN "paymentReleased" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "campaigns" ADD COLUMN "paymentReleasedAt" TIMESTAMP(3);

-- AlterTable: Add paymentReleased preference to email_preferences
ALTER TABLE "email_preferences" ADD COLUMN "paymentReleased" BOOLEAN NOT NULL DEFAULT true;

-- Data migration: Map existing pixVisibleAtStatus to paymentReleaseTrigger
UPDATE "campaigns" SET "paymentReleaseTrigger" = 'ON_ACTIVE' WHERE "pixVisibleAtStatus" = 'ACTIVE';
UPDATE "campaigns" SET "paymentReleaseTrigger" = 'ON_CLOSED' WHERE "pixVisibleAtStatus" = 'CLOSED';
UPDATE "campaigns" SET "paymentReleaseTrigger" = 'ON_SENT' WHERE "pixVisibleAtStatus" = 'SENT';

-- Data migration: Set paymentReleased based on current status and trigger
-- ON_ACTIVE: always released if status >= ACTIVE (which is always true)
UPDATE "campaigns" SET "paymentReleased" = true, "paymentReleasedAt" = "createdAt"
  WHERE "paymentReleaseTrigger" = 'ON_ACTIVE' AND "pixKey" IS NOT NULL;

-- ON_CLOSED: released if status is CLOSED, SENT, or ARCHIVED
UPDATE "campaigns" SET "paymentReleased" = true, "paymentReleasedAt" = "updatedAt"
  WHERE "paymentReleaseTrigger" = 'ON_CLOSED'
    AND "pixKey" IS NOT NULL
    AND "status" IN ('CLOSED', 'SENT', 'ARCHIVED');

-- ON_SENT: released if status is SENT or ARCHIVED
UPDATE "campaigns" SET "paymentReleased" = true, "paymentReleasedAt" = "updatedAt"
  WHERE "paymentReleaseTrigger" = 'ON_SENT'
    AND "pixKey" IS NOT NULL
    AND "status" IN ('SENT', 'ARCHIVED');
