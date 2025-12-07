# ⚡ Execute Estes Comandos no Seu Terminal (zsh)

Copie e cole estes comandos **UM POR VEZ** no seu terminal atual (fora do container):

## 1️⃣ Corrigir migration corrompida

```bash
docker exec compra-coletiva-backend sh -c "cat > /app/prisma/migrations/20251207000002_add_campaign_image/migration.sql << 'EOF'
-- CreateEnum
CREATE TYPE \"ImageStorageType\" AS ENUM ('S3', 'LOCAL');

-- AlterTable
ALTER TABLE \"campaigns\" ADD COLUMN     \"imageUrl\" TEXT,
ADD COLUMN     \"imageKey\" TEXT,
ADD COLUMN     \"imageStorageType\" \"ImageStorageType\";
EOF"
```

## 2️⃣ Verificar se migration já foi aplicada

```bash
docker exec compra-coletiva-backend psql -U postgres -d compra_coletiva -c "\d campaigns" | grep -E "imageUrl|imageKey"
```

### Se os campos APARECEREM (já aplicado):

```bash
docker exec compra-coletiva-backend sh -c "cd /app && npx prisma migrate resolve --applied 20251207000002_add_campaign_image"
```

### Se os campos NÃO aparecerem (não aplicado):

```bash
docker exec compra-coletiva-backend sh -c "cd /app && npx prisma migrate deploy"
```

## 3️⃣ Criar migration de slug

```bash
docker exec compra-coletiva-backend sh -c "cd /app && npx prisma migrate dev --name add_campaign_slug --skip-seed"
```

## 4️⃣ Gerar slugs para campanhas existentes

```bash
docker exec compra-coletiva-backend sh -c "cd /app && npx ts-node scripts/generate-campaign-slugs.ts"
```

## 5️⃣ Verificar resultado

```bash
docker exec compra-coletiva-backend psql -U postgres -d compra_coletiva -c "SELECT id, name, slug FROM campaigns LIMIT 5;"
```

Você deve ver slugs gerados! 🎉

---

## 🚀 OU Execute Tudo de Uma Vez:

```bash
docker exec compra-coletiva-backend sh /app/../fix-slug-inside-container.sh
```

---

## ✅ Após Concluir

As URLs das campanhas serão:
- **Antes**: `/campaigns/clrx12abc`
- **Depois**: `/campaigns/nome-da-campanha`

E as URLs antigas continuarão funcionando! 🎊
