-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

-- CreateIndex
CREATE INDEX "campaigns_slug_idx" ON "campaigns"("slug");

