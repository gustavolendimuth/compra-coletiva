-- User Profile Extensions
ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "users" ADD COLUMN "avatarKey" TEXT;
ALTER TABLE "users" ADD COLUMN "avatarStorageType" "ImageStorageType";
ALTER TABLE "users" ADD COLUMN "pendingEmail" TEXT;
ALTER TABLE "users" ADD COLUMN "pendingEmailToken" TEXT;
ALTER TABLE "users" ADD COLUMN "pendingEmailExpires" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "deletedReason" TEXT;

-- Create unique index for pendingEmailToken
CREATE UNIQUE INDEX "users_pendingEmailToken_key" ON "users"("pendingEmailToken");

-- Create index for soft delete queries
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- AuditAction Enum
CREATE TYPE "AuditAction" AS ENUM (
  'USER_VIEW',
  'USER_EDIT',
  'USER_BAN',
  'USER_UNBAN',
  'USER_DELETE',
  'ROLE_CHANGE',
  'CAMPAIGN_VIEW',
  'CAMPAIGN_ARCHIVE',
  'CAMPAIGN_RESTORE',
  'CAMPAIGN_DELETE',
  'MESSAGE_DELETE',
  'SETTINGS_CHANGE'
);

-- AuditTargetType Enum
CREATE TYPE "AuditTargetType" AS ENUM (
  'USER',
  'CAMPAIGN',
  'ORDER',
  'MESSAGE',
  'FEEDBACK',
  'SYSTEM'
);

-- AuditLog Table
CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "adminId" TEXT,
  "action" "AuditAction" NOT NULL,
  "targetType" "AuditTargetType" NOT NULL,
  "targetId" TEXT,
  "details" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- AuditLog Indexes
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AuditLog Foreign Key
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
