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

# Primeiro, tenta resolver migrações falhadas (se houver)
echo "🔍 Checking for failed migrations..."
if npx prisma migrate status 2>&1 | grep -q "failed"; then
  echo "⚠️  Found failed migration, attempting to resolve..."
  npx prisma migrate resolve --rolled-back "20251125200000_populate_legacy_user_data" || true
fi

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

# Inicia o servidor
echo "🚀 Starting Node.js server..."
node dist/index.js
