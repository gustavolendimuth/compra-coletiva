# Deploy no Railway - Compra Coletiva

Guia completo para deploy do projeto no Railway.

## 🚂 Sobre o Railway

Railway é uma plataforma de deploy moderna que:
- ✅ Detecta Dockerfile automaticamente
- ✅ Gerencia variáveis de ambiente facilmente
- ✅ Oferece PostgreSQL, Redis e outros serviços
- ✅ Deploy automático via Git (CI/CD integrado)
- ✅ SSL/HTTPS automático
- ✅ Preços competitivos (pay-as-you-go)

## 📦 Estrutura do Projeto

Este é um monorepo com 2 serviços:

```
compra-coletiva/
├── backend/          → API Express (Porta 3000)
│   ├── Dockerfile
│   └── railway.json  ❌ (não existe - Railway detecta via root)
├── frontend/         → Next.js 14 (Porta 3000)
│   ├── Dockerfile
│   └── railway.json  ✅ (criado)
└── railway.json      ✅ (configuração do backend)
```

## 🚀 Deploy Inicial

### 1. Criar Conta no Railway

1. Acesse https://railway.app
2. Faça login com GitHub
3. Conecte o repositório

### 2. Criar Serviços

Railway detecta automaticamente que é um monorepo e perguntará qual serviço você quer deployar.

#### Serviço 1: Backend (API)

1. **New Project** → **Deploy from GitHub repo**
2. Selecione o repositório `compra-coletiva`
3. Clique em **Add Service** → **GitHub Repo**
4. Railway detectará o `railway.json` na raiz (backend)
5. Configure as variáveis de ambiente (ver abaixo)

#### Serviço 2: Frontend (Next.js)

1. No mesmo projeto, clique em **New** → **GitHub Repo**
2. Selecione o mesmo repositório
3. Vá em **Settings** → **Build**
4. Configure:
   - **Root Directory**: `frontend`
   - **Builder**: DOCKERFILE
   - **Dockerfile Path**: `Dockerfile`

#### Serviço 3: PostgreSQL

1. Clique em **New** → **Database** → **Add PostgreSQL**
2. Railway cria automaticamente e fornece `DATABASE_URL`
3. Conecte ao serviço backend

#### Serviço 4: Redis (Opcional - para email queue)

1. Clique em **New** → **Database** → **Add Redis**
2. Railway cria automaticamente e fornece `REDIS_URL`
3. Conecte ao serviço backend

## ⚙️ Variáveis de Ambiente

### Backend

Configure no Railway Dashboard → Backend Service → Variables:

```bash
# Banco de Dados (Railway gera automaticamente quando conectar PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Servidor
PORT=3000
NODE_ENV=production

# CORS - Use o domínio do frontend Railway
CORS_ORIGIN=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}
# Ou domínio custom:
# CORS_ORIGIN=https://compracoletiva.app

# JWT
JWT_SECRET=<gerar-secret-forte-aqui>
# Gerar com: openssl rand -base64 32

# Email (Resend ou Gmail)
RESEND_API_KEY=<seu-resend-api-key>
EMAIL_FROM=noreply@seudominio.com
EMAIL_PROVIDER=resend
# Ou Gmail:
# GMAIL_USER=seu-email@gmail.com
# GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
# EMAIL_PROVIDER=gmail

# Redis (Railway gera automaticamente quando conectar Redis)
REDIS_URL=${{Redis.REDIS_URL}}

# Google OAuth (Opcional)
GOOGLE_CLIENT_ID=<seu-google-client-id>
GOOGLE_CLIENT_SECRET=<seu-google-client-secret>
GOOGLE_CALLBACK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/api/auth/google/callback
```

### Frontend

Configure no Railway Dashboard → Frontend Service → Variables:

```bash
# API Backend - Railway reference
NEXT_PUBLIC_API_URL=https://${{Backend.RAILWAY_PUBLIC_DOMAIN}}
# Ou domínio custom:
# NEXT_PUBLIC_API_URL=https://api.compracoletiva.app

# Site URL
NEXT_PUBLIC_SITE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
# Ou domínio custom:
# NEXT_PUBLIC_SITE_URL=https://compracoletiva.app

# Node
NODE_ENV=production
```

## 🔧 Configurações Específicas do Railway

### Build Args

Railway passa automaticamente as variáveis de ambiente como build args para o Dockerfile.

Isso significa que `ARG NEXT_PUBLIC_API_URL` no Dockerfile receberá o valor de `NEXT_PUBLIC_API_URL` das variáveis de ambiente do Railway.

### Porta Automática

Railway define automaticamente `$PORT` baseado no `EXPOSE` do Dockerfile (3000).

### Health Check

Railway faz health check automático na rota raiz (`/`). Se sua aplicação não responder em `/`, configure em `railway.json`:

```json
{
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100
  }
}
```

### Restart Policy

Configurado em `railway.json`:
- `ON_FAILURE`: Reinicia apenas se crashar
- `restartPolicyMaxRetries: 10`: Tenta até 10 vezes

## 📊 Após o Deploy

### 1. Verificar Logs

```
Railway Dashboard → Service → Deployments → View Logs
```

### 2. Testar Endpoints

**Backend**:
```bash
curl https://seu-backend.railway.app/api/health
```

**Frontend**:
```bash
curl https://seu-frontend.railway.app
```

### 3. Executar Migrations

Railway não executa migrations automaticamente. Você precisa:

**Opção 1: Via Railway CLI**
```bash
# Instalar CLI
npm i -g @railway/cli

# Login
railway login

# Conectar ao projeto
railway link

# Executar migrations no serviço backend
railway run --service backend npx prisma migrate deploy
```

**Opção 2: Via Deploy Hook** (Recomendado)

Adicione um script no `package.json` do backend:
```json
{
  "scripts": {
    "deploy": "npx prisma migrate deploy && npm start"
  }
}
```

Depois, no Railway Dashboard → Backend → Settings → Deploy:
- **Start Command**: `npm run deploy`

### 4. Popular Banco (Seed)

```bash
railway run --service backend npm run seed
```

## 🌐 Domínio Customizado

### 1. Adicionar Domínio

1. Railway Dashboard → Service → Settings → Networking
2. Clique em **Add Custom Domain**
3. Digite seu domínio: `compracoletiva.app`
4. Railway fornecerá registros DNS

### 2. Configurar DNS

No seu provedor de DNS (Cloudflare, GoDaddy, etc.):

```
Type: CNAME
Name: @
Value: <fornecido-pelo-railway>.railway.app
```

Para subdomínio (API):
```
Type: CNAME
Name: api
Value: <fornecido-pelo-railway>.railway.app
```

### 3. SSL Automático

Railway provisiona certificado SSL automaticamente (Let's Encrypt).

## 🔄 Deploy Contínuo

Railway faz deploy automático quando você faz push para o branch configurado:

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

Railway detecta as mudanças e:
1. Faz rebuild da imagem Docker
2. Executa health check
3. Faz rollout gradual (zero downtime)

### Configurar Branch

Railway Dashboard → Service → Settings → Deploy:
- **Production Branch**: `main`
- **Watch Paths**: `frontend/**` (para frontend) ou `backend/**` (para backend)

## 📈 Monitoramento

### Métricas do Railway

Railway Dashboard → Service → Metrics mostra:
- CPU Usage
- Memory Usage
- Network Traffic
- Request Count
- Response Time

### Logs

```bash
# Via CLI
railway logs --service backend

# Via Dashboard
Railway → Service → Deployments → View Logs
```

### Alertas

Configure no Railway Dashboard → Project → Settings → Notifications:
- Slack
- Discord
- Webhook

## 💰 Custos

Railway cobra por:
- **Compute**: $0.000463 por GB-s de RAM
- **Network**: $0.10 por GB (egress)
- **Disk**: $0.25 por GB/mês

**Exemplo para este projeto**:
- Frontend (512MB RAM, 24/7): ~$7/mês
- Backend (512MB RAM, 24/7): ~$7/mês
- PostgreSQL (256MB RAM): ~$3.5/mês
- Redis (256MB RAM): ~$3.5/mês
- **Total**: ~$21/mês

**Free Tier**: $5 de crédito/mês (suficiente para desenvolvimento)

## 🛠️ Troubleshooting

### Build Falha

**Problema**: "Module not found" durante build

**Solução**: Verifique que `tsconfig.json` está na raiz do frontend e path aliases estão corretos.

### Container Crashando

**Problema**: Railway mostra "Unhealthy"

**Solução**:
1. Verifique logs: `railway logs`
2. Verifique variáveis de ambiente
3. Teste build local: `docker build -t test .`

### Migrations Não Executadas

**Problema**: Tabelas não existem no banco

**Solução**: Execute migrations manualmente:
```bash
railway run --service backend npx prisma migrate deploy
```

### CORS Error

**Problema**: Frontend não consegue chamar API

**Solução**: Configure `CORS_ORIGIN` no backend com URL do frontend Railway.

### Site Lento

**Problema**: Tempo de resposta alto

**Solução**:
1. Aumente RAM: Railway → Service → Settings → Resources
2. Ative Railway CDN (se disponível)
3. Otimize queries do banco (adicionar índices)

## 📚 Recursos

- [Railway Docs](https://docs.railway.app/)
- [Railway CLI](https://docs.railway.app/develop/cli)
- [Railway Templates](https://railway.app/templates)
- [Railway Discord](https://discord.gg/railway)

## ✅ Checklist de Deploy

- [ ] Criar conta no Railway
- [ ] Conectar repositório GitHub
- [ ] Criar serviço Backend
- [ ] Criar serviço Frontend
- [ ] Criar PostgreSQL
- [ ] Criar Redis (opcional)
- [ ] Configurar variáveis de ambiente (backend)
- [ ] Configurar variáveis de ambiente (frontend)
- [ ] Executar migrations
- [ ] Testar endpoints
- [ ] Configurar domínio custom (opcional)
- [ ] Configurar monitoramento
- [ ] Verificar custos estimados

---

**Última atualização**: 2026-01-26
**Status**: ✅ Otimizado para Railway
