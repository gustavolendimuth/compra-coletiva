# Scripts de Migração - Usuários Legados

## Execução Rápida

### Ambiente Local (Docker)

```bash
# 1. Criar migration do Prisma
docker exec compra-coletiva-backend npx prisma migrate dev --name fix_legacy_users_structure

# Ou aplicar SQL diretamente (alternativa)
docker exec compra-coletiva-backend sh -c "PGPASSWORD=postgres psql -h db -U postgres -d compra_coletiva -f /app/scripts/fix-legacy-users.sql"

# 2. Regenerar Prisma Client
docker exec compra-coletiva-backend npx prisma generate

# 3. Reiniciar backend
docker-compose restart backend

# 4. Verificar resultado
docker exec compra-coletiva-backend sh -c "PGPASSWORD=postgres psql -h db -U postgres -d compra_coletiva -c \"SELECT name, email, \\\"isLegacyUser\\\", (SELECT COUNT(*) FROM orders WHERE \\\"userId\\\" = users.id) as order_count FROM users WHERE \\\"isLegacyUser\\\" = true;\""
```

### Railway (Produção)

```bash
# Opção 1: Via Railway CLI
railway link
railway run --service postgres psql < backend/scripts/fix-legacy-users.sql

# Opção 2: Via Railway Connect
railway connect postgres
# Dentro do psql:
\i backend/scripts/fix-legacy-users.sql

# Opção 3: Via Railway Console
# 1. Abrir Railway Dashboard
# 2. Ir em Database > Query
# 3. Copiar e colar conteúdo de fix-legacy-users.sql
# 4. Executar
```

## Verificação

### Query para verificar usuários legados criados

```sql
SELECT
  u.name,
  u.email,
  u."isLegacyUser",
  COUNT(o.id) as order_count,
  SUM(o.total) as total_value
FROM "users" u
LEFT JOIN "orders" o ON o."userId" = u.id
WHERE u."isLegacyUser" = true
GROUP BY u.id, u.name, u.email, u."isLegacyUser"
ORDER BY order_count DESC;
```

### Resultado Esperado

Antes da migração:
```
         name         |              email               | isLegacyUser | order_count | total_value
----------------------+----------------------------------+--------------+-------------+-------------
 Sistema (Legado)     | system@legacy.local              | t            |          45 |     5750.00
```

Depois da migração:
```
         name         |                    email                     | isLegacyUser | order_count | total_value
----------------------+----------------------------------------------+--------------+-------------+-------------
 João Silva           | legacy-abc123...@legacy.local                | t            |           3 |      250.00
 Maria Santos         | legacy-def456...@legacy.local                | t            |           5 |      450.00
 Pedro Oliveira       | legacy-ghi789...@legacy.local                | t            |           2 |      180.00
 ...
```

## Troubleshooting

Se a migration falhar, consulte o guia completo em:
[`/LEGACY_USERS_MIGRATION_GUIDE.md`](../../LEGACY_USERS_MIGRATION_GUIDE.md)
