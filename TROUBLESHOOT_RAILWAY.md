# Troubleshooting Railway - Erro CORS e 502

## 🚨 Problema Atual

```
Requisição cross-origin bloqueada: A diretiva Same Origin (mesma origem) 
não permite a leitura do recurso remoto em 
https://backend-production-80f6.up.railway.app/api/campaigns?limit=12 
(motivo: falta cabeçalho 'Access-Control-Allow-Origin' no CORS). 
Código de status: 502.
```

**Dois problemas identificados:**
1. ❌ **Erro 502** - Backend não está respondendo corretamente
2. ❌ **Erro CORS** - Quando responde, está bloqueando requisições

## 🔧 Soluções

### Passo 1: Verificar se o Backend está Online

1. Acesse no navegador:
   ```
   https://backend-production-80f6.up.railway.app/health
   ```

2. **Se retornar 502 ou erro:**
   - Backend não está rodando corretamente
   - Vá para o **Railway Dashboard** → **Backend Service** → **Logs**
   - Procure por erros de inicialização

### Passo 2: Verificar Variáveis de Ambiente do Backend

No **Railway Dashboard** → **Backend Service** → **Variables**:

#### Variáveis OBRIGATÓRIAS:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGIN=https://seu-frontend.up.railway.app
```

#### ⚠️ CRITICAL: CORS_ORIGIN

O `CORS_ORIGIN` **DEVE** conter a URL exata do seu frontend. Exemplos:

```env
# ✅ CORRETO - URL completa do frontend
CORS_ORIGIN=https://frontend-production-abcd.up.railway.app

# ✅ CORRETO - Múltiplas origens separadas por vírgula
CORS_ORIGIN=https://frontend-production-abcd.up.railway.app,https://meudominio.com

# ❌ ERRADO - Sem protocolo
CORS_ORIGIN=frontend-production-abcd.up.railway.app

# ❌ ERRADO - Protocolo errado
CORS_ORIGIN=http://frontend-production-abcd.up.railway.app
```

### Passo 3: Verificar Variáveis de Ambiente do Frontend

No **Railway Dashboard** → **Frontend Service** → **Variables**:

```env
NEXT_PUBLIC_API_URL=https://backend-production-80f6.up.railway.app
```

**⚠️ IMPORTANTE**: 
- **NÃO** inclua `/api` no final
- **NÃO** inclua barra final `/`
- Deve ser a URL raiz do backend

```env
# ✅ CORRETO
NEXT_PUBLIC_API_URL=https://backend-production-80f6.up.railway.app

# ❌ ERRADO
NEXT_PUBLIC_API_URL=https://backend-production-80f6.up.railway.app/api
NEXT_PUBLIC_API_URL=https://backend-production-80f6.up.railway.app/
```

### Passo 4: Obter URLs Corretas

1. **URL do Backend**:
   - Railway Dashboard → Backend Service → Settings → Domains
   - Copie a URL gerada (ex: `https://backend-production-80f6.up.railway.app`)

2. **URL do Frontend**:
   - Railway Dashboard → Frontend Service → Settings → Domains
   - Copie a URL gerada (ex: `https://frontend-production-xyz.up.railway.app`)

### Passo 5: Atualizar Configurações

#### No Backend:

1. Railway Dashboard → Backend Service → Variables
2. Edite `CORS_ORIGIN`:
   ```env
   CORS_ORIGIN=https://SUA-URL-FRONTEND.up.railway.app
   ```
3. Clique em **Deploy** ou **Redeploy**

#### No Frontend:

1. Railway Dashboard → Frontend Service → Variables
2. Edite `NEXT_PUBLIC_API_URL`:
   ```env
   NEXT_PUBLIC_API_URL=https://backend-production-80f6.up.railway.app
   ```
3. ⚠️ **IMPORTANTE**: Clique em **Redeploy** (não apenas salvar)
   - Variáveis `NEXT_PUBLIC_*` são incorporadas no build!

### Passo 6: Aguardar Deploy

1. Aguarde ambos os serviços terminarem o deploy (~2-5 minutos)
2. Verifique os logs para confirmar sucesso

### Passo 7: Testar

1. **Backend Health Check**:
   ```
   https://backend-production-80f6.up.railway.app/health
   ```
   Deve retornar:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-12-07T..."
   }
   ```

2. **Frontend**:
   - Acesse a URL do frontend
   - Abra DevTools (F12) → Console
   - Verifique se há erros CORS
   - Tente carregar a lista de campanhas

## 🔍 Debug Avançado

### Verificar Logs do Backend

Railway Dashboard → Backend Service → Logs

**Procure por:**
```
🚀 Server running on port 3000
📊 Environment: production
🌐 CORS enabled for: https://...
🔌 WebSocket ready for real-time updates
```

**Se ver:**
```
Error: listen EADDRINUSE: address already in use
```
- O Railway está tentando rodar múltiplas instâncias
- Force um redeploy

**Se ver:**
```
PrismaClientInitializationError
```
- Problema com `DATABASE_URL`
- Verifique se `${{Postgres.DATABASE_URL}}` está configurado

### Verificar Logs do Frontend

Railway Dashboard → Frontend Service → Logs

**Deve ver:**
```
Building frontend...
Successfully built
nginx starting...
```

### Testar CORS Manualmente

Abra o console do navegador na página do frontend e execute:

```javascript
fetch('https://backend-production-80f6.up.railway.app/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Se retornar erro CORS:**
- `CORS_ORIGIN` está errado no backend
- Verifique se a URL do frontend está exatamente correta

**Se retornar 502:**
- Backend não está rodando
- Verifique logs do backend

## 📋 Checklist Completo

### Backend
- [ ] Serviço está rodando (não mostra erro nos logs)
- [ ] `DATABASE_URL` configurada como `${{Postgres.DATABASE_URL}}`
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `CORS_ORIGIN` contém URL exata do frontend (com `https://`)
- [ ] `/health` retorna `{"status": "ok"}`
- [ ] Logs mostram "CORS enabled for: https://..."
- [ ] Migrations executadas com sucesso

### Frontend
- [ ] Serviço está rodando
- [ ] `NEXT_PUBLIC_API_URL` aponta para backend (sem `/api` no final)
- [ ] Build completado com sucesso
- [ ] Nginx está servindo os arquivos
- [ ] Página carrega sem erro 404

### Conectividade
- [ ] Frontend consegue fazer request para `/health`
- [ ] DevTools não mostra erro CORS
- [ ] Campanhas carregam corretamente

## 🚀 Solução Rápida (Copy-Paste)

### 1. Configurar Backend

Railway Dashboard → Backend → Variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGIN=https://frontend-production-xyz.up.railway.app
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=https://backend-production-80f6.up.railway.app/api/auth/google/callback
JWT_SECRET=seu_jwt_secret_minimo_32_caracteres
SESSION_SECRET=seu_session_secret_minimo_32_caracteres
```

⚠️ **Substitua**:
- `frontend-production-xyz.up.railway.app` pela URL real do seu frontend
- `seu_google_client_id` pelo seu Client ID do Google
- `seu_google_client_secret` pelo seu Client Secret do Google
- `seu_jwt_secret_minimo_32_caracteres` por um secret aleatório
- `seu_session_secret_minimo_32_caracteres` por um secret aleatório

### 2. Configurar Frontend

Railway Dashboard → Frontend → Variables:

```env
NEXT_PUBLIC_API_URL=https://backend-production-80f6.up.railway.app
```

### 3. Redeploy Ambos

1. Backend → Redeploy
2. Aguarde terminar
3. Frontend → Redeploy
4. Aguarde terminar

### 4. Testar

1. Acesse: `https://backend-production-80f6.up.railway.app/health`
2. Acesse: `https://seu-frontend.up.railway.app`

## 🆘 Ainda com Problema?

### Erro 502 Persiste

1. **Verifique porta**:
   - Backend DEVE ouvir na porta que o Railway fornece
   - Código atual: `const PORT = process.env.PORT || 3000;` ✅
   
2. **Verifique build**:
   - Railway Dashboard → Backend → Deployments
   - Clique no último deployment
   - Verifique se build passou

3. **Verifique database**:
   - Railway Dashboard → Postgres
   - Verifique se está rodando

### Erro CORS Persiste

1. **Copie URL exata do frontend**:
   ```bash
   # No DevTools → Network → Headers
   # Procure por "Origin" na requisição
   Origin: https://frontend-production-xyz.up.railway.app
   ```

2. **Cole EXATAMENTE em `CORS_ORIGIN`** (incluindo `https://`)

3. **Redeploy backend**

### Logs Mostram "Port in Use"

Force um redeploy:
- Railway Dashboard → Backend → Settings → Redeploy

## 📞 Suporte

Se nada funcionar:

1. **Compartilhe logs**:
   - Railway Dashboard → Backend → Logs (últimas 50 linhas)
   - Railway Dashboard → Frontend → Logs (últimas 50 linhas)

2. **Compartilhe variáveis** (sem secrets):
   - Backend: NODE_ENV, PORT, CORS_ORIGIN
   - Frontend: NEXT_PUBLIC_API_URL

3. **Compartilhe URLs**:
   - URL do backend
   - URL do frontend

---

**Última atualização**: 7 de dezembro de 2025
