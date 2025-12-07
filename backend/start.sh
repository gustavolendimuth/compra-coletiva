#!/bin/sh

# Script de inicialização do backend em produção

echo "🚀 Starting backend..."

# Verifica se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set!"
  exit 1
fi

echo "📊 Database URL is configured"

# Lista arquivos para debug
echo "📁 Checking prisma directory..."
ls -la prisma/
ls -la prisma/migrations/ || echo "⚠️  No migrations directory found"

# Executa migrations do Prisma
echo "📦 Running database migrations..."

# Primeiro, resolve migrações falhadas específicas (se houver)
echo "🔍 Resolving any failed migrations..."
npx prisma migrate resolve --rolled-back "20251125200000_populate_legacy_user_data" 2>/dev/null || true
npx prisma migrate resolve --rolled-back "20251125232754_add_unique_constraint_campaign_user" 2>/dev/null || true
echo "✅ Failed migrations resolved (if any)"

# Agora roda as migrations
npx prisma migrate deploy

# Verifica se as migrations foram bem-sucedidas
if [ $? -ne 0 ]; then
  echo "❌ ERROR: Migrations failed!"
  echo "Trying to get more details..."
  npx prisma migrate status || true
  exit 1
fi

echo "✅ Migrations completed successfully"

# Gera slugs para campanhas sem slug (seguro para execução repetida)
echo "🔖 Generating slugs for campaigns..."
npx tsx scripts/generate-slugs-standalone.ts || echo "⚠️  Slug generation failed (non-critical)"

echo "✅ Slug generation completed"

# Inicia o servidor
echo "🚀 Starting Node.js server..."
node dist/index.js
