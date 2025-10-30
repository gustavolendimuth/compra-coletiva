#!/bin/sh

# Script de inicialização do backend em produção

echo "🚀 Starting backend..."

# Executa migrations do Prisma
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Inicia o servidor
echo "✅ Starting Node.js server..."
node dist/index.js
