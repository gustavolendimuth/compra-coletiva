# Implementação de Slugs para Campanhas - Resumo Completo

## 📝 Visão Geral

Implementação de slugs únicos para campanhas, substituindo IDs numéricos nas URLs por identificadores amigáveis e legíveis.

**Antes**: `/campaigns/clrx12abc`  
**Depois**: `/campaigns/cafe-cebb-outubro-2025`

## ✅ Mudanças Implementadas

### 1. **Backend - Schema do Banco de Dados**

**Arquivo**: `backend/prisma/schema.prisma`

- ✅ Adicionado campo `slug` (String, único, indexado)
- ✅ Índice criado para busca otimizada

```prisma
model Campaign {
  id   String @id @default(cuid())
  slug String @unique  // NOVO
  name String
  // ... outros campos
  
  @@index([slug])  // NOVO
}
```

### 2. **Backend - Utilitário de Slugificação**

**Arquivo**: `backend/src/utils/slugify.ts` (NOVO)

- ✅ Função `slugify()`: Converte texto para slug URL-friendly
- ✅ Função `generateUniqueSlug()`: Gera slug único (adiciona sufixo se necessário)
- ✅ Função `isValidSlug()`: Valida formato do slug
- ✅ Remove acentos e caracteres especiais
- ✅ Previne colisões (cafe-cebb, cafe-cebb-1, cafe-cebb-2, etc.)

### 3. **Backend - Rotas da API**

**Arquivo**: `backend/src/routes/campaigns.ts`

- ✅ Todas as rotas aceitam **ID ou slug** (retrocompatibilidade)
- ✅ Helper `findCampaignByIdOrSlug()` para busca flexível
- ✅ Geração automática de slug ao criar campanha
- ✅ Regeneração de slug ao atualizar nome da campanha
- ✅ Rotas atualizadas:
  - `GET /api/campaigns/:idOrSlug`
  - `PATCH /api/campaigns/:idOrSlug`
  - `PATCH /api/campaigns/:idOrSlug/status`
  - `DELETE /api/campaigns/:idOrSlug`
  - `POST /api/campaigns/:idOrSlug/clone`
  - `GET /api/campaigns/:idOrSlug/supplier-invoice`

### 4. **Backend - Middleware de Autorização**

**Arquivo**: `backend/src/middleware/authMiddleware.ts`

- ✅ `requireCampaignOwnership` atualizado para aceitar ID ou slug
- ✅ Busca por slug primeiro (mais comum em URLs)
- ✅ Fallback para ID (retrocompatibilidade)

### 5. **Frontend - Tipos TypeScript**

**Arquivo**: `frontend/src/api/types.ts`

- ✅ Interface `Campaign` atualizada com campo `slug`

```typescript
export interface Campaign {
  id: string;
  slug: string;  // NOVO
  name: string;
  // ... outros campos
}
```

### 6. **Frontend - Serviços API**

**Arquivo**: `frontend/src/api/services/campaign.service.ts`

- ✅ Métodos atualizados para aceitar `idOrSlug`
- ✅ Novo método `getBySlug()` (alias para `getById`)
- ✅ Todos os métodos suportam slug:
  - `getById(idOrSlug)`
  - `getBySlug(slug)`
  - `update(idOrSlug, data)`
  - `updateStatus(idOrSlug, status)`
  - `delete(idOrSlug)`
  - `clone(idOrSlug, data)`
  - `downloadSupplierInvoice(idOrSlug)`

### 7. **Frontend - Rotas**

**Arquivo**: `frontend/src/App.tsx`

- ✅ Rota alterada de `:id` para `:slug`

```typescript
// Antes
<Route path="campaigns/:id" element={<CampaignDetail />} />

// Depois
<Route path="campaigns/:slug" element={<CampaignDetail />} />
```

### 8. **Frontend - Hook useCampaignDetail**

**Arquivo**: `frontend/src/pages/campaign-detail/useCampaignDetail.ts`

- ✅ Usa `slug` do `useParams` ao invés de `id`
- ✅ Query key baseada em slug para cache
- ✅ Mutations usam slug para atualizações
- ✅ Navegação com slug ao clonar campanha
- ✅ Redireciona para novo slug se nome mudar

```typescript
// Antes
const { id: campaignId } = useParams<{ id: string }>();

// Depois
const { slug } = useParams<{ slug: string }>();
const campaignId = campaign?.id; // Obtido após carregar
```

### 9. **Frontend - Componentes**

**Arquivo**: `frontend/src/components/campaign/CampaignCard.tsx`

- ✅ Links usam `campaign.slug` ao invés de `campaign.id`

```typescript
// Antes
<Link to={`/campaigns/${campaign.id}`}>

// Depois
<Link to={`/campaigns/${campaign.slug}`}>
```

### 10. **Script de Migração de Dados**

**Arquivo**: `backend/scripts/generate-campaign-slugs.ts` (NOVO)

- ✅ Gera slugs para campanhas existentes sem slug
- ✅ Processa em ordem cronológica (mais antigas primeiro)
- ✅ Tratamento de erros robusto
- ✅ Relatório de sucesso/falha

```bash
npx ts-node scripts/generate-campaign-slugs.ts
```

### 11. **Documentação**

**Arquivo**: `backend/SLUG_MIGRATION_GUIDE.md` (NOVO)

- ✅ Guia passo a passo para migração
- ✅ Comandos para desenvolvimento e produção
- ✅ Instruções de verificação e rollback

## 🔄 Retrocompatibilidade

**IMPORTANTE**: O sistema mantém **100% de retrocompatibilidade**!

- ✅ URLs antigas com ID continuam funcionando
- ✅ Backend aceita ID ou slug em todas as rotas
- ✅ Links de notificações antigas (com ID) continuam válidos
- ✅ Busca por slug primeiro (performance), fallback para ID

## 📊 Fluxo de Dados

### Criação de Campanha

1. Usuário cria campanha com nome "Café CEBB - Outubro 2025"
2. Backend gera slug: `cafe-cebb-outubro-2025`
3. Salva no banco com ID e slug
4. Frontend recebe campanha com ambos
5. Link gerado: `/campaigns/cafe-cebb-outubro-2025`

### Atualização de Nome

1. Usuário muda nome para "Café CEBB - Novembro 2025"
2. Backend gera novo slug: `cafe-cebb-novembro-2025`
3. Atualiza no banco
4. Frontend detecta slug diferente e redireciona
5. Novo link: `/campaigns/cafe-cebb-novembro-2025`

### Acesso por URL

1. Usuário acessa `/campaigns/cafe-cebb-outubro-2025`
2. Frontend usa slug no `getBySlug()`
3. Backend busca por slug primeiro
4. Se não encontrar, tenta por ID (URLs antigas)
5. Retorna campanha encontrada

## 🚀 Como Aplicar a Migração

### Desenvolvimento

```bash
# 1. Entre no container
docker exec -it compra-coletiva-backend sh

# 2. Crie a migration
npx prisma migrate dev --name add_campaign_slug

# 3. Gere slugs para campanhas existentes
npx ts-node scripts/generate-campaign-slugs.ts

# 4. Saia do container
exit
```

### Produção

```bash
# 1. Aplique a migration
npx prisma migrate deploy

# 2. Gere slugs
npx ts-node scripts/generate-campaign-slugs.ts
```

## 🧪 Testes

### Verificar Implementação

1. ✅ Criar nova campanha → Deve gerar slug automaticamente
2. ✅ Acessar campanha por slug → Deve funcionar
3. ✅ Acessar campanha por ID antigo → Deve funcionar (retrocompat)
4. ✅ Atualizar nome da campanha → Slug deve atualizar
5. ✅ Campanha com nome duplicado → Slug deve ter sufixo (-1, -2, etc.)
6. ✅ Clonar campanha → Nova campanha deve ter slug único
7. ✅ Links em notificações → Devem continuar funcionando

### Casos de Teste

```
Nome: "Café CEBB - Outubro 2025" → Slug: "cafe-cebb-outubro-2025"
Nome: "Café CEBB - Outubro 2025" (duplicado) → Slug: "cafe-cebb-outubro-2025-1"
Nome: "Livros 📚 TOP!" → Slug: "livros-top"
Nome: "Promoção Relâmpago!!!" → Slug: "promocao-relampago"
```

## 📝 Benefícios

1. **SEO**: URLs amigáveis para motores de busca
2. **UX**: URLs legíveis e memoráveis
3. **Compartilhamento**: Links mais profissionais
4. **Identificação**: Fácil identificar campanha pela URL
5. **Performance**: Índice otimizado para busca por slug

## ⚠️ Notas Importantes

- **Unicidade**: Slugs são únicos - sistema adiciona sufixo se necessário
- **Imutabilidade**: Slug muda apenas se o nome da campanha mudar
- **Case-Sensitive**: Slugs são sempre lowercase
- **Caracteres**: Apenas letras, números e hífens
- **Acentos**: Removidos automaticamente (café → cafe)
- **Espaços**: Convertidos para hífens

## 📚 Arquivos Criados/Modificados

### Novos Arquivos
- `backend/src/utils/slugify.ts`
- `backend/scripts/generate-campaign-slugs.ts`
- `backend/SLUG_MIGRATION_GUIDE.md`
- `SLUG_IMPLEMENTATION_SUMMARY.md` (este arquivo)

### Arquivos Modificados
- `backend/prisma/schema.prisma`
- `backend/src/routes/campaigns.ts`
- `backend/src/middleware/authMiddleware.ts`
- `frontend/src/api/types.ts`
- `frontend/src/api/services/campaign.service.ts`
- `frontend/src/App.tsx`
- `frontend/src/pages/campaign-detail/useCampaignDetail.ts`
- `frontend/src/components/campaign/CampaignCard.tsx`

## ✨ Conclusão

A implementação de slugs está completa e pronta para uso! O sistema mantém total retrocompatibilidade enquanto oferece URLs modernas e amigáveis para novas campanhas.

Para aplicar as mudanças, siga o guia de migração em `backend/SLUG_MIGRATION_GUIDE.md`.

