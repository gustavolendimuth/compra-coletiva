# Migração de Usuários Legados - Railway Deploy

## 🎯 Resumo Executivo

Este guia explica como aplicar a migração de usuários legados no Railway após o deploy. A migração resolve o problema onde todos os pedidos antigos aparecem agrupados sob "Sistema (Legado)".

---

## 📋 Pré-requisitos

- ✅ Railway CLI instalado: `npm install -g @railway/cli`
- ✅ Projeto linkado: `railway link`
- ✅ Código já deployado no Railway com as mudanças do schema

---

## 🚀 Passo a Passo (Railway)

### **Opção 1: Via Railway CLI (Recomendado)**

```bash
# 1. Linkar seu projeto Railway (se ainda não estiver linkado)
railway link

# 2. Aplicar migrations do Prisma (isso cria a coluna isLegacyUser e remove UNIQUE constraint)
railway run --service backend npm run prisma:migrate:deploy

# 3. Executar script de migração de dados
railway run --service backend npm run fix:legacy-users

# 4. Verificar resultado
railway run --service backend npx prisma studio
# Ou verificar via logs:
railway logs --service backend
```

### **Opção 2: Via Railway Console**

1. **Aplicar Migrations do Prisma**
   - Abrir Railway Dashboard → Seu Projeto → Backend Service
   - Ir em "Deployments" → Último deploy
   - Clicar em "⋮" (três pontos) → "Run Command"
   - Executar: `npm run prisma:migrate:deploy`

2. **Executar Script de Migração**
   - Clicar novamente em "⋮" → "Run Command"
   - Executar: `npm run fix:legacy-users`

3. **Verificar Logs**
   - Ir em "Deployments" → Ver logs
   - Procurar por mensagens de sucesso da migração

### **Opção 3: Via Execução Automática no Startup**

Se preferir que a migração rode automaticamente no próximo deploy, adicione ao `start.sh`:

```bash
# Editar backend/start.sh e adicionar ANTES de npm start:

echo "🔧 Verificando e aplicando migração de usuários legados..."
npm run fix:legacy-users || echo "⚠️  Migração já aplicada ou não necessária"

echo "🚀 Iniciando servidor..."
npm start
```

---

## 📊 Verificação de Sucesso

### **Verificar via Railway CLI**

```bash
# Conectar ao banco de dados
railway run --service postgres psql

# No psql, executar:
SELECT
  u.name,
  u."isLegacyUser",
  COUNT(o.id) as order_count,
  SUM(o.total) as total_value
FROM "users" u
LEFT JOIN "orders" o ON o."userId" = u.id
WHERE u."isLegacyUser" = true
GROUP BY u.id, u.name, u."isLegacyUser"
ORDER BY order_count DESC
LIMIT 10;
```

### **Resultado Esperado**

**ANTES da migração:**
```
         name         | isLegacyUser | order_count | total_value
----------------------+--------------+-------------+-------------
 Sistema (Legado)     | t            |          45 |     5750.00
```

**DEPOIS da migração:**
```
         name         | isLegacyUser | order_count | total_value
----------------------+--------------+-------------+-------------
 João Silva           | t            |           3 |      250.00
 Maria Santos         | t            |           5 |      450.00
 Pedro Oliveira       | t            |           2 |      180.00
 Ana Costa            | t            |           4 |      320.00
 ...
```

---

## 🔍 Monitoramento de Logs

Durante a execução do script, você verá:

```
🚀 Iniciando migração de usuários legados...

📊 Step 1: Verificando estado atual...
   Encontrados 1 usuário(s) "Sistema (Legado)"
   - Sistema (Legado) (system@legacy.local): 45 pedidos

📋 Step 2: Identificando clientes legados únicos...
   Encontrados 15 clientes legados únicos

👥 Step 3: Criando usuários virtuais...
   Criados: 15 | Ignorados: 0
   ✅ Total: 15 usuários criados, 0 já existiam

🔗 Step 4: Re-vinculando pedidos aos usuários virtuais...
   Atualizados: 45 pedidos
   ✅ Total: 45 pedidos re-vinculados

🏷️  Step 5: Marcando usuários "Sistema (Legado)" como legados...
   ✅ Usuários marcados como legados

📊 Step 6: Verificação final...

   Top 10 usuários legados (por quantidade de pedidos):
   ┌─────────────────────────────────┬──────────┐
   │ Nome                            │ Pedidos  │
   ├─────────────────────────────────┼──────────┤
   │ João Silva                      │        5 │
   │ Maria Santos                    │        4 │
   │ Pedro Oliveira                  │        3 │
   ...
   └─────────────────────────────────┴──────────┘

   Total de usuários legados: 15
   Total de pedidos legados: 45

✅ Migração concluída com sucesso!
```

---

## ⚠️ Troubleshooting

### **Erro: "Migration already applied"**

✅ **Solução**: Isso é esperado se a migration já foi aplicada. O script é idempotente.

```bash
# Re-executar apenas o script de dados
railway run --service backend npm run fix:legacy-users
```

### **Erro: "Column isLegacyUser does not exist"**

❌ **Causa**: Migration do Prisma não foi aplicada

✅ **Solução**:
```bash
railway run --service backend npm run prisma:migrate:deploy
```

### **Erro: "Cannot connect to database"**

❌ **Causa**: Variável `DATABASE_URL` não está configurada

✅ **Solução**:
```bash
# Verificar variáveis de ambiente
railway variables --service backend

# Re-deployar se necessário
railway up
```

### **Script roda mas pedidos ainda aparecem como "Sistema (Legado)"**

❌ **Causa**: Frontend com cache ou pedidos sem `customerName`

✅ **Solução**:
```bash
# 1. Limpar cache do browser (Ctrl+Shift+R)

# 2. Verificar pedidos sem customerName
railway run --service postgres psql -c "
  SELECT COUNT(*) FROM orders o
  JOIN users u ON o.userId = u.id
  WHERE u.email = 'system@legacy.local'
  AND (o.customerName IS NULL OR o.customerName = '');
"

# Se houver pedidos sem customerName, eles permanecerão no usuário Sistema
```

---

## 🔄 Rollback (Se Necessário)

Se algo der errado, você pode reverter:

```bash
# Conectar ao banco
railway run --service postgres psql

# Executar rollback SQL
UPDATE "orders" o
SET "userId" = (SELECT id FROM "users" WHERE email = 'system@legacy.local')
FROM "users" u
WHERE o."userId" = u.id AND u."isLegacyUser" = true;

DELETE FROM "users" WHERE "isLegacyUser" = true AND email != 'system@legacy.local';
```

---

## 📦 Arquivos Incluídos no Deploy

Os seguintes arquivos estarão disponíveis no Railway após o deploy:

```
backend/
├── scripts/
│   ├── fix-legacy-users.js          # ✅ Script principal de migração
│   ├── fix-legacy-users.sql         # 📄 SQL alternativo (opcional)
│   └── create-legacy-migration.sh   # 🔧 Helper para desenvolvimento
├── prisma/
│   └── migrations/
│       └── [nova migration]         # 📦 Migration Prisma gerada
└── package.json                      # ✅ Com comando fix:legacy-users
```

---

## ✅ Checklist Final

Após executar a migração no Railway:

- [ ] Migration do Prisma aplicada (`prisma:migrate:deploy`)
- [ ] Script de migração executado (`fix:legacy-users`)
- [ ] Logs mostram sucesso (sem erros)
- [ ] Frontend mostra nomes individuais (não "Sistema (Legado)")
- [ ] Analytics por cliente funcionam corretamente
- [ ] Novos usuários conseguem se registrar sem erro de nome duplicado

---

## 🎓 Comandos de Referência Rápida

```bash
# Aplicar migration schema
railway run --service backend npm run prisma:migrate:deploy

# Migrar dados legados
railway run --service backend npm run fix:legacy-users

# Verificar resultado
railway run --service backend npx prisma studio

# Ver logs em tempo real
railway logs --service backend --follow

# Conectar ao banco
railway run --service postgres psql
```

---

**Documentação Completa**: Ver [`LEGACY_USERS_MIGRATION_GUIDE.md`](LEGACY_USERS_MIGRATION_GUIDE.md)

**Suporte**: Se encontrar problemas, abra uma issue com os logs completos.
