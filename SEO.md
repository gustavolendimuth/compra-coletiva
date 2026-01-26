# Guia de SEO - Compra Coletiva

Este documento descreve todas as otimizações de SEO implementadas no projeto e como o Google irá indexar o site.

## ✅ Implementações Atuais

### 1. **Sitemap Dinâmico** ([sitemap.ts](frontend/src/app/sitemap.ts))

**Status**: ✅ Implementado e otimizado

**Como funciona**:
- Geração dinâmica (renderizado no servidor)
- Revalidação a cada 15 minutos (900s)
- Inclui até 500 campanhas ativas e recentes
- Timeout de 5s para evitar bloqueios

**Prioridades**:
- Homepage: 1.0 (máxima)
- Lista de campanhas: 0.9
- Campanhas ativas: 0.8-0.9 (boost se atualizadas nos últimos 7 dias)
- Campanhas fechadas: 0.6
- Páginas legais: 0.3

**Frequência de atualização**:
- Homepage: daily
- Lista de campanhas: hourly
- Campanhas ativas: daily
- Campanhas fechadas: weekly
- Páginas legais: yearly

**Benefícios para SEO**:
- ✅ Google descobre novas campanhas em até 15 minutos
- ✅ Prioriza conteúdo mais importante
- ✅ Informa frequência de atualização ao Google
- ✅ Escala até 500 campanhas por sitemap

### 2. **Robots.txt** ([robots.ts](frontend/src/app/robots.ts))

**Status**: ✅ Implementado

**Configuração**:
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /perfil/
Disallow: /api/
Disallow: /auth/
Sitemap: https://compracoletiva.app/sitemap.xml
```

**Benefícios**:
- ✅ Bloqueia áreas privadas (admin, perfil, API)
- ✅ Informa ao Google onde está o sitemap
- ✅ Permite indexação de todo conteúdo público

### 3. **Structured Data (JSON-LD)**

#### 3.1. **Dados Globais** ([layout.tsx](frontend/src/app/layout.tsx))

**Organization Schema**:
```json
{
  "@type": "Organization",
  "name": "Compra Coletiva",
  "url": "https://compracoletiva.app",
  "description": "Plataforma para organizar compras coletivas...",
  "logo": "https://compracoletiva.app/logo.png"
}
```

**WebSite Schema com SearchAction**:
```json
{
  "@type": "WebSite",
  "name": "Compra Coletiva",
  "url": "https://compracoletiva.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://compracoletiva.app/campanhas?q={search_term}",
    "query-input": "required name=search_term"
  }
}
```

**Benefícios**:
- ✅ Google entende que é uma organização
- ✅ Habilita busca direta nos resultados do Google (sitelinks search box)
- ✅ Melhora a apresentação nos resultados de busca

#### 3.2. **Dados por Página de Campanha** ([campanhas/[slug]/page.tsx](frontend/src/app/(main)/campanhas/[slug]/page.tsx))

**Product Schema**:
```json
{
  "@type": "Product",
  "name": "Nome da Campanha",
  "description": "Descrição da campanha",
  "image": "URL da imagem",
  "url": "https://compracoletiva.app/campanhas/slug",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "BRL",
    "offerCount": 15,
    "availability": "InStock"
  },
  "seller": {
    "@type": "Person",
    "name": "Nome do Organizador"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": 10
  }
}
```

**Breadcrumb Schema**:
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Home", "item": "..." },
    { "position": 2, "name": "Campanhas", "item": "..." },
    { "position": 3, "name": "Nome da Campanha", "item": "..." }
  ]
}
```

**Benefícios**:
- ✅ Google exibe rich snippets com preços e disponibilidade
- ✅ Mostra breadcrumbs nos resultados de busca
- ✅ Melhora CTR (taxa de cliques)
- ✅ Possibilita aparecer em Google Shopping

### 4. **Metadata Completa**

#### 4.1. **Metadata Global** ([layout.tsx](frontend/src/app/layout.tsx))

- **Title template**: "Página | Compra Coletiva"
- **Description**: Descrição completa da plataforma
- **Keywords**: compra coletiva, compras em grupo, etc.
- **Open Graph**: Imagens 1200x630, locale pt_BR
- **Twitter Cards**: summary_large_image
- **Robots**: index=true, follow=true, max-snippet=-1

#### 4.2. **Metadata Dinâmica por Campanha**

Cada campanha gera metadata específica:
- Title personalizado
- Description com contexto da campanha
- Imagens específicas (ou fallback para og-image.png)
- Canonical URL
- Open Graph e Twitter Cards personalizados

**Benefícios**:
- ✅ Cada página tem título e descrição únicos
- ✅ Compartilhamento social otimizado
- ✅ Imagens corretas no WhatsApp, Facebook, Twitter
- ✅ Google entende o conteúdo de cada página

### 5. **Componente Reutilizável** ([StructuredData.tsx](frontend/src/components/seo/StructuredData.tsx))

Componente para adicionar structured data facilmente:

```tsx
// Uso básico
<StructuredData type="organization" data={{
  name: "Compra Coletiva",
  url: "https://compracoletiva.app"
}} />

// Breadcrumb
<StructuredData type="breadcrumb" data={{
  itemListElement: [...]
}} />

// Dados customizados
<StructuredData type="custom" data={{ ... }} />
```

## 📊 Como o Google Indexa o Site

### 1. **Descoberta**
1. Google acessa `/robots.txt`
2. Encontra referência ao `/sitemap.xml`
3. Acessa o sitemap e descobre todas as URLs
4. Prioriza URLs com maior prioridade e frequência de atualização

### 2. **Rastreamento**
1. Google visita cada URL do sitemap
2. Renderiza JavaScript (Next.js SSR)
3. Lê os dados estruturados (JSON-LD)
4. Analisa metadata (title, description, Open Graph)
5. Indexa o conteúdo

### 3. **Indexação**
- **Homepage**: Indexada como página principal
- **Lista de Campanhas**: Indexada como página de listagem
- **Campanhas Individuais**: Indexadas como produtos com rich snippets
- **Páginas Legais**: Indexadas com baixa prioridade

### 4. **Apresentação nos Resultados**

#### Homepage e Lista:
```
Compra Coletiva - Organize suas compras em grupo
https://compracoletiva.app
Plataforma para organizar compras coletivas de forma simples...
```

#### Campanhas (com rich snippet):
```
Nome da Campanha | Compra Coletiva
https://compracoletiva.app/campanhas/slug
★★★★☆ (10 avaliações)
Home > Campanhas > Nome da Campanha
R$ 29,90 - 15 produtos disponíveis - Em estoque
Descrição da campanha...
```

## 🚀 Próximas Melhorias (Opcional)

### 1. **Sitemap Index** (Se crescer muito)
Quando passar de 500 campanhas, dividir em múltiplos sitemaps:
- `/sitemap-index.xml` (principal)
- `/sitemap-campaigns-1.xml` (campanhas 1-500)
- `/sitemap-campaigns-2.xml` (campanhas 501-1000)
- `/sitemap-static.xml` (páginas estáticas)

### 2. **Imagens no Sitemap**
Adicionar informações de imagens:
```typescript
{
  url: '...',
  images: [
    {
      url: 'https://compracoletiva.app/campaigns/image.jpg',
      title: 'Nome da Campanha',
      caption: 'Descrição'
    }
  ]
}
```

### 3. **Review Schema**
Adicionar avaliações reais de usuários:
```json
{
  "@type": "Review",
  "author": { "@type": "Person", "name": "João Silva" },
  "reviewRating": { "@type": "Rating", "ratingValue": "5" },
  "reviewBody": "Ótima experiência..."
}
```

### 4. **FAQ Schema**
Para páginas com perguntas frequentes:
```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Como funciona a compra coletiva?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "..."
      }
    }
  ]
}
```

### 5. **Video Schema**
Se adicionar vídeos tutoriais:
```json
{
  "@type": "VideoObject",
  "name": "Como criar uma campanha",
  "description": "...",
  "thumbnailUrl": "...",
  "uploadDate": "2026-01-26"
}
```

## 🔍 Ferramentas para Validar SEO

### 1. **Google Search Console**
- URL: https://search.google.com/search-console
- Submeter sitemap: `https://compracoletiva.app/sitemap.xml`
- Monitorar indexação e erros
- Ver queries e impressões

### 2. **Google Rich Results Test**
- URL: https://search.google.com/test/rich-results
- Testar structured data de cada página
- Verificar se rich snippets aparecem corretamente

### 3. **Schema.org Validator**
- URL: https://validator.schema.org/
- Validar JSON-LD
- Verificar erros e warnings

### 4. **Lighthouse (Chrome DevTools)**
- Auditar performance e SEO
- Score ideal: 90+ em SEO
- Verificar mobile-friendliness

### 5. **XML Sitemap Validator**
- URL: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- Validar estrutura do sitemap
- Verificar se todas URLs são acessíveis

## 📝 Checklist de SEO

### Implementado ✅
- [x] Sitemap dinâmico com revalidação
- [x] Robots.txt configurado
- [x] Structured data (Organization, WebSite, Product, Breadcrumb)
- [x] Metadata completa (title, description, Open Graph, Twitter)
- [x] URLs canônicas
- [x] Lang="pt-BR" no HTML
- [x] Mobile-first responsive design
- [x] Semantic HTML
- [x] Prioridades e frequências de atualização

### A Fazer (quando relevante)
- [ ] Submeter sitemap no Google Search Console
- [ ] Adicionar Google Analytics
- [ ] Configurar Google Tag Manager
- [ ] Adicionar avaliações de usuários (review schema)
- [ ] Criar página de FAQ com FAQ schema
- [ ] Adicionar imagens ao sitemap
- [ ] Implementar sitemap index (quando >500 campanhas)
- [ ] Otimizar Core Web Vitals (LCP, FID, CLS)

## 🎯 Resultado Esperado

Com todas as otimizações implementadas, o site deve:

1. ✅ **Ser indexado rapidamente** pelo Google (1-7 dias)
2. ✅ **Aparecer com rich snippets** (preços, avaliações, breadcrumbs)
3. ✅ **Ter boa posição** em buscas relacionadas
4. ✅ **Ter CTR alto** devido aos rich snippets
5. ✅ **Ser mobile-friendly** (requisito do Google)
6. ✅ **Ter boa performance** (Core Web Vitals)

## 📚 Referências

- [Google Search Central - Sitemaps](https://developers.google.com/search/docs/advanced/sitemaps/overview)
- [Schema.org Documentation](https://schema.org/)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Structured Data Guidelines](https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data)
