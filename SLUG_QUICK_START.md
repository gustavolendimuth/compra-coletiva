# Guia Rápido: Aplicar Migration de Slug

## 🚨 Problema Detectado

A migration `20251207000002_add_campaign_image` está corrompida. Vamos resolver isso primeiro.

## ✅ Solução Passo a Passo

### 1. Entre no Container

```bash
docker exec -it compra-coletiva-backend sh
```

### 2. Corrija a Migration Corrompida

Dentro do container, execute:

```bash
cat > /app/prisma/migrations/20251207000002_add_campaign_image/migration.sql << 'EOF'
-- CreateEnum
CREATE TYPE "ImageStorageType" AS ENUM ('S3', 'LOCAL');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "imageKey" TEXT,
ADD COLUMN     "imageStorageType" "ImageStorageType";
EOF
```

### 3. Marque a Migration como Aplicada

Se a migration já foi aplicada no banco (os campos imageUrl, imageKey já existem):

```bash
npx prisma migrate resolve --applied 20251207000002_add_campaign_image
```

OU, se a migration ainda não foi aplicada:

```bash
npx prisma migrate deploy
```

### 4. Crie a Nova Migration de Slug

```bash
npx prisma migrate dev --name add_campaign_slug
```

Isso criará e aplicará automaticamente a migration que adiciona:
- Campo `slug` (TEXT, UNIQUE)
- Índice no campo `slug`

### 5. Gere Slugs para Campanhas Existentes

```bash
npx ts-node scripts/generate-campaign-slugs.ts
```

### 6. Saia do Container

```bash
exit
```

## 🔍 Verificação

Para verificar se tudo funcionou, entre novamente no container e execute:

```bash
docker exec -it compra-coletiva-backend sh
```

Dentro do container:

```bash
# Verificar o schema
npx prisma db pull

# Conectar ao banco e verificar
psql $DATABASE_URL -c "\d campaigns"
```

Você deve ver:
- ✅ Coluna `slug` (text, unique)
- ✅ Índice `campaigns_slug_idx`
- ✅ Colunas imageUrl, imageKey, imageStorageType

## 🆘 Alternativa: Reset Completo (⚠️ CUIDADO - Apaga Dados)

Se nada funcionar e você estiver em **desenvolvimento** (não produção):

```bash
# DENTRO DO CONTAINER
npx prisma migrate reset --force

# Depois rode as seeds se houver
npm run seed
```

Isso vai:
1. Dropar o banco
2. Criar novamente
3. Aplicar todas as migrations
4. Rodar as seeds

## 📝 Notas Importantes

- ⚠️ **NUNCA** use `migrate reset` em produção
- ✅ Sempre faça backup antes de migrations em produção
- ✅ A migration de slug é não-destrutiva (apenas adiciona campo)
- ✅ Campanhas existentes receberão slugs automaticamente via script

## 🎯 Resultado Esperado

Após concluir, as URLs das campanhas serão:

```
Antes: /campaigns/clrx12abc
Depois: /campaigns/nome-da-campanha
```

E as URLs antigas continuarão funcionando (retrocompatibilidade)!

