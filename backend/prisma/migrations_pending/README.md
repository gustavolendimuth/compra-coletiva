# Migrations Pendentes

Este diretório contém migrations que precisam ser movidas para o diretório `migrations/`.

## Como aplicar

### Opção 1: Via Docker (Recomendado)

```bash
# 1. Inicie o Docker Desktop
# 2. Inicie os containers
docker compose up -d

# 3. Execute o script de movimentação
docker compose exec backend sh /app/move-migration.sh

# 4. Aplique a migration
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma generate
```

### Opção 2: Via sudo (se tiver permissão)

```bash
sudo mv ./backend/prisma/migrations_pending/20251207000001_add_phone_to_users \
        ./backend/prisma/migrations/

# Depois, dentro do container:
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma generate
```

## Migrations neste diretório

1. **20251207000001_add_phone_to_users** - Adiciona campo `phone` na tabela `users`
   - Adiciona coluna `phone TEXT` (nullable)
   - Cria índice `users_phone_idx`

