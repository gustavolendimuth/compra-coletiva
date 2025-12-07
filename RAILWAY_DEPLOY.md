# Guia de Deploy no Railway

Este guia explica como fazer o deploy do projeto no Railway com serviços separados para backend e frontend.

## Arquitetura

O projeto está configurado com **3 serviços separados** no Railway:

1. **PostgreSQL** - Banco de dados
2. **Backend** - API Express + Prisma (executa migrations automaticamente)
3. **Frontend** - SPA React servido com nginx (SEM Prisma)

## Configuração Inicial

### 1. Criar Projeto no Railway

1. Acesse [Railway](https://railway.app)
2. Crie um novo projeto
3. Adicione os seguintes serviços:
   - PostgreSQL (use o template oficial do Railway)
   - Backend (conecte ao seu repositório GitHub)
   - Frontend (conecte ao mesmo repositório GitHub)

### 2. Configurar PostgreSQL

O serviço PostgreSQL é criado automaticamente pelo Railway e não requer configuração adicional.

### 3. Configurar Backend

#### Root Directory
No Railway Dashboard → Backend Service → Settings → Source:
- **Root Directory**: `backend`

#### Variáveis de Ambiente
No Railway Dashboard → Backend Service → Variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGIN=https://seu-frontend.up.railway.app
```

**Importante:**
- `DATABASE_URL`: Use a referência `${{Postgres.DATABASE_URL}}` para conectar automaticamente ao banco
- `CORS_ORIGIN`: Substitua pela URL do seu frontend no Railway (você pode atualizar depois)

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
VITE_API_URL=https://seu-backend.up.railway.app
```

**Importante:**
- `VITE_API_URL`: Substitua pela URL do seu backend no Railway

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
2. No **Frontend**, atualize `VITE_API_URL` com a URL do backend
3. Faça redeploy de ambos os serviços

## Verificação

### Backend
Acesse `https://seu-backend.up.railway.app/health` (se houver uma rota de health check)

### Frontend
Acesse `https://seu-frontend.up.railway.app`

## Troubleshooting

### Backend: Erro de conexão com o banco
- Verifique se `DATABASE_URL` está configurada corretamente
- Certifique-se de que o serviço PostgreSQL está rodando
- Verifique se o backend está linkado ao PostgreSQL

### Frontend: Erro ao chamar API
- Verifique se `VITE_API_URL` aponta para a URL correta do backend
- Verifique se `CORS_ORIGIN` no backend permite a origem do frontend
- Abra o DevTools do navegador para ver erros de CORS

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
2. **Variáveis de Ambiente**: Variáveis `VITE_*` são incorporadas no build do frontend - sempre faça redeploy após alterá-las
3. **CORS**: Certifique-se de que o backend permite requisições da origem do frontend
4. **Nginx**: O frontend usa nginx para servir a SPA com suporte a client-side routing
