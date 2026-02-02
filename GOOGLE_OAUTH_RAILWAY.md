# Configuração Google OAuth no Railway

## 🎯 Visão Geral

Este guia explica como configurar o Google OAuth para funcionar com a aplicação deployada no Railway.

## 📋 Pré-requisitos

- Projeto no [Google Cloud Console](https://console.cloud.google.com)
- Backend e Frontend deployados no Railway
- URLs dos serviços Railway

## 🔧 Passo 1: Google Cloud Console

### 1.1 Criar/Acessar Projeto

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Nome sugerido: "Compra Coletiva"

### 1.2 Configurar OAuth Consent Screen

1. Menu → **APIs & Services** → **OAuth consent screen**
2. **User Type**: External
3. **App name**: Compra Coletiva
4. **User support email**: seu-email@gmail.com
5. **App logo**: (opcional) Logo da aplicação
6. **Application homepage**: URL do frontend Railway
   ```
   https://seu-frontend.up.railway.app
   ```
7. **Privacy Policy**: URL da política
   ```
   https://seu-frontend.up.railway.app/privacy
   ```
8. **Terms of Service**: URL dos termos
   ```
   https://seu-frontend.up.railway.app/terms
   ```
9. **Authorized domains**: Adicione domínio do Railway
   ```
   up.railway.app
   ```
10. **Developer contact**: seu-email@gmail.com
11. Clique em **Save and Continue**

### 1.3 Configurar Scopes

1. Clique em **Add or Remove Scopes**
2. Adicione os seguintes scopes:
   - `userinfo.email` - Ver seu endereço de e-mail
   - `userinfo.profile` - Ver suas informações pessoais
   - `openid` - Autenticação OpenID Connect
3. Clique em **Update** e **Save and Continue**

### 1.4 Adicionar Test Users (Modo Teste)

Se o app estiver em modo teste:
1. Adicione emails de usuários para testar
2. Clique em **Save and Continue**

> **Nota**: Para uso público, você precisará submeter o app para verificação do Google

### 1.5 Criar Credenciais OAuth 2.0

1. Menu → **APIs & Services** → **Credentials**
2. Clique em **+ Create Credentials** → **OAuth client ID**
3. **Application type**: Web application
4. **Name**: Compra Coletiva - Railway
5. **Authorized JavaScript origins**:
   ```
   https://seu-backend.up.railway.app
   https://seu-frontend.up.railway.app
   ```
6. **Authorized redirect URIs**:
   ```
   https://seu-backend.up.railway.app/api/auth/google/callback
   ```
7. Clique em **Create**

### 1.6 Copiar Credenciais

Você receberá:
- **Client ID**: `123456789-abcdefgh.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`

⚠️ **Guarde essas credenciais em local seguro!**

## 🚂 Passo 2: Configurar Railway

### 2.1 Variáveis do Backend

Railway Dashboard → Backend Service → Variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGIN=https://seu-frontend.up.railway.app

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefgh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=https://seu-backend.up.railway.app/api/auth/google/callback

# JWT & Sessions
JWT_SECRET=seu_jwt_secret_minimo_32_caracteres_aleatorios
SESSION_SECRET=seu_session_secret_minimo_32_caracteres_aleatorios
```

#### Gerar Secrets Aleatórios

No terminal (Linux/Mac):
```bash
openssl rand -base64 32
```

No terminal (Windows PowerShell):
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

Ou use um gerador online: https://www.random.org/strings/

### 2.2 Variáveis do Frontend

Railway Dashboard → Frontend Service → Variables:

```env
NEXT_PUBLIC_API_URL=https://seu-backend.up.railway.app
```

### 2.3 Redeploy

1. Salve as variáveis
2. Redeploy do **Backend** (importante!)
3. Aguarde conclusão (~2-3 minutos)
4. **Não precisa** redeploy do frontend (a menos que tenha alterado `NEXT_PUBLIC_API_URL`)

## 🧪 Passo 3: Testar

### 3.1 Verificar Backend

Acesse:
```
https://seu-backend.up.railway.app/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2025-12-07T..."
}
```

### 3.2 Verificar Logs do Backend

Railway Dashboard → Backend → Logs

Procure por:
```
🚀 Server running on port 3000
📊 Environment: production
🌐 CORS enabled for: https://seu-frontend.up.railway.app
🔌 WebSocket ready for real-time updates
✅ CORS_ORIGIN is configured: https://seu-frontend.up.railway.app
```

Se ver `⚠️ WARNING: CORS_ORIGIN is not set!`:
- Adicione a variável `CORS_ORIGIN`
- Redeploy

### 3.3 Testar Login com Google

1. Acesse: `https://seu-frontend.up.railway.app`
2. Clique em **Login** ou **Criar Conta**
3. Clique no botão **Continuar com Google**
4. Você será redirecionado para o Google
5. Escolha sua conta Google
6. Autorize a aplicação
7. Você será redirecionado de volta para a aplicação
8. Verifique se o login foi bem-sucedido

## 🐛 Troubleshooting

### Erro: "redirect_uri_mismatch"

**Causa**: A URL de callback não está autorizada no Google Console

**Solução**:
1. Google Cloud Console → Credentials → Seu OAuth Client
2. **Authorized redirect URIs** → Adicione:
   ```
   https://seu-backend.up.railway.app/api/auth/google/callback
   ```
3. Salve e tente novamente

### Erro: "Access blocked: This app's request is invalid"

**Causa**: OAuth Consent Screen não está configurado corretamente

**Solução**:
1. Google Cloud Console → OAuth consent screen
2. Verifique se todos os campos estão preenchidos
3. Verifique se as URLs estão corretas
4. Adicione `up.railway.app` aos **Authorized domains**

### Erro: "Error 400: invalid_request"

**Causa**: Variáveis `GOOGLE_CLIENT_ID` ou `GOOGLE_CLIENT_SECRET` incorretas

**Solução**:
1. Google Cloud Console → Credentials
2. Copie novamente Client ID e Client Secret
3. Cole no Railway → Backend → Variables
4. Redeploy

### Erro CORS ao tentar login

**Causa**: `CORS_ORIGIN` não está configurado ou incorreto

**Solução**:
1. Railway → Backend → Variables
2. Verifique `CORS_ORIGIN`:
   ```env
   CORS_ORIGIN=https://seu-frontend.up.railway.app
   ```
3. URL deve ser EXATA (com `https://`)
4. Redeploy

### Login funciona mas não redireciona

**Causa**: Frontend não está recebendo resposta do backend

**Solução**:
1. Verifique `NEXT_PUBLIC_API_URL` no frontend
2. Abra DevTools → Console
3. Procure por erros JavaScript
4. Verifique se `https://seu-backend.up.railway.app` está acessível

### Erro: "Client is unauthorized to retrieve access tokens"

**Causa**: Client ID no frontend não corresponde ao backend

**Solução**:
- Este projeto usa Google OAuth server-side (não client-side)
- O frontend apenas redireciona para o backend
- Não precisa configurar Client ID no frontend

## 📊 Verificação Completa

### Checklist Google Cloud Console

- [ ] Projeto criado
- [ ] OAuth Consent Screen configurado
- [ ] User Type: External
- [ ] Privacy Policy URL configurada
- [ ] Terms of Service URL configurada
- [ ] Authorized domains: `up.railway.app`
- [ ] Scopes adicionados: email, profile, openid
- [ ] OAuth Client ID criado
- [ ] JavaScript origins autorizadas
- [ ] Redirect URIs autorizadas

### Checklist Railway Backend

- [ ] `GOOGLE_CLIENT_ID` configurado
- [ ] `GOOGLE_CLIENT_SECRET` configurado
- [ ] `GOOGLE_CALLBACK_URL` configurado
- [ ] `JWT_SECRET` configurado (mínimo 32 caracteres)
- [ ] `SESSION_SECRET` configurado (mínimo 32 caracteres)
- [ ] `CORS_ORIGIN` configurado com URL do frontend
- [ ] Backend deployado com sucesso
- [ ] `/health` retorna 200 OK
- [ ] Logs mostram "CORS enabled for: ..."

### Checklist Railway Frontend

- [ ] `NEXT_PUBLIC_API_URL` aponta para backend
- [ ] Frontend deployado com sucesso
- [ ] Página carrega sem erros
- [ ] Botão "Continuar com Google" aparece

### Checklist Funcional

- [ ] Botão Google redireciona para login.google.com
- [ ] Tela de autorização do Google aparece
- [ ] Após autorizar, redireciona de volta para app
- [ ] Login é completado com sucesso
- [ ] Usuário aparece logado na aplicação
- [ ] Nome e foto do Google aparecem no menu

## 🔒 Segurança

### Secrets

⚠️ **NUNCA** commite secrets no Git:
- ❌ `GOOGLE_CLIENT_SECRET`
- ❌ `JWT_SECRET`
- ❌ `SESSION_SECRET`
- ❌ `DATABASE_URL`

✅ Configure apenas no Railway → Variables

### Domínios Autorizados

Liste apenas domínios que você controla:
```
up.railway.app
seudominio.com (se tiver custom domain)
```

### HTTPS Obrigatório

Google OAuth exige HTTPS em produção:
- ✅ Railway fornece HTTPS automaticamente
- ❌ Não use `http://` em produção

## 🚀 Próximos Passos

### Publicar App (Sair do Modo Teste)

Para permitir qualquer usuário fazer login:

1. Google Cloud Console → OAuth consent screen
2. Clique em **Publish App**
3. Submeta para verificação do Google
4. Aguarde aprovação (~1-2 semanas)

**Requisitos para aprovação:**
- Política de Privacidade acessível publicamente ✅
- Termos de Serviço acessíveis publicamente ✅
- App homepage funcional ✅
- Domínio verificado (opcional mas recomendado)
- Vídeo demo do app (pode ser solicitado)

### Custom Domain (Opcional)

Se você tiver um domínio próprio:

1. Railway → Frontend → Settings → Domains → Add Custom Domain
2. Configure DNS do seu domínio
3. Aguarde propagação
4. Atualize Google Console com novo domínio
5. Atualize variáveis Railway

## 📞 Suporte

### Erros do Google

- [Google OAuth 2.0 Troubleshooting](https://developers.google.com/identity/protocols/oauth2/web-server#troubleshooting)
- [Google API Console](https://console.cloud.google.com)

### Erros do Railway

- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)

---

**Última atualização**: 7 de dezembro de 2025
