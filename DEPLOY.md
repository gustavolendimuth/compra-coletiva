# Guia de Deploy - Compra Coletiva

Deploy do frontend Next.js (migrado do Vite) no **Railway**.

## 🚂 Railway (Recomendado)

Este projeto está **otimizado para Railway** com:
- ✅ Dockerfiles configurados (backend + frontend)
- ✅ railway.json para cada serviço
- ✅ Variáveis de ambiente via Railway references
- ✅ Deploy automático via Git
- ✅ PostgreSQL e Redis integrados

### Quick Start

```bash
# 1. Criar projeto no Railway
# https://railway.app → New Project → Deploy from GitHub

# 2. Adicionar serviços:
#    - Backend (detecta railway.json na raiz)
#    - Frontend (configurar Root Directory: frontend)
#    - PostgreSQL (Add Database → PostgreSQL)
#    - Redis (Add Database → Redis - opcional)

# 3. Configurar variáveis de ambiente (ver RAILWAY.md)

# 4. Deploy automático acontece via Git push
git push origin main
```

### Documentação Completa

📖 **[RAILWAY.md](RAILWAY.md)** - Guia completo com:
- Setup passo a passo
- Variáveis de ambiente
- Migrations
- Domínio custom
- Troubleshooting
- Custos

## 📦 Arquitetura

### Frontend (Next.js 14)
- **Build**: Multi-stage Docker (builder + runner)
- **Modo**: Standalone (otimizado)
- **Porta**: 3000
- **Tamanho**: ~150MB (otimizado)

### Backend (Express + Prisma)
- **Build**: Docker otimizado
- **Porta**: 3000
- **Banco**: PostgreSQL (Railway)
- **Cache**: Redis (Railway - opcional)

## ⚙️ Variáveis de Ambiente

### Frontend
```bash
NEXT_PUBLIC_API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_SITE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

### Backend
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
CORS_ORIGIN=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
JWT_SECRET=<gerar-com-openssl-rand>
```

## 🔍 SEO

Todas as otimizações de SEO estão implementadas:
- ✅ Sitemap dinâmico (/sitemap.xml)
- ✅ Robots.txt (/robots.txt)
- ✅ Structured data (JSON-LD)
- ✅ Metadata completa
- ✅ Mobile-first

📖 **[SEO.md](SEO.md)** - Documentação completa de SEO

## 🎯 Próximos Passos

1. ✅ Build está pronto para Railway
2. ⏳ Configurar variáveis de ambiente no Railway
3. ⏳ Deploy via Railway (push to main)
4. ⏳ Executar migrations
5. ⏳ Configurar domínio custom

## 🔧 Arquivos de Configuração

- [frontend/Dockerfile](frontend/Dockerfile) - Docker otimizado para Next.js
- [frontend/railway.json](frontend/railway.json) - Configuração Railway
- [frontend/.dockerignore](frontend/.dockerignore) - Otimização de build
- [backend/Dockerfile](backend/Dockerfile) - Docker backend
- [railway.json](railway.json) - Configuração backend Railway

---

**Status**: ✅ Pronto para deploy no Railway
**Última atualização**: 2026-01-26
