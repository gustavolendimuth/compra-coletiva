#!/bin/bash
# Script para mover a migration para o diretório correto
# Execute dentro do container Docker:
#   docker compose exec backend sh /app/move-migration.sh
#
# OU diretamente se tiver permissões de root:
#   sudo ./move-migration.sh

SOURCE_CONTAINER="/app/prisma/migrations_pending/20251207000001_add_phone_to_users"
TARGET_CONTAINER="/app/prisma/migrations/20251207000001_add_phone_to_users"
SOURCE_HOST="./backend/prisma/migrations_pending/20251207000001_add_phone_to_users"
TARGET_HOST="./backend/prisma/migrations/20251207000001_add_phone_to_users"

# Detecta se está no container ou no host
if [ -d "/app/prisma" ]; then
    SOURCE="$SOURCE_CONTAINER"
    TARGET="$TARGET_CONTAINER"
    echo "Executando dentro do container..."
else
    SOURCE="$SOURCE_HOST"
    TARGET="$TARGET_HOST"
    echo "Executando no host..."
fi

if [ -d "$SOURCE" ]; then
    mkdir -p "$(dirname $TARGET)"
    mv "$SOURCE" "$TARGET"
    echo "✅ Migration movida com sucesso para: $TARGET"
    
    # Remove diretório pending se estiver vazio
    PENDING_DIR="$(dirname $SOURCE)"
    rmdir "$PENDING_DIR" 2>/dev/null && echo "📁 Diretório temporário removido"
    
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. Execute 'npx prisma migrate deploy' para aplicar a migration"
    echo "   2. Execute 'npx prisma generate' para atualizar o client"
else
    echo "❌ Erro: Diretório fonte não encontrado: $SOURCE"
    echo ""
    echo "Verifique se o arquivo existe em:"
    echo "   - Container: $SOURCE_CONTAINER"
    echo "   - Host: $SOURCE_HOST"
    exit 1
fi
