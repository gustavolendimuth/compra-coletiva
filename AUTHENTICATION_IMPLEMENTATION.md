# Sistema de Autenticação - Implementação Completa

## 📅 Data de Implementação
25 de Novembro de 2025

## 🎯 Objetivo
Implementar sistema de autenticação com 3 níveis de usuário (ADMIN, CAMPAIGN_CREATOR, CUSTOMER) com login via email/senha e Google OAuth, sessão persistente de 1 ano, e proteção de todas as rotas sensíveis.

---

## ✅ O QUE FOI IMPLEMENTADO

### 1. Infraestrutura de Backup e Migração

#### Scripts de Backup Automático
**Localização**: `backend/scripts/`

- **backup-db.ts**: Script automático de backup do PostgreSQL
  - Usa `pg_dump` para criar backups completos
  - Cria arquivo `.sql` com timestamp
  - Armazena em `backups/` (ignorado pelo git)
  - Mostra estatísticas (tamanho, últimos 5 backups)

- **restore-db.ts**: Script de restore interativo
  - Lista backups disponíveis
  - Confirmação obrigatória (digitar "CONFIRMAR")
  - Restauração completa do banco

**Comandos**:
```bash
# Criar backup
npm run backup --workspace=backend
docker exec compra-coletiva-backend npm run backup

# Restaurar backup
npm run restore --workspace=backend
docker exec compra-coletiva-backend npm run restore
```

#### Migrations do Schema
**Arquivo**: `backend/prisma/schema.prisma`

**Novos Models**:

1. **User** - Usuários do sistema
   - id, email (unique), password (nullable para OAuth)
   - name, role (enum), googleId (nullable)
   - Relações: campaigns, orders, sentMessages, sessions

2. **Session** - Refresh tokens
   - id, userId, token (unique), expiresAt (1 ano)
   - Relação: user

3. **Enums**:
   - UserRole: ADMIN, CAMPAIGN_CREATOR, CUSTOMER

**Modificações em Models Existentes**:

1. **Campaign**:
   - ➕ creatorId (String, nullable)
   - ➕ Relação: creator → User

2. **Order**:
   - ➕ userId (String, nullable)
   - ➕ Relação: customer → User
   - Mantém customerName para histórico

3. **OrderMessage**:
   - ➕ senderId (String, nullable)
   - ➕ isRead (Boolean, default false)
   - ➕ Relação: sender → User
   - Mantém senderName/senderType (nullable) para compatibilidade

**Migrations Aplicadas**:
- `20251124221721_add_user_system_nullable` - Adiciona campos nullable

#### Script de Migração de Dados
**Arquivo**: `backend/prisma/seed-migration.ts`

**Executado com sucesso**:
- ✅ Criou usuário ADMIN (Gustavo Lendimuth)
- ✅ Criou usuário Sistema (para pedidos antigos)
- ✅ Atribuiu 1 campanha ao admin
- ✅ Atribuiu 2 pedidos ao Sistema

**Comando**:
```bash
npm run seed:migrate --workspace=backend
```

---

### 2. Sistema de Autenticação Backend

#### Services

**backend/src/services/authService.ts**
- `hashPassword(password)` - Hash com bcrypt (10 rounds)
- `verifyPassword(password, hash)` - Verifica senha
- `validatePassword(password)` - Valida requisitos mínimos
- `validateEmail(email)` - Valida formato de email

**backend/src/services/tokenService.ts**
- `generateAccessToken(payload)` - JWT 15 minutos
- `generateRefreshToken(payload)` - JWT 1 ano
- `generateTokenPair(payload)` - Gera ambos
- `verifyAccessToken(token)` - Valida access token
- `verifyRefreshToken(token)` - Valida refresh token
- `saveRefreshToken(userId, token)` - Salva no banco
- `validateRefreshToken(token)` - Verifica se existe e não expirou
- `revokeRefreshToken(token)` - Revoga token (logout)
- `revokeAllUserTokens(userId)` - Logout de todos dispositivos
- `cleanupExpiredSessions()` - Remove sessões expiradas
- `extractTokenFromHeader(authHeader)` - Extrai Bearer token

#### Middleware

**backend/src/middleware/authMiddleware.ts**

1. **requireAuth** - Verifica autenticação obrigatória
   - Extrai e valida JWT
   - Anexa user ao req
   - Retorna 401 se não autenticado

2. **optionalAuth** - Autenticação opcional
   - Anexa user se token válido
   - Não bloqueia se não autenticado

3. **requireRole(...roles)** - Valida papel do usuário
   - Verifica se user.role está nos roles permitidos
   - Retorna 403 se não autorizado

4. **requireCampaignOwnership** - Valida ownership de campanha
   - Admin tem acesso total
   - Criador pode modificar sua campanha
   - Retorna 403 se não é dono

5. **requireOrderOwnership** - Valida ownership de pedido
   - Admin tem acesso total
   - Usuário pode modificar seu pedido
   - Retorna 403 se não é dono

6. **requireMessageAccess** - Valida acesso a mensagens
   - Admin tem acesso total
   - Dono do pedido pode acessar
   - Criador da campanha pode acessar
   - Retorna 403 se não autorizado

**backend/src/types/express.d.ts**
- Estende Express Request com `user?: User`

#### Rotas de Autenticação

**backend/src/routes/auth.ts**

| Rota | Método | Auth | Descrição |
|------|--------|------|-----------|
| `/api/auth/register` | POST | ❌ | Registra novo usuário (CUSTOMER) |
| `/api/auth/login` | POST | ❌ | Login email/senha → tokens |
| `/api/auth/refresh` | POST | ❌ | Renova access token |
| `/api/auth/logout` | POST | ✅ | Revoga refresh token |
| `/api/auth/me` | GET | ✅ | Dados do usuário atual |

**Schemas de Validação** (Zod):
- registerSchema: name, email, password
- loginSchema: email, password
- refreshSchema: refreshToken

**Validações**:
- Email: formato válido
- Senha: mínimo 6 chars, 1 maiúscula, 1 minúscula, 1 número
- Email único: verifica duplicatas

---

### 3. Proteção de Rotas Existentes

#### Campanhas (`backend/src/routes/campaigns.ts`)

| Rota | Método | Auth | Middleware | Alterações |
|------|--------|------|------------|------------|
| GET `/api/campaigns` | GET | ❌ | - | Público |
| GET `/api/campaigns/:id` | GET | ❌ | - | Público |
| POST `/api/campaigns` | POST | ✅ | requireAuth, requireRole('CAMPAIGN_CREATOR', 'ADMIN') | ➕ Salva creatorId automaticamente |
| PATCH `/api/campaigns/:id` | PATCH | ✅ | requireAuth, requireCampaignOwnership | Valida ownership |
| PATCH `/api/campaigns/:id/status` | PATCH | ✅ | requireAuth, requireCampaignOwnership | Valida ownership |
| DELETE `/api/campaigns/:id` | DELETE | ✅ | requireAuth, requireCampaignOwnership | Valida ownership |
| GET `/api/campaigns/:id/supplier-invoice` | GET | ❌ | - | Público |

#### Produtos (`backend/src/routes/products.ts`)

| Rota | Método | Auth | Middleware | Alterações |
|------|--------|------|------------|------------|
| GET `/api/products` | GET | ❌ | - | Público |
| GET `/api/products/:id` | GET | ❌ | - | Público |
| POST `/api/products` | POST | ✅ | requireAuth, requireCampaignOwnershipViaBody | Valida dono da campanha |
| PATCH `/api/products/:id` | PATCH | ✅ | requireAuth, requireProductOwnership | Valida dono via produto |
| DELETE `/api/products/:id` | DELETE | ✅ | requireAuth, requireProductOwnership | Valida dono via produto |

**Middlewares Customizados**:
- `requireCampaignOwnershipViaBody` - Valida ownership via campaignId no body
- `requireProductOwnership` - Valida ownership via productId nos params

#### Pedidos (`backend/src/routes/orders.ts`)

| Rota | Método | Auth | Middleware | Alterações |
|------|--------|------|------------|------------|
| GET `/api/orders` | GET | 🔶 | optionalAuth | ➕ Filtra por userId se não admin/criador |
| GET `/api/orders/:id` | GET | ❌ | - | Público |
| POST `/api/orders` | POST | ✅ | requireAuth | ➕ Salva userId automaticamente |
| PATCH `/api/orders/:id` | PATCH | ✅ | requireAuth, requireOrderOwnership | Valida ownership |
| PUT `/api/orders/:id` | PUT | ✅ | requireAuth, requireOrderOwnership | Valida ownership |
| POST `/api/orders/:id/items` | POST | ✅ | requireAuth, requireOrderOwnership | Valida ownership |
| DELETE `/api/orders/:id/items/:itemId` | DELETE | ✅ | requireAuth, requireOrderOwnership | Valida ownership |
| DELETE `/api/orders/:id` | DELETE | ✅ | requireAuth, requireOrderOwnership | Valida ownership |

**Lógica de Filtragem** (GET /api/orders):
- Sem auth: Mostra todos os pedidos da campanha
- Com auth ADMIN: Mostra todos os pedidos
- Com auth CRIADOR: Mostra todos os pedidos da sua campanha
- Com auth CUSTOMER: Mostra apenas seus pedidos

#### Mensagens (`backend/src/routes/messages.ts`)

| Rota | Método | Auth | Middleware | Alterações |
|------|--------|------|------------|------------|
| GET `/api/messages` | GET | ✅ | requireAuth, requireMessageAccess | ➕ Marca como lidas automaticamente |
| POST `/api/messages` | POST | ✅ | requireAuth, requireMessageAccess | ➕ Salva senderId, define senderType automaticamente |
| GET `/api/messages/unread-count` | GET | ✅ | requireAuth | ➕ **NOVA ROTA** - Conta mensagens não lidas |

**Lógica de Acesso**:
- Dono do pedido pode acessar mensagens do seu pedido
- Criador da campanha pode acessar mensagens de todos pedidos da campanha
- Admin pode acessar todas as mensagens

**Auto-marcação como Lida**:
- Ao buscar mensagens (GET), marca como lidas todas que não são do usuário atual

**senderType Automático**:
- ADMIN: Se user.role === 'ADMIN' OU se é criador da campanha
- CUSTOMER: Nos demais casos

---

### 4. Environment Variables

**backend/.env**
```env
# Existentes
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@db:5432/compra_coletiva
CORS_ORIGIN=localhost:5173

# NOVOS - Authentication
JWT_ACCESS_SECRET=dev-access-secret-CHANGE-THIS-IN-PRODUCTION-a3f8d9e2c1b4
JWT_REFRESH_SECRET=dev-refresh-secret-CHANGE-THIS-IN-PRODUCTION-f7g8h9i0j1k2
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=365d

# Google OAuth (configurar quando necessário)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
# FRONTEND_URL=http://localhost:5173
```

**⚠️ IMPORTANTE para Produção**:
- Gerar novos JWT secrets aleatórios (64+ chars)
- Configurar Google OAuth credentials
- Atualizar CORS_ORIGIN para domínio de produção
- Mudar NODE_ENV=production

---

### 5. Dependências Instaladas

**backend/package.json**
```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "jsonwebtoken": "^9.0.2",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "passport-jwt": "^4.0.1",
    "cookie-parser": "^1.4.7",
    "shelljs": "^0.10.0",
    "dotenv": "^17.2.3"
  },
  "devDependencies": {
    "@types/bcrypt": "^6.0.0",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/passport": "^1.0.17",
    "@types/passport-google-oauth20": "^2.0.17",
    "@types/passport-jwt": "^4.0.1",
    "@types/cookie-parser": "^1.4.10",
    "@types/shelljs": "^0.8.17"
  },
  "scripts": {
    "backup": "tsx scripts/backup-db.ts",
    "restore": "tsx scripts/restore-db.ts",
    "seed:migrate": "tsx prisma/seed-migration.ts"
  }
}
```

---

### 6. Docker Updates

**backend/Dockerfile e Dockerfile.dev**
- Adicionado `postgresql-client` para scripts de backup
- Linha 5 (dev) / Linhas 5 e 35 (prod): `RUN apk add --no-cache openssl libc6-compat postgresql-client`

---

## 🔐 CREDENCIAIS DE ADMIN

```
Email: gustavolendimuth@gmail.com
Senha: Admin123!
Role: ADMIN
```

**⚠️ Alterar senha após primeiro login em produção!**

---

## 📊 ESTADO DO BANCO DE DADOS

### Usuários Criados
1. **Admin** (Gustavo Lendimuth) - gustavolendimuth@gmail.com
2. **Sistema** - sistema@compracoletiva.internal (sem senha, para pedidos legado)

### Dados Migrados
- **Campanhas**: 1 campanha atribuída ao admin
- **Pedidos**: 2 pedidos atribuídos ao Sistema
- **Mensagens**: 1 mensagem antiga sem migração (nullable senderId)

---

## 🧪 TESTES REALIZADOS

### ✅ Testado e Funcionando

1. **POST /api/auth/register**
   - Criação de novo usuário (role CUSTOMER)
   - Validação de email e senha
   - Retorna access + refresh tokens

2. **POST /api/auth/login**
   - Login com email/senha
   - Retorna tokens válidos
   - Dados do usuário corretos

3. **GET /api/auth/me**
   - Retorna dados do usuário autenticado
   - Funciona com token válido

4. **POST /api/campaigns (sem auth)**
   - Retorna 401 UNAUTHORIZED ✅
   - Mensagem: "Token de autenticação não fornecido"

5. **POST /api/campaigns (com auth ADMIN)**
   - Cria campanha com sucesso ✅
   - creatorId automaticamente preenchido

### Exemplos de Testes

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"gustavolendimuth@gmail.com","password":"Admin123!"}'

# Criar campanha (requer token)
curl -X POST http://localhost:3000/api/campaigns \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -d '{"name":"Nova Campanha","description":"Teste"}'

# Buscar dados do usuário
curl -X GET http://localhost:3000/api/auth/me \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

---

## ⏭️ PRÓXIMOS PASSOS

### 1. Frontend (Não Implementado)
**Prioridade: ALTA**

Criar:
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/lib/authStorage.ts`
- `frontend/src/lib/authApi.ts`
- `frontend/src/components/AuthModal.tsx`
- `frontend/src/components/UserMenu.tsx`
- `frontend/src/components/NotificationIcon.tsx`

Modificar:
- `frontend/src/lib/api.ts` (adicionar interceptor)
- `frontend/src/lib/socket.ts` (passar token)
- `frontend/src/App.tsx` (AuthProvider)
- `frontend/src/pages/*.tsx` (integrar auth)

### 2. Google OAuth (Não Implementado)
**Prioridade: MÉDIA**

Passos:
1. Configurar Google Cloud Console
2. Criar OAuth Client ID
3. Implementar Passport Google Strategy
4. Criar rota `/api/auth/google`
5. Criar rota `/api/auth/google/callback`
6. Testar fluxo completo

### 3. Socket.io Authentication (Não Implementado)
**Prioridade: MÉDIA**

Implementar:
- Middleware de auth para Socket.io
- Validação de token no handshake
- Filtragem de rooms por permissão
- Emissão de eventos de notificação

### 4. Deploy em Produção
**Prioridade: BAIXA (depende do frontend)**

Checklist:
- [ ] Gerar novos JWT secrets
- [ ] Configurar Google OAuth para produção
- [ ] Atualizar CORS_ORIGIN
- [ ] Criar backup do banco antes da migração
- [ ] Executar migrations no Railway
- [ ] Executar seed-migration no Railway
- [ ] Testar todas as rotas
- [ ] Documentar credenciais de admin

---

## 📝 NOTAS IMPORTANTES

### Decisões de Design

1. **Campos Nullable**: Mantidos para compatibilidade com dados legado
   - Order.userId (nullable)
   - Campaign.creatorId (nullable)
   - OrderMessage.senderId (nullable)
   - Podem ser tornados NOT NULL no futuro com Migration 2

2. **customerName Mantido**: Campo mantido em Order para histórico

3. **Sessão Persistente**: Refresh tokens duram 1 ano conforme solicitado
   - Risco de segurança mitigado por revogação manual
   - Usuário pode fazer logout de todos dispositivos

4. **Role System**: 3 níveis implementados
   - ADMIN: Acesso total, pode criar campanhas
   - CAMPAIGN_CREATOR: Pode criar e gerenciar suas campanhas
   - CUSTOMER: Pode fazer pedidos e ver suas informações

5. **Backward Compatibility**: Mantida para:
   - Pedidos antigos (Sistema user)
   - Mensagens antigas (campos legacy)
   - Campanhas antigas

### Segurança

✅ **Implementado**:
- Passwords hashed com bcrypt (10 rounds)
- JWT com secrets diferentes (access vs refresh)
- Tokens curtos para access (15min)
- Refresh tokens armazenados no banco
- Validação de email e senha
- Middleware de ownership para recursos
- CORS configurado

⚠️ **Pendente**:
- Rate limiting (prevenir brute force)
- HTTPS em produção
- Secrets fortes em produção
- 2FA (opcional)
- Password reset via email
- Account lockout após tentativas falhas

### Performance

- Indexes criados em:
  - User.email
  - User.googleId
  - Session.userId
  - Session.token
  - Session.expiresAt
  - Campaign.creatorId
  - Order.userId
  - OrderMessage.senderId
  - OrderMessage.[orderId, isRead]

---

## 📞 SUPORTE

Para dúvidas sobre esta implementação:
- Verificar este documento primeiro
- Consultar código nos arquivos mencionados
- Testar endpoints com os exemplos fornecidos

---

**Documento gerado em**: 25 de Novembro de 2025
**Versão**: 1.0
**Status**: Backend completo, Frontend pendente
