-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "customerName" DROP NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("name");
