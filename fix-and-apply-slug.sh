#!/bin/sh

# Script para corrigir migration corrompida e aplicar migration de slug
# Execute este script DENTRO do container: docker exec -it compra-coletiva-backend sh

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
echo "🔍 Verificando se a migration já foi aplicada no banco..."

# Verifica se os campos já existem no banco
HAS_COLUMNS=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name IN ('imageUrl', 'imageKey', 'imageStorageType');" 2>/dev/null || echo "0")

if [ "$HAS_COLUMNS" -ge 3 ]; then
  echo "✅ Campos já existem no banco. Marcando migration como aplicada..."
  npx prisma migrate resolve --applied 20251207000002_add_campaign_image
else
  echo "⚠️  Campos não existem. Aplicando migration..."
  npx prisma migrate deploy
fi

echo ""
echo "🚀 Criando migration de slug..."
npx prisma migrate dev --name add_campaign_slug

echo ""
echo "📝 Gerando slugs para campanhas existentes..."
npx ts-node scripts/generate-campaign-slugs.ts

echo ""
echo "🎉 Concluído! Slugs implementados com sucesso!"
