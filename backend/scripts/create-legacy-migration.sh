#!/bin/bash

# Script para criar migration de usuários legados
# Este script deve ser executado dentro do container do backend

set -e

echo "🚀 Criando migration para usuários legados..."

# Criar migration via Prisma
npx prisma migrate dev --name add_is_legacy_user_field --create-only

echo "✅ Migration criada!"
echo ""
echo "📝 Próximos passos:"
echo "1. Revisar a migration criada em prisma/migrations/"
echo "2. Aplicar migration: npx prisma migrate deploy"
echo "3. Executar migração de dados: npm run fix:legacy-users"
