# Features e integrações

Resumo técnico das principais integrações e comportamentos de produto.

## SEO
- Sitemap dinâmico e robots.txt.
- Metadata completa com Open Graph e Twitter Cards.
- JSON-LD para Organization, WebSite, Product e Breadcrumb.
- Metadata específica por campanha com URL canônica.

## Imagens de campanhas
- Endpoint: `POST /api/campaigns/:idOrSlug/image` e `DELETE /api/campaigns/:idOrSlug/image`.
- Formatos aceitos: JPEG, PNG, WebP.
- Tamanho máximo: 5MB.
- Storage: S3 quando configurado, fallback local em `uploads/`.
- Campos persistidos: `imageUrl`, `imageKey`, `imageStorageType`.

## Email
- Providers: `resend`, `gmail` ou `auto` (fallback).
- Envio assíncrono via Redis.
- Variáveis comuns:
```env
EMAIL_ENABLED=true
EMAIL_PROVIDER=auto
EMAIL_FROM_ADDRESS=...
EMAIL_FROM_NAME=Compra Coletiva
RESEND_API_KEY=...
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
```
- Gmail usa o email da conta como remetente. Resend permite domínio customizado.
