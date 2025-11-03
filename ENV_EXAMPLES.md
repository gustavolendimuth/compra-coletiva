# Environment Variables - Exemplos de Uso

Este documento mostra exemplos práticos de como configurar as variáveis de ambiente no projeto.

## 🔧 Backend - CORS_ORIGIN

A variável `CORS_ORIGIN` aceita múltiplos domínios separados por vírgula e adiciona automaticamente o protocolo correto.

### Desenvolvimento Local

```bash
# Apenas local
CORS_ORIGIN=localhost:5173
# Resultado: http://localhost:5173

# Múltiplos locais
CORS_ORIGIN=localhost:5173,127.0.0.1:5173
# Resultado: http://localhost:5173, http://127.0.0.1:5173
```

### Desenvolvimento com Frontend Remoto

```bash
NODE_ENV=development
CORS_ORIGIN=localhost:5173,dev.meuapp.com
# Resultado: http://localhost:5173, http://dev.meuapp.com
```

### Produção

```bash
NODE_ENV=production
CORS_ORIGIN=localhost:5173,meuapp.com,app.railway.app
# Resultado: http://localhost:5173, https://meuapp.com, https://app.railway.app
```

### Com Protocolo Manual

```bash
# Misturando automático e manual
CORS_ORIGIN=localhost:5173,https://meuapp.com,http://staging.meuapp.com
# Resultado: http://localhost:5173, https://meuapp.com, http://staging.meuapp.com

# Forçar HTTPS no localhost (útil para testes)
CORS_ORIGIN=https://localhost:5173
# Resultado: https://localhost:5173
```

## 🎨 Frontend - VITE_API_URL

A variável `VITE_API_URL` adiciona automaticamente o protocolo correto baseado no ambiente de build.

### Desenvolvimento Local (npm run dev)

```bash
# Apenas domínio
VITE_API_URL=localhost:3000
# Resultado: http://localhost:3000

# Com IP
VITE_API_URL=127.0.0.1:3000
# Resultado: http://127.0.0.1:3000
```

### Desenvolvimento com Backend Remoto

```bash
# Modo dev (npm run dev)
VITE_API_URL=api-dev.meuapp.com
# Resultado: http://api-dev.meuapp.com
```

### Produção (npm run build)

```bash
# Build de produção
VITE_API_URL=api.meuapp.com
# Resultado: https://api.meuapp.com

# Local continua http mesmo em build
VITE_API_URL=localhost:3000
# Resultado: http://localhost:3000
```

### Com Protocolo Manual

```bash
# Forçar HTTPS em dev
VITE_API_URL=https://api-dev.meuapp.com
# Resultado: https://api-dev.meuapp.com

# Forçar HTTP em produção (não recomendado)
VITE_API_URL=http://api.meuapp.com
# Resultado: http://api.meuapp.com
```

## 📋 Cenários Comuns

### 1. Desenvolvimento Local Completo

**Backend (.env)**
```bash
NODE_ENV=development
PORT=3000
CORS_ORIGIN=localhost:5173
```

**Frontend (.env)**
```bash
VITE_API_URL=localhost:3000
```

### 2. Frontend Local + Backend Remoto

**Backend (.env) - no servidor**
```bash
NODE_ENV=production
CORS_ORIGIN=localhost:5173,app.meusite.com
```

**Frontend (.env) - local**
```bash
VITE_API_URL=https://api.meusite.com
```

### 3. Produção no Railway/Vercel

**Backend (.env) - Railway**
```bash
NODE_ENV=production
CORS_ORIGIN=meuapp.vercel.app,www.meuapp.com
```

**Frontend (.env) - Vercel**
```bash
VITE_API_URL=meuapp-backend.railway.app
# Build irá gerar: https://meuapp-backend.railway.app
```

### 4. Múltiplos Ambientes

**Backend (.env) - Staging/Production**
```bash
NODE_ENV=production
CORS_ORIGIN=localhost:5173,staging.meuapp.com,app.meuapp.com,www.meuapp.com
# Resultado:
# - http://localhost:5173
# - https://staging.meuapp.com
# - https://app.meuapp.com
# - https://www.meuapp.com
```

## 🔍 Como Funciona

### Regras de Protocolo

1. **Se o protocolo já está especificado** (`http://` ou `https://`):
   - ✅ Usa exatamente como está

2. **Para domínios locais** (localhost, 127.0.0.1, 0.0.0.0):
   - ✅ Sempre usa `http://`
   - ✅ Não importa o ambiente (dev ou prod)

3. **Para domínios remotos SEM protocolo**:
   - Backend: `https://` se `NODE_ENV=production`, senão `http://`
   - Frontend: `https://` se build de produção, senão `http://`

### Exemplos de Detecção

```bash
# Detectado como LOCAL → sempre http://
localhost:5173
127.0.0.1:5173
0.0.0.0:3000
localhost:3000

# Detectado como REMOTO → protocolo baseado no ambiente
api.meuapp.com
192.168.1.100:3000
meuapp.railway.app

# Protocolo MANUAL → usa como especificado
http://api.meuapp.com
https://localhost:5173
```

## ⚠️ Dicas Importantes

1. **Nunca commite arquivos .env** - Use `.env.example` como template
2. **Em produção, sempre use HTTPS** para domínios remotos (exceto localhost)
3. **Para debug**, use protocolo manual para ter controle total
4. **Railway/Vercel** detectam `NODE_ENV=production` automaticamente
5. **Múltiplos domínios** são úteis para permitir acesso de diferentes origens

## 🧪 Testando a Configuração

### Backend
Ao iniciar o servidor, você verá no console:
```
🌐 CORS enabled for: http://localhost:5173, https://meuapp.com
```

### Frontend
Inspecione a variável no console do browser:
```javascript
// No DevTools Console
import { API_URL } from './lib/env'
console.log(API_URL)
```

Ou adicione temporariamente no código:
```typescript
// frontend/src/lib/env.ts
console.log('API_URL configurado:', API_URL);
```
