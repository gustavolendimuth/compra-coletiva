# Comandos para Copiar e Colar no Terminal

Você está dentro do container em `/app #`. Copie e cole estes comandos **um por vez**:

## 1️⃣ Corrigir a migration corrompida

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

Pressione ENTER após colar.

## 2️⃣ Verificar se migration já foi aplicada

```bash
psql $DATABASE_URL -c "\d campaigns" | grep -E "imageUrl|imageKey|imageStorageType"
```

**Se os campos aparecerem** (migration já aplicada), execute:

```bash
npx prisma migrate resolve --applied 20251207000002_add_campaign_image
```

**Se NÃO aparecerem** (migration não aplicada), execute:

```bash
npx prisma migrate deploy
```

## 3️⃣ Criar migration de slug

```bash
npx prisma migrate dev --name add_campaign_slug
```

Quando perguntado se quer criar o banco, digite `y` e ENTER.

## 4️⃣ Gerar slugs para campanhas existentes

```bash
npx ts-node scripts/generate-campaign-slugs.ts
```

## 5️⃣ Verificar se funcionou

```bash
psql $DATABASE_URL -c "SELECT id, name, slug FROM campaigns LIMIT 5;"
```

Você deve ver slugs gerados para cada campanha!

---

## ✅ Pronto!

Após executar todos os comandos, digite `exit` para sair do container.

Os slugs estarão funcionando e as URLs serão do tipo:
- `/campaigns/nome-da-campanha` ✨
