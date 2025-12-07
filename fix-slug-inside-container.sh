#!/bin/sh

# Este script deve ser executado DENTRO do container
# Use: docker exec -it compra-coletiva-backend sh -c "sh /app/../fix-slug-inside-container.sh"

echo "🔧 Corrigindo migration corrompida..."

# Corrige o arquivo da migration corrompida
cat > /app/prisma/migrations/20251207000002_add_campaign_image/migration.sql << 'EOF'
-- CreateEnum
CREATE TYPE "ImageStorageType" AS ENUM ('S3', 'LOCAL');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "imageKey" TEXT,
ADD COLUMN     "imageStorageType" "ImageStorageType";
EOF

echo "✅ Migration corrigida!"
echo ""

# Verificar se os campos já existem
echo "🔍 Verificando estado atual do banco..."
RESULT=$(psql $DATABASE_URL -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name IN ('imageUrl', 'imageKey', 'imageStorageType');" 2>&1)

if echo "$RESULT" | grep -q "imageUrl"; then
  echo "✅ Campos de imagem já existem. Marcando migration como aplicada..."
  cd /app && npx prisma migrate resolve --applied 20251207000002_add_campaign_image
else
  echo "⚠️  Campos não existem. Aplicando migration..."
  cd /app && npx prisma migrate deploy
fi

echo ""
echo "🚀 Criando migration de slug..."
cd /app && npx prisma migrate dev --name add_campaign_slug --skip-seed

echo ""
echo "📝 Gerando slugs para campanhas existentes..."
cd /app && npx ts-node scripts/generate-campaign-slugs.ts

echo ""
echo "🎉 Concluído! Verificando resultado..."
psql $DATABASE_URL -c "SELECT id, name, slug FROM campaigns LIMIT 3;"
