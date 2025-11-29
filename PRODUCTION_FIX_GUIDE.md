# Guia de Aplicação do Fix Financeiro em Produção (Railway)

## ⚠️ IMPORTANTE: Leia Antes de Executar

Este guia descreve como aplicar o fix de precisão financeira nas campanhas em produção na Railway.

## 📋 Pré-requisitos

1. Deploy do código com o fix já deve estar feito na Railway
2. Acesso ao Railway CLI ou ao console web da Railway
3. Backup do banco de dados (recomendado antes de qualquer operação)

## 🔍 Passo 1: Validar Estado Atual (ANTES do Fix)

Primeiro, vamos verificar quais campanhas têm erro de precisão:

### Opção A: Via Railway CLI (Recomendado)

```bash
# Instalar Railway CLI (se ainda não tiver)
npm i -g @railway/cli

# Login
railway login

# Link ao projeto
railway link

# Executar validação
railway run npm run validate:financial
```

### Opção B: Via Railway SSH

```bash
railway ssh

# Dentro do SSH
npm run validate:financial
```

### Opção C: Via Railway Console (Database URL)

1. Acesse https://railway.app
2. Vá no seu projeto
3. Clique no serviço **backend**
4. Vá em **Variables** e copie a `DATABASE_URL`
5. No seu terminal local:

```bash
# Substitua <DATABASE_URL> pela URL real do Railway
DATABASE_URL="<DATABASE_URL>" node backend/scripts/validate-financial-integrity.js
```

### 📊 Análise dos Resultados

O script vai mostrar algo assim:

```
Campaign: Nome da Campanha (id)
  Orders: 24
  Campaign Shipping Cost: 400.00
  Sum of Order Shipping Fees: 399.99  ← ⚠️ ERRO!
  Sum of Totals: 5750.01
  Expected Total: 5750.00

  ✓ Checks:
    Shipping Distribution: ✗ FAIL      ← ⚠️ Precisa recalcular
    Total = Subtotals + Shipping: ✗ FAIL
    Total = Paid + Unpaid: ✗ FAIL

=== SUMMARY ===
Total Campaigns: 5
Passed: 2
Failed: 3  ← ⚠️ 3 campanhas precisam ser recalculadas
```

**Anote quais campanhas falharam!**

## 🔧 Passo 2: Recalcular Todas as Campanhas

⚠️ **ATENÇÃO**: Este script vai **atualizar** os valores de `shippingFee` e `total` em todos os pedidos.

### Fazer Backup (CRÍTICO!)

**No Railway Console:**
1. Vá em **Data** → PostgreSQL
2. Clique em **Backups**
3. Crie um backup manual antes de continuar

### Executar Recalculação

#### Opção A: Via Railway CLI (Recomendado)

```bash
railway run npm run fix:financial
```

#### Opção B: Via Railway SSH

```bash
railway ssh

# Dentro do SSH
npm run fix:financial
```

#### Opção C: Via Conexão Direta

```bash
DATABASE_URL="<DATABASE_URL>" node backend/scripts/recalculate-all-campaigns.js
```

### 📊 Resultado Esperado

```
Found 5 campaigns to recalculate

Recalculating: Campanha 1 (id123)
  ✓ Success

Recalculating: Campanha 2 (id456)
  ✓ Success

...

=== SUMMARY ===
Total Campaigns: 5
Success: 5
Errors: 0
```

## ✅ Passo 3: Validar Novamente (DEPOIS do Fix)

Execute a validação novamente para confirmar que tudo está correto:

### Via Railway CLI

```bash
railway run npm run validate:financial
```

### Via Railway SSH

```bash
railway ssh
npm run validate:financial
```

### 🎯 Resultado Esperado

```
=== SUMMARY ===
Total Campaigns: 5
Passed: 5  ← ✅ Todas passando!
Failed: 0
```

## 🌐 Passo 4: Validar via API (Opcional)

Você também pode validar campanhas específicas via API:

```bash
# Obter token de autenticação (fazer login no frontend primeiro)
TOKEN="seu_token_aqui"

# Validar campanha específica
curl -H "Authorization: Bearer $TOKEN" \
  https://seu-app.railway.app/api/validation/campaign/CAMPAIGN_ID
```

Resultado esperado:
```json
{
  "campaignId": "...",
  "campaignName": "...",
  "passed": true,
  "checks": {
    "shippingDistribution": { "passed": true, "expected": 400.00, "actual": 400.00 },
    "totalCalculation": { "passed": true, "expected": 5750.00, "actual": 5750.00 },
    "paidUnpaidSum": { "passed": true, "expected": 5750.00, "actual": 5750.00 }
  }
}
```

## 📝 Checklist de Execução

- [ ] 1. Backup do banco de dados criado
- [ ] 2. Código com fix deployado na Railway
- [ ] 3. Validação ANTES executada e resultados anotados
- [ ] 4. Script de recalculação executado com sucesso
- [ ] 5. Validação DEPOIS confirma 0 erros
- [ ] 6. Teste manual no frontend (criar pedido e verificar totais)
- [ ] 7. Verificar analytics page (sem erro de 1 centavo)

## 🚨 Troubleshooting

### Erro: "Connection refused"
```
DATABASE_URL está incorreta ou banco não está acessível
```
**Solução**: Verifique a DATABASE_URL nas variáveis do Railway

### Erro: "Campaign not found"
```
O script tentou acessar uma campanha que não existe
```
**Solução**: Isso é normal se campanhas foram deletadas. Ignore.

### Erro: "Permission denied"
```
Usuário do banco não tem permissão
```
**Solução**: Use a DATABASE_URL do Railway que tem permissões corretas

### Validação ainda falha após recalculação

**Causas possíveis:**
1. Deploy do código não foi feito (ainda usando código antigo)
2. Cache do Prisma Client desatualizado

**Solução:**
```bash
# Regenerar Prisma Client no Railway
railway run npx prisma generate

# Reiniciar serviço
railway restart
```

## 🔄 Rollback (Se Necessário)

Se algo der errado:

1. **Via Railway Console:**
   - Vá em Data → PostgreSQL → Backups
   - Restore do backup criado no Passo 2

2. **Via código:**
   - Revert do commit `c19a815`
   - Redeploy na Railway

## 📊 Monitoramento Pós-Fix

Após aplicar o fix, monitore:

1. **Criar novo pedido** e verificar que totais batem
2. **Analytics page** não deve ter discrepância de centavos
3. **Logs do Railway** não devem ter erros relacionados a Money utility

## ✅ Confirmação Final

Execute este comando para verificar o status final:

```bash
railway run node scripts/validate-financial-integrity.js
```

**Sucesso se:**
```
=== SUMMARY ===
Total Campaigns: X
Passed: X  ← Mesmo número
Failed: 0  ← Zero falhas
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `railway logs`
2. Confirme que o deploy foi feito: `railway status`
3. Teste localmente primeiro com Docker antes de aplicar em produção

---

**🎉 Após seguir este guia, todas as campanhas em produção estarão com precisão financeira 100% correta!**
