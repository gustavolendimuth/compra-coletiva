-- LGPD consentimento legal e rastreabilidade
ALTER TABLE "users" ADD COLUMN "legalAcceptanceRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "termsAcceptedVersion" TEXT;
ALTER TABLE "users" ADD COLUMN "privacyAcceptedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "privacyAcceptedVersion" TEXT;
ALTER TABLE "users" ADD COLUMN "salesDisclaimerAcceptedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "salesDisclaimerAcceptedVersion" TEXT;

CREATE INDEX "users_legalAcceptanceRequired_idx" ON "users"("legalAcceptanceRequired");

CREATE TYPE "LegalDocumentType" AS ENUM ('TERMS', 'PRIVACY', 'SALES_DISCLAIMER');

CREATE TABLE "legal_acceptance_logs" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "documentType" "LegalDocumentType" NOT NULL,
  "documentVersion" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "context" TEXT,

  CONSTRAINT "legal_acceptance_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "legal_acceptance_logs_userId_documentType_acceptedAt_idx"
  ON "legal_acceptance_logs"("userId", "documentType", "acceptedAt");
CREATE INDEX "legal_acceptance_logs_acceptedAt_idx"
  ON "legal_acceptance_logs"("acceptedAt");

ALTER TABLE "legal_acceptance_logs"
  ADD CONSTRAINT "legal_acceptance_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
