# Credenciais de Teste - Ambiente de Desenvolvimento

## Usuários Disponíveis no Sistema

### 1. Usuário de Teste (Email/Senha)
**Criado especificamente para testes de autenticação**

- **Email:** `usuario@teste.com`
- **Senha:** `Teste1234`
- **Nome:** Usuario Teste
- **Role:** CUSTOMER
- **Métodos de login:** Email/Senha apenas

### 2. Administrador
**Conta principal com permissões de admin**

- **Email:** `gustavolendimuth@gmail.com`
- **Nome:** Gustavo Lendimuth
- **Role:** ADMIN
- **Métodos de login:** Email/Senha E Google OAuth
- **Nota:** Senha não documentada (use Google OAuth)

### 3. Usuário de Teste Antigo
**Criado anteriormente**

- **Email:** `teste@example.com`
- **Nome:** Teste User
- **Role:** CUSTOMER
- **Métodos de login:** Email/Senha
- **Nota:** Senha não documentada

---

## Como Testar Autenticação

### Teste 1: Login com Email/Senha

1. Acesse http://localhost:5173
2. Clique em **"Entrar"**
3. Use as credenciais:
   - Email: `usuario@teste.com`
   - Senha: `Teste1234`
4. Clique em **"Entrar"**

**Resultado esperado:** Login bem-sucedido com mensagem de boas-vindas

### Teste 2: Criar Nova Conta

1. Acesse http://localhost:5173
2. Clique em **"Criar Conta"**
3. Preencha o formulário:
   - Nome: Seu nome
   - Email: seu.email@example.com
   - Senha: Senha123 (mínimo 6 caracteres, 1 maiúscula, 1 minúscula, 1 número)
   - Tipo de conta: Comprador ou Criador de Campanhas
4. Clique em **"Criar Conta"**

**Resultado esperado:** Conta criada e login automático

### Teste 3: Login com Google OAuth

1. Acesse http://localhost:5173
2. Clique em **"Entrar"** ou **"Criar Conta"**
3. Clique no botão **"Continuar com Google"**
4. Faça login com sua conta Google
5. Autorize o aplicativo

**Resultado esperado:**
- Redirecionamento para Google
- Login na conta Google
- Redirecionamento de volta para http://localhost:5173
- Login automático no sistema

**Nota:** As credenciais do Google OAuth atuais podem estar expiradas ou com restrições. Se não funcionar, será necessário criar novas credenciais no [Google Cloud Console](https://console.cloud.google.com/).

---

## Teste via API (curl)

### Criar Novo Usuário
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"novo@usuario.com","password":"Senha123","name":"Novo Usuario","role":"CUSTOMER"}'
```

### Fazer Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@teste.com","password":"Teste1234"}'
```

### Renovar Access Token
```bash
# Primeiro, obtenha o refreshToken do login
# Depois use:
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"SEU_REFRESH_TOKEN_AQUI"}'
```

### Buscar Dados do Usuário
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI"
```

---

## Requisitos de Senha

Para criar uma conta, a senha deve atender aos seguintes critérios:

- ✅ Mínimo 6 caracteres
- ✅ Pelo menos 1 letra maiúscula (A-Z)
- ✅ Pelo menos 1 letra minúscula (a-z)
- ✅ Pelo menos 1 número (0-9)

**Exemplos de senhas válidas:**
- `Teste123`
- `Senha1234`
- `Admin2024`
- `User999`

**Exemplos de senhas inválidas:**
- `teste123` (sem maiúscula)
- `TESTE123` (sem minúscula)
- `TesteSenha` (sem número)
- `Test1` (menos de 6 caracteres)

---

## Status dos Endpoints de Autenticação

### ✅ Funcionando (Testado)

| Endpoint | Método | Status | Descrição |
|----------|--------|--------|-----------|
| `/api/auth/register` | POST | ✅ OK | Criar nova conta |
| `/api/auth/login` | POST | ✅ OK | Login com email/senha |
| `/api/auth/google` | GET | ✅ OK | Inicia fluxo Google OAuth |
| `/api/auth/google/callback` | GET | ✅ OK | Callback do Google OAuth |
| `/api/auth/refresh` | POST | ⚠️ Não testado | Renovar access token |
| `/api/auth/me` | GET | ⚠️ Não testado | Buscar usuário atual |
| `/api/auth/logout` | POST | ⚠️ Não testado | Logout (invalida refresh token) |
| `/api/auth/request-password-reset` | POST | ⚠️ Não testado | Solicitar reset de senha |
| `/api/auth/reset-password` | POST | ⚠️ Não testado | Resetar senha com token |
| `/api/auth/profile` | PATCH | ⚠️ Não testado | Atualizar perfil |

---

## Troubleshooting

### Problema: "Email ou senha incorretos"
**Solução:** Verifique se está usando as credenciais corretas de `usuario@teste.com` / `Teste1234`

### Problema: "Senha não atende aos requisitos mínimos"
**Solução:** Use uma senha com pelo menos 6 caracteres, incluindo maiúscula, minúscula e número

### Problema: Google OAuth não funciona
**Possíveis causas:**
1. Credenciais do Google expiradas ou inválidas
2. Redirect URI não autorizado no Google Cloud Console
3. OAuth consent screen não configurado
4. Conta Google não tem permissão

**Solução:** Criar novas credenciais no Google Cloud Console e atualizar `backend/.env`

### Problema: Frontend não conecta ao backend
**Verificar:**
1. Backend está rodando: `docker-compose ps`
2. Frontend está acessando a URL correta: http://localhost:3000
3. CORS está configurado para http://localhost:5173
4. Console do navegador mostra erros de rede

---

## Configuração do Google OAuth (Se necessário)

Se o Google OAuth não estiver funcionando, siga estes passos:

### 1. Criar Projeto no Google Cloud Console

1. Acesse https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá para **APIs & Services** > **Credentials**

### 2. Configurar OAuth Consent Screen

1. Clique em **OAuth consent screen**
2. Escolha **External** (para testes)
3. Preencha os campos obrigatórios:
   - App name: Compra Coletiva
   - User support email: seu email
   - Developer contact: seu email
4. Adicione escopos: `email`, `profile`
5. Adicione usuários de teste (seu email do Google)

### 3. Criar Credenciais OAuth 2.0

1. Vá para **Credentials** > **Create Credentials** > **OAuth client ID**
2. Tipo: **Web application**
3. Nome: Compra Coletiva Development
4. **Authorized redirect URIs:** Adicione:
   - `http://localhost:3000/api/auth/google/callback`
5. Clique em **Create**
6. Copie o **Client ID** e **Client Secret**

### 4. Atualizar backend/.env

```env
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### 5. Reiniciar Backend

```bash
docker-compose restart backend
```

---

## Notas Importantes

- 🔒 **Nunca commite senhas reais no git**
- 🔑 **Estas credenciais são apenas para desenvolvimento local**
- 📝 **Em produção, use variáveis de ambiente seguras**
- 🚫 **As credenciais do Google OAuth expostas aqui devem ser substituídas**
- ✅ **Sempre use HTTPS em produção**

---

**Última atualização:** 25 de novembro de 2025
**Ambiente:** Desenvolvimento Local
**Versão:** 1.0.0
