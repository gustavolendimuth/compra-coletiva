# Correção: Exibição de Imagens de Capa

## Problema

As imagens de capa das campanhas estavam sendo carregadas com sucesso no backend, mas não eram exibidas no frontend.

### Causa Raiz

O problema estava na construção da URL da imagem no frontend:

```typescript
// ❌ CÓDIGO ANTIGO (INCORRETO)
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// VITE_API_URL = 'localhost:3000' (sem protocolo)

const imageUrl = `${apiUrl.replace(/\/api$/, '')}${imageUrl}`;
// Resultado: 'localhost:3000/uploads/campaigns/image.jpg' ❌
// Falta o protocolo http:// ou https://
```

### Sintomas

- Upload de imagem funcionava (HTTP 200)
- Arquivo era salvo corretamente em `/app/uploads/campaigns/`
- Servidor Express servia o arquivo corretamente
- Frontend construía URL **sem protocolo**: `localhost:3000/uploads/...`
- Navegador não conseguia carregar a imagem (URL inválida)

## Solução

### 1. Criado Utilitário Centralizado

Arquivo: `frontend/src/lib/imageUrl.ts`

```typescript
import { API_URL } from '@/api';

/**
 * Build full image URL from backend response
 * Handles both S3 URLs and local storage paths
 */
export function getImageUrl(imageUrl?: string): string | null {
  if (!imageUrl) return null;
  
  // S3 URLs are already complete
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Local storage paths need API_URL prefix
  // API_URL already has the correct protocol (http:// or https://)
  return `${API_URL}${imageUrl}`;
}
```

**Vantagens:**
- ✅ Usa `API_URL` do `config.ts` que já processa o protocolo corretamente
- ✅ Centraliza a lógica em um único lugar
- ✅ Suporta tanto S3 quanto armazenamento local
- ✅ Código DRY (Don't Repeat Yourself)

### 2. Refatorados 3 Componentes

**Antes:**
- `CampaignHeader.tsx`: 7 linhas de código duplicado
- `CampaignCard.tsx`: 7 linhas de código duplicado
- `ImageUploadModal.tsx`: 7 linhas de código duplicado

**Depois:**
- Todos usam `getImageUrl()` do utilitário centralizado
- Total: 1 linha por componente

### 3. Adicionados Testes

Arquivo: `frontend/src/lib/__tests__/imageUrl.test.ts`

- 10 testes cobrindo todos os casos de uso
- ✅ Todos os testes passando

## Resultado

```typescript
// ✅ CÓDIGO NOVO (CORRETO)
import { API_URL } from '@/api';
// API_URL = 'http://localhost:3000' (com protocolo processado)

const imageUrl = `${API_URL}${imageUrl}`;
// Resultado: 'http://localhost:3000/uploads/campaigns/image.jpg' ✅
```

### Teste de Verificação

```bash
# URL antiga (INCORRETA)
localhost:3000/uploads/campaigns/image.jpg ❌

# URL nova (CORRETA)
http://localhost:3000/uploads/campaigns/image.jpg ✅
```

## Arquivos Modificados

1. ✅ `frontend/src/lib/imageUrl.ts` - **NOVO** - Utilitário centralizado
2. ✅ `frontend/src/lib/__tests__/imageUrl.test.ts` - **NOVO** - Testes
3. ✅ `frontend/src/pages/campaign-detail/CampaignHeader.tsx` - Refatorado
4. ✅ `frontend/src/components/campaign/CampaignCard.tsx` - Refatorado
5. ✅ `frontend/src/pages/campaign-detail/modals/ImageUploadModal.tsx` - Refatorado

## Benefícios

1. **Correção do Bug**: Imagens agora são exibidas corretamente
2. **Código Limpo**: Lógica centralizada em um único lugar
3. **Manutenibilidade**: Fácil de atualizar no futuro
4. **Testabilidade**: Testes unitários garantem funcionamento
5. **Consistência**: Todos os componentes usam a mesma lógica

## Como Testar

1. Acesse uma campanha com imagem
2. Verifique se a imagem aparece no card da lista
3. Verifique se a imagem aparece no header da página de detalhes
4. Faça upload de uma nova imagem
5. Verifique se a nova imagem é exibida imediatamente

## Notas Técnicas

### Fluxo de Upload

1. Frontend envia arquivo via `FormData`
2. Backend salva em `/app/uploads/campaigns/` (container)
3. Backend retorna `imageUrl: '/uploads/campaigns/filename.jpg'`
4. Frontend usa `getImageUrl()` para construir URL completa
5. Navegador carrega imagem via `http://localhost:3000/uploads/campaigns/filename.jpg`

### Configuração do Servidor

```typescript
// backend/src/index.ts
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
```

O Express serve arquivos estáticos da pasta `uploads/` na rota `/uploads`.

### Variável de Ambiente

```bash
# frontend/.env
VITE_API_URL=localhost:3000  # Sem protocolo (processado automaticamente)
```

A função `processEnvUrl()` em `api/config.ts` adiciona o protocolo correto:
- Local (localhost, 127.0.0.1): `http://`
- Remoto em produção: `https://`
- Remoto em desenvolvimento: `http://`

## Data da Correção

8 de dezembro de 2025
