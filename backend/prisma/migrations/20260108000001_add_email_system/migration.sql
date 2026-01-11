-- EmailStatus Enum
CREATE TYPE "EmailStatus" AS ENUM (
  'PENDING',
  'SENT',
  'FAILED',
  'RETRYING'
);

-- EmailPreference Table
CREATE TABLE "email_preferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
  "campaignReadyToSend" BOOLEAN NOT NULL DEFAULT true,
  "campaignStatusChanged" BOOLEAN NOT NULL DEFAULT true,
  "campaignArchived" BOOLEAN NOT NULL DEFAULT true,
  "newMessage" BOOLEAN NOT NULL DEFAULT true,
  "digestEnabled" BOOLEAN NOT NULL DEFAULT false,
  "digestFrequency" TEXT NOT NULL DEFAULT 'DAILY',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "email_preferences_pkey" PRIMARY KEY ("id")
);

-- EmailPreference Indexes
CREATE UNIQUE INDEX "email_preferences_userId_key" ON "email_preferences"("userId");
CREATE INDEX "email_preferences_userId_idx" ON "email_preferences"("userId");

-- EmailPreference Foreign Key
ALTER TABLE "email_preferences" ADD CONSTRAINT "email_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EmailLog Table
CREATE TABLE "email_logs" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "to" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "templateName" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "notificationId" TEXT,
  "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
  "sentAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "error" TEXT,
  "providerId" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "opened" BOOLEAN NOT NULL DEFAULT false,
  "openedAt" TIMESTAMP(3),
  "clicked" BOOLEAN NOT NULL DEFAULT false,
  "clickedAt" TIMESTAMP(3),
  "bounced" BOOLEAN NOT NULL DEFAULT false,
  "bouncedAt" TIMESTAMP(3),
  "unsubscribeToken" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- EmailLog Indexes
CREATE UNIQUE INDEX "email_logs_unsubscribeToken_key" ON "email_logs"("unsubscribeToken");
CREATE INDEX "email_logs_userId_idx" ON "email_logs"("userId");
CREATE INDEX "email_logs_notificationId_idx" ON "email_logs"("notificationId");
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");
CREATE INDEX "email_logs_createdAt_idx" ON "email_logs"("createdAt");

-- EmailLog Foreign Keys
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
