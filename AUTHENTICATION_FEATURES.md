# 🔐 Funcionalidades de Autenticação Implementadas

## 📋 Índice
1. [Google OAuth](#google-oauth)
2. [Reset de Senha](#reset-de-senha)
3. [Edição de Perfil](#edição-de-perfil)
4. [Testes e Uso](#testes-e-uso)

---

## 🔵 Google OAuth

### ✅ Backend Implementado
O backend Google OAuth está **100% funcional** e pronto para uso.

#### Configuração Necessária

Configure as credenciais no arquivo [backend/.env](backend/.env):
```env
# Obtenha as credenciais em: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

#### Rotas Disponíveis

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/auth/google` | GET | Inicia fluxo OAuth (redireciona para Google) |
| `/api/auth/google/callback` | GET | Processa retorno do Google |

#### Como Funciona

1. **Usuário clica em "Continuar com Google"**
   - Frontend: Redireciona para `http://localhost:3000/api/auth/google`

2. **Google autentica o usuário**
   - Usuário faz login no Google
   - Google redireciona para `/api/auth/google/callback`

3. **Backend processa o callback**
   - Verifica/cria usuário no banco de dados
   - Gera tokens JWT (access + refresh)
   - Redireciona para: `http://localhost:5173/auth/callback?accessToken=...&refreshToken=...&userId=...&userName=...&userEmail=...&userRole=...`

4. **Frontend processa tokens**
   - Página [AuthCallback.tsx](frontend/src/pages/AuthCallback.tsx) extrai tokens da URL
   - Salva no `localStorage` via `authStorage`
   - Reconecta socket com novo token
   - Redireciona para `/campaigns`

#### Arquivos Implementados

**Backend:**
- ✅ [config/passport.ts](backend/src/config/passport.ts) - Estratégia Google OAuth
- ✅ [routes/auth.ts](backend/src/routes/auth.ts) - Rotas `/google` e `/google/callback`
- ✅ [index.ts](backend/src/index.ts) - Inicialização do Passport

**Frontend:**
- ✅ [pages/AuthCallback.tsx](frontend/src/pages/AuthCallback.tsx) - Processa callback
- ✅ [components/AuthModal.tsx](frontend/src/components/AuthModal.tsx) - Botão "Continuar com Google"
- ✅ [App.tsx](frontend/src/App.tsx) - Rota `/auth/callback`

---

## 🔑 Reset de Senha

### ✅ Backend Implementado
Sistema completo de reset de senha com tokens temporários.

#### Rotas Disponíveis

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/auth/request-password-reset` | POST | Solicita reset (gera token) |
| `/api/auth/reset-password` | POST | Reseta senha com token |

#### Como Funciona

1. **Solicitar Reset**
   ```bash
   POST /api/auth/request-password-reset
   Content-Type: application/json

   {
     "email": "usuario@example.com"
   }
   ```

   **Resposta:**
   ```json
   {
     "message": "Se o email existir em nossa base, você receberá instruções para resetar sua senha",
     "token": "abc123..."  // Apenas em desenvolvimento
   }
   ```

2. **Reset de Senha**
   ```bash
   POST /api/auth/reset-password
   Content-Type: application/json

   {
     "token": "abc123...",
     "newPassword": "NovaSenha123!"
   }
   ```

#### Características

- ✅ Token único gerado com `crypto.randomBytes(32)`
- ✅ Token expira em 1 hora
- ✅ Token pode ser usado apenas uma vez (flag `used`)
- ✅ Validação de senha: min 6 chars, 1 maiúscula, 1 minúscula, 1 número
- ✅ Por segurança, não revela se email existe (sempre retorna sucesso)
- ✅ Impede reset para contas OAuth (sem senha)

#### Modelo no Banco de Dados

```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(...)
}
```

#### Frontend Pendente

Para completar a funcionalidade, crie:

1. **Página de Solicitação** - `/request-password-reset`
   - Formulário com campo de email
   - Chama `POST /api/auth/request-password-reset`

2. **Página de Reset** - `/reset-password?token=xxx`
   - Formulário com campo de nova senha
   - Extrai token da URL
   - Chama `POST /api/auth/reset-password`

---

## 👤 Edição de Perfil

### ✅ Backend Implementado
Permite usuário alterar nome e/ou senha.

#### Rota Disponível

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/auth/profile` | PATCH | Atualiza nome e/ou senha |

#### Como Funciona

```bash
PATCH /api/auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Novo Nome",              // Opcional
  "currentPassword": "SenhaAtual",   // Obrigatório se mudar senha
  "newPassword": "NovaSenha123!"     // Opcional
}
```

**Resposta:**
```json
{
  "message": "Perfil atualizado com sucesso",
  "user": {
    "id": "...",
    "name": "Novo Nome",
    "email": "usuario@example.com",
    "role": "CUSTOMER"
  }
}
```

#### Características

- ✅ Requer autenticação (middleware `requireAuth`)
- ✅ Atualiza nome sem necessitar senha
- ✅ Para mudar senha, exige senha atual
- ✅ Verifica senha atual antes de permitir mudança
- ✅ Validação completa da nova senha
- ✅ Impede mudança de senha em contas OAuth

#### Frontend Pendente

Para completar, adicione ao **UserMenu**:

1. Botão "Editar Perfil"
2. Modal com formulários para:
   - Mudar nome
   - Mudar senha (com campos: senha atual, nova senha)

---

## 🧪 Testes e Uso

### Testar Google OAuth

1. **Iniciar aplicação:**
   ```bash
   docker-compose up
   ```

2. **Acessar:** http://localhost:5173
3. **Clicar em "Criar Conta" ou "Entrar"**
4. **Clicar em "Continuar com Google"**
5. **Fazer login no Google**
6. **Será redirecionado de volta logado**

### Testar Reset de Senha

```bash
# 1. Solicitar reset
curl -X POST http://localhost:3000/api/auth/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"gustavolendimuth@gmail.com"}'

# Resposta incluirá o token em desenvolvimento:
# {"message":"...","token":"abc123..."}

# 2. Resetar senha com o token
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"abc123...",
    "newPassword":"NovaSenha123!"
  }'
```

### Testar Edição de Perfil

```bash
# 1. Fazer login primeiro para obter access token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"gustavolendimuth@gmail.com",
    "password":"Admin123!"
  }'

# 2. Usar o accessToken retornado
curl -X PATCH http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Gustavo Updated"
  }'

# 3. Mudar senha
curl -X PATCH http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword":"Admin123!",
    "newPassword":"NovaAdmin123!"
  }'
```

---

## 📊 Status de Implementação

| Funcionalidade | Backend | Frontend | Status |
|----------------|---------|----------|--------|
| **Google OAuth** | ✅ 100% | ✅ 100% | **COMPLETO** |
| **Reset de Senha** | ✅ 100% | ⏳ 0% | Backend pronto |
| **Edição de Perfil** | ✅ 100% | ⏳ 0% | Backend pronto |

---

## 🎯 Próximos Passos (Opcional)

### 1. Frontend Reset de Senha
- Criar página `/request-password-reset`
- Criar página `/reset-password`
- Adicionar link "Esqueci minha senha" no AuthModal

### 2. Frontend Edição de Perfil
- Adicionar opção "Editar Perfil" no UserMenu
- Criar modal/página de edição
- Permitir trocar nome e senha

### 3. Envio de Emails
- Configurar serviço de email (SendGrid, AWS SES, etc.)
- Enviar email com link de reset de senha
- Template de email profissional

### 4. Melhorias de Segurança
- Rate limiting em rotas sensíveis
- Captcha em registro/login
- Bloqueio de conta após múltiplas tentativas falhas
- Autenticação de dois fatores (2FA)

---

## 📚 Referências

- **Documentação Principal:** [AUTHENTICATION_IMPLEMENTATION.md](AUTHENTICATION_IMPLEMENTATION.md)
- **Google Cloud Console:** https://console.cloud.google.com/
- **Passport.js:** http://www.passportjs.org/
- **Google OAuth Guide:** https://developers.google.com/identity/protocols/oauth2

---

**✅ Todas as funcionalidades backend estão implementadas e testadas!**
**🚀 O sistema está pronto para uso em desenvolvimento.**
**📧 Para produção, configure envio de emails e atualize as URLs de callback.**
