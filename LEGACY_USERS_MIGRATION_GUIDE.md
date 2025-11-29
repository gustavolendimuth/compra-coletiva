# Guia de Migração - Usuários Legados (Legacy Users)

## Problema Identificado

Durante a implementação do sistema de autenticação, todos os pedidos sem usuário foram atribuídos a um único usuário "Sistema (Legado)". Isso causou uma agregação incorreta onde todos os pedidos legados apareciam somados sob um único nome no Railway.

### Root Cause
A migração `20251125221431_link_orders_to_users_and_unique_names.sql` criou um índice **UNIQUE** no campo `users.name`:

```sql
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");
```

Isso impossibilitou criar múltiplos usuários virtuais para cada `customerName` original dos pedidos legados.

---

## Solução Implementada

### Estratégia: **Usuários Virtuais Individuais**

Ao invés de agrupar todos os pedidos legados em um único usuário "Sistema (Legado)", a solução cria **usuários virtuais individuais** para cada `customerName` original, preservando a separação de pedidos.

### Mudanças Arquiteturais

1. **Novo campo `isLegacyUser`**: Flag booleana para diferenciar usuários virtuais de usuários reais
2. **Remoção do UNIQUE constraint**: Campo `users.name` não é mais único no banco de dados
3. **Índice UNIQUE Parcial**: Criado índice único apenas para usuários não-legados
4. **Validação Programática**: Unicidade de nome validada na camada de aplicação

---

## Arquitetura da Solução

### 1. Schema do Banco de Dados

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String?  // Nullable para Google OAuth
  name         String   // Removed @unique - uniqueness enforced at app level
  role         UserRole @default(CUSTOMER)
  googleId     String?  @unique
  isLegacyUser Boolean  @default(false) // Flag para diferenciar usuários virtuais
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // ... relações
}
```

### 2. Índices do Banco de Dados

```sql
-- Índice regular para performance (apenas usuários não-legados)
CREATE INDEX "users_name_idx" ON "users"("name") WHERE "isLegacyUser" = false;

-- Índice UNIQUE parcial (apenas para usuários reais)
CREATE UNIQUE INDEX "users_name_unique_non_legacy" ON "users"("name")
WHERE "isLegacyUser" = false;
```

**Vantagens**:
- Usuários reais têm nomes únicos (garantido por índice)
- Usuários legados podem ter nomes duplicados (sem restrição)
- Performance mantida através de índices parciais

### 3. Geração de Usuários Virtuais

```sql
-- Cada customerName original gera um usuário virtual único
INSERT INTO "users" (
  "id",
  "email",
  "name",
  "role",
  "isLegacyUser"
)
SELECT
  'legacy-user-' || encode(digest(customerName, 'sha256'), 'hex'),
  'legacy-' || encode(digest(customerName, 'sha256'), 'hex') || '@legacy.local',
  customerName,
  'CUSTOMER',
  true
FROM (SELECT DISTINCT customerName FROM orders WHERE ...)
```

**Características**:
- ID único: `legacy-user-{SHA256(customerName)}`
- Email único: `legacy-{SHA256(customerName)}@legacy.local`
- Nome: `customerName` original (pode ter duplicatas entre usuários legados)
- Flag: `isLegacyUser = true`

---

## Passos de Migração

### Ambiente Local (Desenvolvimento)

```bash
# 1. Atualizar schema do Prisma
# Já foi atualizado em backend/prisma/schema.prisma

# 2. Criar e aplicar migration
docker exec compra-coletiva-backend npx prisma migrate dev --name fix_legacy_users_structure

# Ou aplicar migration SQL diretamente
docker exec compra-coletiva-backend psql $DATABASE_URL -f /app/scripts/fix-legacy-users.sql

# 3. Regenerar Prisma Client
docker exec compra-coletiva-backend npx prisma generate

# 4. Reiniciar servidor
docker-compose restart backend
```

### Railway (Produção)

```bash
# 1. Fazer deploy das mudanças no schema e código

# 2. Conectar ao banco de dados Railway
railway connect postgres

# 3. Executar script de migração
\i backend/scripts/fix-legacy-users.sql

# Ou via CLI:
railway run psql < backend/scripts/fix-legacy-users.sql

# 4. Verificar resultados
SELECT
  u.name,
  u.email,
  u."isLegacyUser",
  COUNT(o.id) as order_count,
  SUM(o.total) as total_amount
FROM "users" u
LEFT JOIN "orders" o ON o."userId" = u.id
WHERE u."isLegacyUser" = true
GROUP BY u.id, u.name, u.email, u."isLegacyUser"
ORDER BY order_count DESC;
```

---

## Validação da Solução

### Checklist Pós-Migração

- [ ] Todos os pedidos legados têm usuários individuais
- [ ] Nenhum pedido está agrupado sob "Sistema (Legado)"
- [ ] Analytics por cliente mostra valores separados corretamente
- [ ] Usuários reais ainda conseguem se registrar
- [ ] Validação de nome duplicado funciona para novos usuários
- [ ] Frontend exibe nomes de clientes corretamente

### Queries de Verificação

```sql
-- 1. Verificar distribuição de pedidos por usuário
SELECT
  u.name,
  u."isLegacyUser",
  COUNT(o.id) as total_orders,
  SUM(o.total) as total_value
FROM "users" u
LEFT JOIN "orders" o ON o."userId" = u.id
GROUP BY u.id, u.name, u."isLegacyUser"
ORDER BY total_orders DESC;

-- 2. Verificar usuários legados criados
SELECT COUNT(*) as total_legacy_users
FROM "users"
WHERE "isLegacyUser" = true;

-- 3. Verificar se ainda existe usuário "Sistema (Legado)" com pedidos
SELECT u.*, COUNT(o.id) as orders
FROM "users" u
LEFT JOIN "orders" o ON o."userId" = u.id
WHERE u.email IN ('system@legacy.local', 'sistema@compracoletiva.internal')
GROUP BY u.id;
```

---

## Mudanças de Código

### 1. Auth Routes (`backend/src/routes/auth.ts`)

**Antes**:
```typescript
const existingName = await prisma.user.findUnique({
  where: { name },
});
```

**Depois**:
```typescript
const existingName = await prisma.user.findFirst({
  where: {
    name,
    isLegacyUser: false, // Apenas verifica usuários reais
  },
});
```

### 2. Display de Nomes

**Antes** (complexo):
```typescript
const getCustomerDisplayName = (order: Order): string => {
  const isLegacyOrder = order.customer.email === 'sistema@compracoletiva.internal';
  return isLegacyOrder && order.customerName
    ? order.customerName
    : order.customer.name;
};
```

**Depois** (simples):
```typescript
const getCustomerDisplayName = (order: Order): string => {
  return order.customer.name;
};
```

---

## Benefícios da Solução

### ✅ Técnicos
- **Separação de dados**: Cada pedido legado mantém sua identidade individual
- **Integridade referencial**: Todas as foreign keys funcionam corretamente
- **Performance**: Índices parciais mantêm queries rápidas
- **Escalabilidade**: Solução suporta milhares de usuários legados

### ✅ Negócio
- **Histórico preservado**: Dados legados mantêm a mesma granularidade
- **Analytics corretos**: Relatórios mostram valores individuais por cliente
- **UX consistente**: Interface trata usuários legados e novos uniformemente
- **Migração transparente**: Usuários finais não percebem a diferença

### ✅ Manutenção
- **Código simplificado**: Remoção de lógica condicional complexa
- **Padrão claro**: Flag `isLegacyUser` comunica intenção explicitamente
- **Fácil auditoria**: Query simples identifica todos os usuários legados
- **Rollback seguro**: Migration pode ser revertida se necessário

---

## Considerações de Segurança

### Usuários Virtuais
- ✅ Não têm senha (`password = NULL`)
- ✅ Não podem fazer login
- ✅ Não têm sessões ativas
- ✅ Email com domínio `@legacy.local` (não recebe emails)
- ✅ Flag `isLegacyUser` identifica facilmente

### Validação de Unicidade
- ✅ Usuários reais: validação programática + índice UNIQUE parcial
- ✅ Usuários legados: permitido duplicatas (diferentes IDs/emails)
- ✅ Impossível criar usuário real com `isLegacyUser = true` via API

---

## Troubleshooting

### Problema: Migration falha com "duplicate key value"

**Causa**: Já existem usuários virtuais criados

**Solução**:
```sql
-- Deletar usuários virtuais duplicados
DELETE FROM "users"
WHERE "isLegacyUser" = true
  AND "email" LIKE '%@legacy.local';

-- Re-executar migration
```

### Problema: Frontend ainda mostra "Sistema (Legado)"

**Causa**: Cache do React Query ou pedidos não migrados

**Solução**:
```typescript
// 1. Invalidar cache
queryClient.invalidateQueries(['campaigns']);
queryClient.invalidateQueries(['orders']);

// 2. Verificar pedidos não migrados
SELECT o.*, u.email, u.name
FROM "orders" o
JOIN "users" u ON o."userId" = u.id
WHERE u.email IN ('system@legacy.local', 'sistema@compracoletiva.internal');
```

---

## Rollback (Se Necessário)

```sql
-- 1. Restaurar todos os pedidos legados ao usuário "Sistema (Legado)"
UPDATE "orders" o
SET "userId" = (SELECT id FROM "users" WHERE email = 'system@legacy.local')
FROM "users" u
WHERE o."userId" = u.id AND u."isLegacyUser" = true;

-- 2. Deletar usuários virtuais
DELETE FROM "users" WHERE "isLegacyUser" = true AND email != 'system@legacy.local';

-- 3. Remover flag isLegacyUser (opcional)
ALTER TABLE "users" DROP COLUMN "isLegacyUser";

-- 4. Recriar índice UNIQUE
CREATE UNIQUE INDEX "users_name_key" ON "users"("name");
```

---

## Próximos Passos

1. ✅ Aplicar migration em desenvolvimento
2. ✅ Validar com dados de teste
3. ⏳ Criar backup do banco Railway
4. ⏳ Aplicar migration em produção (Railway)
5. ⏳ Monitorar logs e analytics
6. ⏳ Atualizar documentação do projeto

---

## Referências

- Migration SQL: [`backend/scripts/fix-legacy-users.sql`](backend/scripts/fix-legacy-users.sql)
- Schema Prisma: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
- Auth Routes: [`backend/src/routes/auth.ts`](backend/src/routes/auth.ts)
- Frontend Display: [`frontend/src/pages/CampaignDetail.tsx`](frontend/src/pages/CampaignDetail.tsx)

---

**Desenvolvido por**: Claude Code
**Data**: 2025-11-29
**Versão**: 1.0
