-- CreateEnum
CREATE TYPE "PixKeyType" AS ENUM ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "pixKey" TEXT,
ADD COLUMN     "pixType" "PixKeyType",
ADD COLUMN     "pixName" TEXT,
ADD COLUMN     "pixVisibleAtStatus" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE';
