# Fix: Migração Falhada no Railway

## 🚨 Problema

A migração `20251207000002_add_campaign_image` está falhando no Railway devido a um arquivo SQL corrompido que foi enviado anteriormente.

**Erro:**
```
ERROR: syntax error at or near "\"
Migration 20251207000002_add_campaign_image failed
```

## ✅ Solução Automática (Já Implementada)

O `start.sh` foi atualizado para resolver automaticamente esta migração falhada. No próximo deploy, ele vai:

1. Marcar a migração falhada como "rolled back"
2. Executar novamente com o arquivo corrigido
3. Gerar slugs automaticamente
4. Iniciar o servidor

## 🚀 Comandos para Resolver Agora

### Opção 1: Redeploy (Recomendado)

Basta fazer um novo deploy que o problema será resolvido automaticamente:

```bash
# Commit as mudanças
git add backend/start.sh
git add backend/prisma/migrations/20251207000002_add_campaign_image/migration.sql
git add backend/prisma/migrations/20251207000003_add_campaign_slug/
git commit -m "fix: corrige migração corrompida e adiciona slug"

# Push para Railway
git push origin main
```

### Opção 2: Resolver Manualmente via Railway CLI

```bash
# 1. Marcar migração como rolled back
railway run --service backend npx prisma migrate resolve --rolled-back "20251207000002_add_campaign_image"

# 2. Executar migrations
railway run --service backend npx prisma migrate deploy

# 3. Gerar slugs
railway run --service backend npx tsx scripts/generate-slugs-standalone.ts

# 4. Reiniciar serviço
railway restart --service backend
```

## 📋 Verificação

Após o deploy, verifique os logs:

```bash
railway logs --service backend --tail 100
```

**Logs esperados:**
```
🔍 Resolving any failed migrations...
✅ Failed migrations resolved (if any)
📦 Running database migrations...
✅ Migrations completed successfully
🔖 Generating slugs for campaigns...
🎉 All campaigns now have unique slugs!
🚀 Starting Node.js server...
```

## 🔍 Debugging

Se o problema persistir:

```bash
# Ver status das migrations
railway run --service backend npx prisma migrate status

# Ver tabela de migrations no banco
railway run --service backend psql -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

## ✨ Mudanças Feitas

1. **start.sh** - Adiciona resolve para `20251207000002_add_campaign_image`
2. **migration.sql** - Arquivo corrigido com SQL válido
3. **20251207000003_add_campaign_slug** - Nova migração para slugs

## 🎯 Próximo Deploy

No próximo push para `main`, o Railway vai:
- ✅ Resolver migração falhada automaticamente
- ✅ Aplicar migração corrigida
- ✅ Aplicar migração de slugs
- ✅ Gerar slugs para campanhas
- ✅ Iniciar servidor normalmente

**Sistema estará 100% funcional!**

