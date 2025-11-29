# 🚀 Quick Start - Migração de Usuários Legados

## TL;DR - Comandos Rápidos

### 📍 Local (Desenvolvimento)

```bash
# 1. Aplicar migration do schema
docker exec compra-coletiva-backend npm run prisma:migrate:deploy

# 2. Migrar dados legados
docker exec compra-coletiva-backend npm run fix:legacy-users
```

### ☁️ Railway (Produção)

```bash
# 1. Linkar projeto (apenas primeira vez)
railway link

# 2. Aplicar migration do schema
railway run --service backend npm run prisma:migrate:deploy

# 3. Migrar dados legados
railway run --service backend npm run fix:legacy-users
```

---

## 📦 Comandos NPM Disponíveis

```bash
# Aplicar migrations do Prisma (schema changes)
npm run prisma:migrate:deploy

# Migrar dados de usuários legados
npm run fix:legacy-users

# Validar integridade financeira (sempre rodar após migração)
npm run validate:financial
```

---

## ✅ Checklist de Execução

- [ ] 1. Fazer commit das mudanças no código
- [ ] 2. Fazer deploy no Railway (ou pull local)
- [ ] 3. Aplicar migration do Prisma: `npm run prisma:migrate:deploy`
- [ ] 4. Executar migração de dados: `npm run fix:legacy-users`
- [ ] 5. Validar integridade: `npm run validate:financial`
- [ ] 6. Verificar frontend (pedidos devem aparecer separados)
- [ ] 7. Testar criação de novo usuário (nome único deve funcionar)

---

## 🎯 O Que Cada Comando Faz?

### `npm run prisma:migrate:deploy`
- ✅ Adiciona coluna `isLegacyUser` na tabela `users`
- ✅ Remove constraint `UNIQUE` de `users.name`
- ✅ Cria índice parcial único (apenas para usuários não-legados)
- ⏱️ Tempo estimado: ~5 segundos
- 🔒 Seguro: Não modifica dados, apenas schema

### `npm run fix:legacy-users`
- ✅ Identifica todos os pedidos sob "Sistema (Legado)"
- ✅ Cria usuários virtuais individuais para cada `customerName`
- ✅ Re-vincula pedidos aos respectivos usuários virtuais
- ✅ Marca usuários como legados (`isLegacyUser = true`)
- ⏱️ Tempo estimado: ~10-30 segundos (depende da quantidade de pedidos)
- 🔒 Seguro: Idempotente (pode rodar múltiplas vezes)

---

## 📊 Verificação Visual

### Antes da Migração
```
Detalhamento
Por Pessoa

Sistema (Legado)    R$ 5.750,00    Pago    👁️    💲
```

### Depois da Migração
```
Detalhamento
Por Pessoa

João Silva         R$ 250,00    Pago    👁️    💲
Maria Santos       R$ 450,00    Pago    👁️    💲
Pedro Oliveira     R$ 180,00    Pago    👁️    💲
Ana Costa          R$ 320,00    Pago    👁️    💲
```

---

## ⚡ Execução Automática (Opcional)

Se quiser que a migração rode automaticamente no próximo deploy, edite [`backend/start.sh`](backend/start.sh):

```bash
#!/bin/sh

# Aplicar migrations
echo "🔄 Aplicando migrations..."
npx prisma migrate deploy

# Migrar usuários legados (se necessário)
echo "🔧 Verificando migração de usuários legados..."
npm run fix:legacy-users || echo "✅ Migração já aplicada"

# Iniciar servidor
echo "🚀 Iniciando servidor..."
npm start
```

---

## 🆘 Problemas Comuns

### "Column isLegacyUser does not exist"
```bash
# Rodar migration do Prisma primeiro
npm run prisma:migrate:deploy
```

### "Migration already applied"
```bash
# Normal! Apenas rode o script de dados
npm run fix:legacy-users
```

### "Pedidos ainda aparecem como Sistema (Legado)"
```bash
# 1. Limpar cache do browser (Ctrl+Shift+R)
# 2. Verificar se script rodou com sucesso nos logs
railway logs --service backend
```

---

## 📚 Documentação Completa

- **Guia Detalhado**: [`LEGACY_USERS_MIGRATION_GUIDE.md`](LEGACY_USERS_MIGRATION_GUIDE.md)
- **Railway Específico**: [`RAILWAY_LEGACY_MIGRATION.md`](RAILWAY_LEGACY_MIGRATION.md)
- **Scripts**: [`backend/scripts/README.md`](backend/scripts/README.md)

---

## 🎓 Exemplos de Uso

### Local - Primeira Execução
```bash
docker exec compra-coletiva-backend npm run prisma:migrate:deploy
docker exec compra-coletiva-backend npm run fix:legacy-users
```

### Railway - Deploy em Produção
```bash
# Após fazer push do código
railway run --service backend npm run prisma:migrate:deploy
railway run --service backend npm run fix:legacy-users

# Verificar logs
railway logs --service backend --follow
```

### Verificar Resultado
```bash
# Via Railway CLI
railway run --service backend npx prisma studio

# Via SQL direto
railway run --service postgres psql -c "
  SELECT name, \"isLegacyUser\", COUNT(*) as orders
  FROM users u
  JOIN orders o ON u.id = o.\"userId\"
  WHERE u.\"isLegacyUser\" = true
  GROUP BY u.id, u.name, u.\"isLegacyUser\"
  ORDER BY orders DESC;
"
```

---

**💡 Dica**: Os comandos `npm run` funcionam tanto localmente (via `docker exec`) quanto no Railway (via `railway run`). Use o método que for mais conveniente!

---

**Data de Criação**: 2025-11-29
**Versão**: 1.0
**Status**: ✅ Pronto para Produção
