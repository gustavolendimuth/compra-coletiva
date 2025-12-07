# Comandos para Corrigir Migração e Aplicar Slugs

## 🚨 Problema
A migração `20251207000002_add_campaign_image` estava corrompida com erro de sintaxe SQL.

## ✅ Solução

### Opção 1: Executar Fora do Container (Recomendado)

```bash
# 1. Sair do container se estiver dentro
exit

# 2. Parar os containers
docker-compose down

# 3. Reiniciar os containers
docker-compose up -d

# 4. Aguardar containers iniciarem (15-30 segundos)
Start-Sleep -Seconds 20

# 5. Aplicar migrações
docker exec compra-coletiva-backend npx prisma migrate deploy

# 6. Gerar slugs para campanhas existentes
docker exec compra-coletiva-backend npx ts-node scripts/generate-campaign-slugs.ts

# 7. Verificar logs
docker-compose logs backend --tail=50
```

### Opção 2: Dentro do Container (Se preferir)

Se você já está dentro do container (`/app #`):

```bash
# 1. Sair do modo dev e usar deploy
npx prisma migrate deploy

# 2. Gerar prisma client
npx prisma generate

# 3. Executar script de geração de slugs
npx ts-node scripts/generate-campaign-slugs.ts

# 4. Sair do container
exit
```

### Opção 3: Reset Completo (Se nada funcionar)

```bash
# 1. Sair do container se estiver dentro
exit

# 2. Parar e remover volumes
docker-compose down -v

# 3. Reiniciar do zero
docker-compose up -d

# 4. Aguardar banco inicializar
Start-Sleep -Seconds 30

# 5. As migrações serão aplicadas automaticamente no start.sh
```

## 📋 O que foi corrigido

O arquivo `backend/prisma/migrations/20251207000002_add_campaign_image/migration.sql` estava assim:

```sql
-- CreateEnum
CREATE TYPE \
```

Agora está correto:

```sql
-- CreateEnum
CREATE TYPE "ImageStorageType" AS ENUM ('S3', 'LOCAL');

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "imageKey" TEXT,
ADD COLUMN     "imageStorageType" "ImageStorageType";
```

## 🎯 Verificar se Funcionou

```bash
# Ver status dos containers
docker-compose ps

# Ver logs do backend
docker-compose logs backend --tail=30

# Testar se backend responde
curl http://localhost:3000/api/campaigns
```

## 🚀 Após Aplicar

1. Acesse: http://localhost:5173/campaigns
2. Clique em uma campanha
3. Veja a URL com slug: `/campaigns/nome-da-campanha`

## 💡 Dica

Use **Opção 1** (fora do container) - é mais simples e confiável!

```powershell
# Cole tudo de uma vez no PowerShell
docker-compose down
docker-compose up -d
Start-Sleep -Seconds 20
docker exec compra-coletiva-backend npx prisma migrate deploy
docker exec compra-coletiva-backend npx ts-node scripts/generate-campaign-slugs.ts
docker-compose logs backend --tail=20
```


