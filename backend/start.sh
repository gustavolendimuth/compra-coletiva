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
npx prisma migrate deploy

# Verifica se as migrations foram bem-sucedidas
if [ $? -ne 0 ]; then
  echo "❌ ERROR: Migrations failed!"
  exit 1
fi

echo "✅ Migrations completed successfully"

# Inicia o servidor
echo "🚀 Starting Node.js server..."
node dist/index.js
