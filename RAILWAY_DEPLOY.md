# Guia de Deploy no Railway

Este guia explica como fazer o deploy do projeto no Railway com serviços separados para backend e frontend.

## Arquitetura

O projeto está configurado com **4 serviços separados** no Railway:

1. **PostgreSQL** - Banco de dados principal
2. **Redis** - Fila de emails (BullMQ)
3. **Backend** - API Express + Prisma (executa migrations automaticamente)
4. **Frontend** - SPA React servido com nginx (SEM Prisma)

## Configuração Inicial

### 1. Criar Projeto no Railway

1. Acesse [Railway](https://railway.app)
2. Crie um novo projeto
3. Adicione os seguintes serviços:
   - PostgreSQL (use o template oficial do Railway)
   - Redis (use o template oficial do Railway)
   - Backend (conecte ao seu repositório GitHub)
   - Frontend (conecte ao mesmo repositório GitHub)

### 2. Configurar PostgreSQL

O serviço PostgreSQL é criado automaticamente pelo Railway e não requer configuração adicional.

### 3. Configurar Redis

#### 🚨 CRÍTICO: Erro "NOAUTH Authentication required"

Se você está recebendo este erro, é porque o Redis do Railway vem com autenticação habilitada por padrão.

#### Solução: Conectar Redis ao Backend

1. No Railway Dashboard, clique em **"+ New"** → **"Database"** → **"Add Redis"**
2. Após criar o serviço Redis, clique no serviço **Backend**
3. Vá em **Settings** → **Service Variables**
4. Procure por **"Add Variable"** ou **"Add Reference"**
5. Selecione o serviço **Redis** e adicione a variável `REDIS_URL`
6. O Railway criará automaticamente a referência: `${{Redis.REDIS_URL}}`

**Formato da URL**: O Railway gera automaticamente no formato:

```bash
redis://default:senha_gerada_automaticamente@redis.railway.internal:6379
```

**Importante**: NÃO adicione `REDIS_HOST`, `REDIS_PORT` ou `REDIS_PASSWORD` separadamente se estiver usando `REDIS_URL`. O código prioriza `REDIS_URL` sobre as variáveis individuais.

### 4. Configurar Backend

#### Root Directory
No Railway Dashboard → Backend Service → Settings → Source:
- **Root Directory**: `backend`

#### Variáveis de Ambiente
No Railway Dashboard → Backend Service → Variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
CORS_ORIGIN=https://seu-frontend.up.railway.app
UPLOAD_DIR=/tmp/uploads

# Authentication (CRÍTICO - gere secrets fortes!)
JWT_ACCESS_SECRET=<use: openssl rand -base64 32>
JWT_REFRESH_SECRET=<use: openssl rand -base64 32>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=365d

# Google OAuth
GOOGLE_CLIENT_ID=<seu-client-id.apps.googleusercontent.com>
GOOGLE_CLIENT_SECRET=<seu-client-secret>
GOOGLE_CALLBACK_URL=https://seu-backend.up.railway.app/api/auth/google/callback
FRONTEND_URL=https://seu-frontend.up.railway.app

# Email Configuration
EMAIL_ENABLED=true
EMAIL_PROVIDER=resend
EMAIL_FROM_ADDRESS=noreply@seudominio.com
EMAIL_FROM_NAME="Compra Coletiva"

# Resend (Produção - Recomendado)
RESEND_API_KEY=<re_sua_api_key>

# OU Gmail (Alternativa)
# EMAIL_PROVIDER=gmail
# GMAIL_USER=<seu-email@gmail.com>
# GMAIL_APP_PASSWORD=<senha-app-16-chars>

# Email Worker
ENABLE_EMAIL_WORKER=true
EMAIL_QUEUE_MAX_ATTEMPTS=3
EMAIL_QUEUE_RETRY_DELAY=5000
EMAIL_QUEUE_RATE_LIMIT=10
```

**Importante:**
- `DATABASE_URL`: Use a referência `${{Postgres.DATABASE_URL}}` para conectar automaticamente ao banco
- `REDIS_URL`: Use a referência `${{Redis.REDIS_URL}}` para conectar automaticamente ao Redis
- `CORS_ORIGIN`: Substitua pela URL do seu frontend no Railway (você pode atualizar depois)
- `JWT_*_SECRET`: **CRÍTICO** - Gere secrets únicos e fortes usando `openssl rand -base64 32`
- `GOOGLE_*`: Configure no [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- `RESEND_API_KEY`: Crie conta em [Resend](https://resend.com) e obtenha API key

**Para referências completas**, veja [backend/.env.railway](backend/.env.railway)

#### Deployment
O backend usa:
- [railway.json](railway.json) na raiz (compartilhado com frontend)
- [backend/Dockerfile](backend/Dockerfile) que:
  - Faz build da aplicação TypeScript
  - Executa [backend/start.sh](backend/start.sh) que:
    - Roda `npx prisma migrate deploy` automaticamente
    - Gera slugs para campanhas existentes (se necessário)
  - Inicia o servidor com `node dist/index.js`

### 4. Configurar Frontend

#### Root Directory
No Railway Dashboard → Frontend Service → Settings → Source:
- **Root Directory**: `frontend`

#### Variáveis de Ambiente
No Railway Dashboard → Frontend Service → Variables:

```env
NEXT_PUBLIC_API_URL=https://seu-backend.up.railway.app
```

**Importante:**
- `NEXT_PUBLIC_API_URL`: Substitua pela URL do seu backend no Railway

#### Deployment
O frontend usa:
- [railway.json](railway.json) na raiz (compartilhado com backend)
- [frontend/Dockerfile](frontend/Dockerfile) que:
  - Faz build da aplicação React
  - Serve os arquivos estáticos com nginx
  - Usa [frontend/nginx.conf](frontend/nginx.conf) para suporte a React Router
  - **NÃO executa migrations do Prisma**

### 5. Conectar Serviços

No Railway Dashboard:

1. Vá até o serviço **Backend**
2. Na aba **Settings** → **Service Variables**
3. Certifique-se de que o PostgreSQL está linkado (deve aparecer uma referência)

## Ordem de Deploy

1. **PostgreSQL** - Deploy automático (já vem configurado)
2. **Backend** - Deploy e execução das migrations
3. **Frontend** - Deploy após confirmar que o backend está funcionando

## Atualizando URLs

Após o primeiro deploy, você terá as URLs dos serviços:
- Backend: `https://backend-xxxxx.up.railway.app`
- Frontend: `https://frontend-xxxxx.up.railway.app`

**Atualize as variáveis:**

1. No **Backend**, atualize `CORS_ORIGIN` com a URL do frontend
2. No **Frontend**, atualize `NEXT_PUBLIC_API_URL` com a URL do backend
3. Faça redeploy de ambos os serviços

## Verificação

### Backend
Acesse `https://seu-backend.up.railway.app/health` (se houver uma rota de health check)

### Frontend
Acesse `https://seu-frontend.up.railway.app`

## Troubleshooting

### 🚨 Erro: "NOAUTH Authentication required" (Redis)

**Causa**: Redis do Railway requer autenticação, mas aplicação não está fornecendo credenciais.

**Solução**:

1. Verifique se `REDIS_URL` existe nas variáveis do backend:
   - Dashboard → Backend Service → Variables
   - Deve haver `REDIS_URL=${{Redis.REDIS_URL}}`
2. Se não existir, adicione a referência ao serviço Redis:
   - Variables → "Add Variable" → Selecione serviço Redis → `REDIS_URL`
3. Certifique-se de que o serviço Redis está rodando e conectado
4. Faça redeploy do backend
5. Verifique logs: deve aparecer `[EmailQueue] Queue initialized successfully`

**Verificação**:

```bash
# No Railway CLI, teste conexão Redis
railway run --service backend node -e "const redis = require('ioredis'); const client = new redis(process.env.REDIS_URL); client.ping().then(console.log).catch(console.error);"
```

### Backend: Erro de conexão com o banco

- Verifique se `DATABASE_URL` está configurada corretamente
- Certifique-se de que o serviço PostgreSQL está rodando
- Verifique se o backend está linkado ao PostgreSQL

### Frontend: Erro ao chamar API

- Verifique se `NEXT_PUBLIC_API_URL` aponta para a URL correta do backend
- Verifique se `CORS_ORIGIN` no backend permite a origem do frontend
- Abra o DevTools do navegador para ver erros de CORS

### Emails não estão sendo enviados

**Causa**: Worker de email não está rodando ou provider mal configurado.

**Soluções**:

1. Verifique logs do backend para confirmar: `[EmailWorker] Worker started successfully`
2. Confirme variáveis:
   - `ENABLE_EMAIL_WORKER=true`
   - `EMAIL_ENABLED=true`
   - `REDIS_URL` configurada corretamente
3. Verifique provider (Resend ou Gmail):
   - **Resend**: `RESEND_API_KEY` válida
   - **Gmail**: `GMAIL_USER` e `GMAIL_APP_PASSWORD` válidos
4. Verifique logs de erro: `[EmailWorker] Job failed:`

### Migrations não executadas

- As migrations são executadas apenas no **backend**
- Verifique os logs do backend no Railway
- Se necessário, execute manualmente: acesse o backend no Railway CLI

### Slugs não gerados

- Os slugs são gerados automaticamente após as migrations
- Se necessário, execute manualmente via Railway CLI:

  ```bash
  railway run --service backend npx tsx scripts/generate-slugs-standalone.ts
  ```

## Estrutura de Arquivos

```
compra-coletiva/
├── railway.json (configuração Railway - compartilhada)
├── Dockerfile (monolítico - serve backend + frontend em um único serviço)
├── backend/
│   ├── Dockerfile (produção - serviço separado com migrations via start.sh)
│   ├── Dockerfile.dev (desenvolvimento)
│   ├── start.sh (script que roda migrations + inicia servidor)
│   └── .env.example
└── frontend/
    ├── Dockerfile (produção - serviço separado com nginx)
    ├── Dockerfile.dev (desenvolvimento)
    ├── nginx.conf (configuração nginx)
    └── .env.example
```

## Importante sobre Dockerfiles

- **backend/Dockerfile** e **frontend/Dockerfile**: Usam `npm install` (não requerem package-lock.json)
- **Dockerfile na raiz**: Para deploy monolítico (backend serve o frontend), usa `npm install`

## Comandos Úteis

### Acessar logs
```bash
# Via Railway CLI
railway logs --service backend
railway logs --service frontend
```

### Executar migrations manualmente
```bash
# Via Railway CLI
railway run --service backend npx prisma migrate deploy
```

## Notas Importantes

1. **Migrations**: Apenas o backend executa migrations - o frontend nunca deve executar comandos Prisma
2. **Variáveis de Ambiente**: Variáveis `NEXT_PUBLIC_*` são incorporadas no build do frontend - sempre faça redeploy após alterá-las
3. **CORS**: Certifique-se de que o backend permite requisições da origem do frontend
4. **Nginx**: O frontend usa nginx para servir a SPA com suporte a client-side routing
