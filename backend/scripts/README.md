# Scripts de Migração - Usuários Legados

## 🚀 Execução Rápida

### Ambiente Local (Docker)

```bash
# Método Recomendado (via npm scripts)
docker exec compra-coletiva-backend npm run prisma:migrate:deploy
docker exec compra-coletiva-backend npm run fix:legacy-users

# Método Alternativo (SQL direto)
docker exec compra-coletiva-backend sh -c "PGPASSWORD=postgres psql -h db -U postgres -d compra_coletiva -f /app/scripts/fix-legacy-users.sql"

# Verificar resultado
docker exec compra-coletiva-backend sh -c "PGPASSWORD=postgres psql -h db -U postgres -d compra_coletiva -c \"SELECT name, email, \\\"isLegacyUser\\\", (SELECT COUNT(*) FROM orders WHERE \\\"userId\\\" = users.id) as order_count FROM users WHERE \\\"isLegacyUser\\\" = true ORDER BY order_count DESC LIMIT 10;\""
```

### Railway (Produção)

```bash
# Método Recomendado (via Railway CLI + npm scripts)
railway link
railway run --service backend npm run prisma:migrate:deploy
railway run --service backend npm run fix:legacy-users

# Método Alternativo (SQL direto)
railway run --service postgres psql < backend/scripts/fix-legacy-users.sql

# Verificar resultado
railway run --service backend npx prisma studio
```

**📖 Documentação Completa**: Ver [`../../RAILWAY_LEGACY_MIGRATION.md`](../../RAILWAY_LEGACY_MIGRATION.md)

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
