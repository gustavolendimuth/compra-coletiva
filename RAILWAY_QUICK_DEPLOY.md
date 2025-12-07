# Deploy Rápido no Railway - Sistema com Slugs

## 🚀 Deploy Automático (Recomendado)

O sistema está configurado para deploy **totalmente automático**. Basta fazer push para o GitHub:

```bash
git add .
git commit -m "feat: sistema de slugs implementado"
git push origin main
```

**O Railway vai automaticamente**:
1. ✅ Detectar mudanças
2. ✅ Fazer build do backend
3. ✅ Executar migrations (incluindo add_campaign_slug)
4. ✅ Gerar slugs para campanhas existentes
5. ✅ Iniciar servidor

## 📋 Checklist Pré-Deploy

- [ ] Todas as alterações commitadas
- [ ] Migrations testadas localmente
- [ ] Script de slugs testado localmente
- [ ] Variáveis de ambiente configuradas no Railway

## 🔍 Verificar Deploy

### 1. Acompanhar Logs
```bash
# Via Railway Dashboard
# Ou via CLI:
railway logs --service backend --follow
```

### 2. Procurar por:
```
✅ Migrations completed successfully
🔖 Generating slugs for campaigns...
🎉 All campaigns now have unique slugs!
✅ Slug generation completed
🚀 Starting Node.js server...
```

### 3. Testar API
```bash
# Substituir pela sua URL do Railway
curl https://seu-backend.railway.app/api/campaigns
```

## ⚠️ Se Algo Der Errado

### Executar Geração de Slugs Manualmente
```bash
railway run --service backend npx tsx scripts/generate-slugs-standalone.ts
```

### Verificar Status das Migrations
```bash
railway run --service backend npx prisma migrate status
```

### Ver Logs Detalhados
```bash
railway logs --service backend --tail 100
```

## 🎯 URLs Esperadas

Após deploy bem-sucedido:

**API Backend**:
```
https://seu-backend.railway.app/api/campaigns
https://seu-backend.railway.app/api/campaigns/pedidos-cafe-cebb
```

**Frontend**:
```
https://seu-frontend.railway.app/campaigns
https://seu-frontend.railway.app/campaigns/pedidos-cafe-cebb
```

## ✅ Deploy Completo!

Se os logs mostraram:
- ✅ Migrations completed
- ✅ Slugs generated
- ✅ Server started

**Seu sistema está no ar com URLs amigáveis!** 🎉

