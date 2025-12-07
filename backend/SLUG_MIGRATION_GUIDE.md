# Guia de Migração: Adição de Slugs nas Campanhas

Este guia explica como aplicar a migração que adiciona slugs únicos às campanhas.

## 📋 Pré-requisitos

1. O campo `slug` já foi adicionado ao `schema.prisma`
2. Docker Compose está rodando (`docker-compose up`)

## 🚀 Passos da Migração

### 1. Criar a Migration do Prisma

Entre no container do backend:

```bash
docker exec -it compra-coletiva-backend sh
```

Dentro do container, execute:

```bash
npx prisma migrate dev --name add_campaign_slug
```

Isso irá:
- Criar a migration SQL que adiciona a coluna `slug` (nullable temporariamente)
- Adicionar o índice único no slug
- Aplicar automaticamente no banco de desenvolvimento

### 2. Gerar Slugs para Campanhas Existentes

Ainda dentro do container, execute o script de migração de dados:

```bash
npx ts-node scripts/generate-campaign-slugs.ts
```

Este script irá:
- Buscar todas as campanhas sem slug
- Gerar slugs únicos baseados no nome de cada campanha
- Atualizar as campanhas no banco de dados

### 3. Tornar o Slug Obrigatório (Opcional)

Se você quiser tornar o campo `slug` obrigatório (recomendado após a migração inicial):

1. No `schema.prisma`, remova o `?` do campo slug se ele existir
2. Execute novamente:

```bash
npx prisma migrate dev --name make_slug_required
```

## 🧪 Verificação

Para verificar se tudo funcionou:

```sql
-- Verificar se todos as campanhas têm slug
SELECT COUNT(*) FROM campaigns WHERE slug IS NULL OR slug = '';
-- Deve retornar 0

-- Ver alguns exemplos de slugs gerados
SELECT id, name, slug FROM campaigns LIMIT 10;
```

## ⚠️ Importante

- **Backup**: Sempre faça backup do banco antes de migrar em produção
- **Ordem**: Execute os passos na ordem exata (migration → script de geração)
- **Produção**: Em produção, use `npx prisma migrate deploy` ao invés de `migrate dev`

## 🔄 Rollback (Se Necessário)

Se algo der errado, você pode reverter:

```bash
# Dentro do container
npx prisma migrate resolve --rolled-back <migration_name>
```

E restaurar um backup do banco de dados.

