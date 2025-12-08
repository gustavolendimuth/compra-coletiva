# Railway Quick Fix - Erro CORS 502

## 🚨 PROBLEMA: Erro CORS + 502

```
Código de status: 502
Falta cabeçalho 'Access-Control-Allow-Origin' no CORS
```

## ✅ SOLUÇÃO EM 5 PASSOS

### 📍 Passo 1: Obter URLs

1. Acesse [Railway Dashboard](https://railway.app)
2. Anote as URLs:

```
Backend:  https://backend-production-80f6.up.railway.app
Frontend: https://__________.up.railway.app
```

> **Onde encontrar**: Railway → Serviço → Settings → Domains

---

### 🔧 Passo 2: Configurar Backend

Railway → **Backend Service** → **Variables**:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGIN=https://SUA-URL-FRONTEND.up.railway.app
```

⚠️ **IMPORTANTE**: 
- Substitua `SUA-URL-FRONTEND` pela URL real
- Inclua `https://`
- Sem barra `/` no final

**Exemplo correto**:
```env
CORS_ORIGIN=https://frontend-production-abcd.up.railway.app
```

**Errado**:
```env
CORS_ORIGIN=frontend-production-abcd.up.railway.app  ❌ (falta https://)
CORS_ORIGIN=https://frontend-production-abcd.up.railway.app/  ❌ (barra final)
```

---

### 🎨 Passo 3: Configurar Frontend

Railway → **Frontend Service** → **Variables**:

```env
VITE_API_URL=https://backend-production-80f6.up.railway.app
```

⚠️ **IMPORTANTE**:
- Sem `/api` no final
- Sem barra `/` no final

**Exemplo correto**:
```env
VITE_API_URL=https://backend-production-80f6.up.railway.app
```

**Errado**:
```env
VITE_API_URL=https://backend-production-80f6.up.railway.app/api  ❌
VITE_API_URL=https://backend-production-80f6.up.railway.app/  ❌
```

---

### 🚀 Passo 4: Redeploy

1. **Backend** → Clique em **Redeploy** → Aguarde (~2-3 min)
2. **Frontend** → Clique em **Redeploy** → Aguarde (~2-3 min)

> **Por que redeploy?** Variáveis `VITE_*` são incorporadas no build!

---

### 🧪 Passo 5: Testar

#### 5.1 Teste o Backend
```
https://backend-production-80f6.up.railway.app/health
```

**Deve retornar**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-07T..."
}
```

❌ **Se retornar 502**:
- Backend não está rodando
- Vá para: Railway → Backend → Logs
- Procure por erros

#### 5.2 Teste o Frontend
```
https://sua-url-frontend.up.railway.app
```

**Deve carregar a página**

❌ **Se der erro CORS**:
- Verifique se `CORS_ORIGIN` está EXATO
- Abra DevTools (F12) → Console
- Verifique mensagem de erro

---

## 🔍 VERIFICAÇÃO RÁPIDA

### Logs do Backend

Railway → Backend → Logs

**Procure por**:
```
✅ CORS_ORIGIN is configured: https://...
🚀 Server running on port 3000
🌐 CORS enabled for: https://...
```

❌ **Se ver**:
```
⚠️ WARNING: CORS_ORIGIN is not set!
```
- Adicione `CORS_ORIGIN` e redeploy

---

## 📋 CHECKLIST FINAL

### Backend ✓
- [ ] `CORS_ORIGIN` = URL exata do frontend
- [ ] `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3000`
- [ ] Redeploy feito
- [ ] `/health` retorna 200

### Frontend ✓
- [ ] `VITE_API_URL` = URL do backend
- [ ] Redeploy feito
- [ ] Página carrega

### Conectividade ✓
- [ ] Backend `/health` funciona
- [ ] Frontend carrega sem erro
- [ ] Sem erro CORS no DevTools
- [ ] Campanhas carregam

---

## ❓ AINDA COM ERRO?

### Erro 502 Persiste

**Causa comum**: Database não conectado

**Solução**:
1. Railway → Postgres → Verifique se está rodando
2. Railway → Backend → Variables → `DATABASE_URL` deve ser:
   ```
   ${{Postgres.DATABASE_URL}}
   ```
3. Backend → Redeploy

### Erro CORS Persiste

**Causa comum**: URL do frontend errada

**Solução**:
1. Abra DevTools (F12) → Network
2. Clique em qualquer requisição para backend
3. Veja o cabeçalho `Origin`:
   ```
   Origin: https://frontend-production-xyz.up.railway.app
   ```
4. Copie EXATAMENTE essa URL
5. Cole em `CORS_ORIGIN`
6. Redeploy backend

### Build Falha

**Solução**:
1. Railway → Backend → Logs
2. Procure erro de build
3. Verifique se `package.json` está correto

---

## 🔐 VARIÁVEIS OPCIONAIS (Google OAuth)

Se quiser habilitar login com Google:

```env
# Backend
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=https://backend-production-80f6.up.railway.app/api/auth/google/callback
JWT_SECRET=minimo_32_caracteres_aleatorios
SESSION_SECRET=minimo_32_caracteres_aleatorios
```

> **Ver guia completo**: `GOOGLE_OAUTH_RAILWAY.md`

---

## 📚 RECURSOS

- [TROUBLESHOOT_RAILWAY.md](TROUBLESHOOT_RAILWAY.md) - Guia detalhado
- [GOOGLE_OAUTH_RAILWAY.md](GOOGLE_OAUTH_RAILWAY.md) - Config Google OAuth
- [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md) - Deploy completo

---

**Última atualização**: 7 de dezembro de 2025
