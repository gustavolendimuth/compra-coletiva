# Guia de Desenvolvimento

Este documento contém informações específicas para desenvolvimento local.

## Hot Reload Configurado ✅

O projeto está configurado com hot reload completo para desenvolvimento:

### Backend (tsx watch)
- **File watching**: Configurado via `CHOKIDAR_USEPOLLING=true`
- **Volume mapping**: Código local sincronizado com container
- Qualquer mudança em `backend/src/**/*.ts` recarrega automaticamente

### Frontend (Next.js Fast Refresh)
- **Fast Refresh**: Ativado por padrão no Next.js
- **Polling**: Configurado via `WATCHPACK_POLLING=true` no docker-compose.yml
- Mudanças em componentes React atualizam instantaneamente no browser

## Como Funciona

### Volumes do Docker Compose

```yaml
volumes:
  - ./backend:/app          # Mapeia código local -> container
  - /app/node_modules       # Previne conflito com node_modules
  - /app/dist               # Ignora diretório de build
```

### Variáveis de Ambiente

```yaml
CHOKIDAR_USEPOLLING: "true"   # Força polling para detectar mudanças
WATCHPACK_POLLING: "true"     # Alternativa para webpack-based tools
```

## Testando Hot Reload

### Backend

1. Com o Docker rodando, edite qualquer arquivo em `backend/src/`
2. Salve o arquivo
3. Observe o log do container backend recarregando:
   ```
   compra-coletiva-backend | [tsx] restarting due to changes...
   compra-coletiva-backend | 🚀 Server running on port 3000
   ```

### Frontend

1. Com o Docker rodando, edite qualquer arquivo em `frontend/src/`
2. Salve o arquivo
3. O browser atualiza automaticamente (sem refresh completo)
4. Observe no log:
   ```
   compra-coletiva-frontend | ○ Compiling /...
   ```

## Comandos Úteis

### Reiniciar Containers (sem rebuild)
```bash
docker-compose restart
```

### Rebuild Completo (após mudanças em package.json)
```bash
docker-compose down
docker-compose up --build
```

### Ver Logs em Tempo Real
```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend
```

### Executar Comandos nos Containers

```bash
# Backend - Instalar nova dependência
docker-compose exec backend npm install <pacote>

# Frontend - Instalar nova dependência
docker-compose exec frontend npm install <pacote>

# Backend - Prisma Studio
docker-compose exec backend npx prisma studio

# Backend - Criar migration
docker-compose exec backend npx prisma migrate dev --name <nome>
```

## Troubleshooting

### Hot Reload Não Funciona

**Problema**: Mudanças no código não são detectadas

**Soluções**:

1. **Verifique os logs** para erros:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **Reinicie os containers**:
   ```bash
   docker-compose restart
   ```

3. **Rebuild se necessário**:
   ```bash
   docker-compose up --build
   ```

4. **Verifique permissões de arquivo** (Linux/Mac):
   ```bash
   ls -la backend/src
   ls -la frontend/src
   ```

### Mudanças em package.json

Quando você adiciona/remove dependências:

```bash
# Para os containers
docker-compose down

# Rebuild
docker-compose up --build
```

### Performance Lenta

Se o hot reload estiver lento, pode ser devido ao polling:

**Opção 1**: Ajustar polling do Watchpack (frontend)

Edite `docker-compose.yml` na seção do frontend:
```yaml
environment:
  WATCHPACK_POLLING: "true"  # Necessário para Docker no Windows/Mac
```

**Opção 2**: Usar host networking (apenas Linux)

Edite `docker-compose.yml`:
```yaml
backend:
  network_mode: "host"
  # Remove ports mapping quando usar host mode
```

## Estrutura de Desenvolvimento

```
compra-coletiva/
├── backend/
│   ├── src/              # ✏️ Edite aqui - hot reload ativo
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma # ✏️ Edite e rode migrate
│   └── package.json
├── frontend/
│   ├── src/              # ✏️ Edite aqui - HMR ativo
│   │   ├── components/
│   │   │   ├── ui/       # Primitivos reutilizáveis
│   │   │   ├── features/ # Componentes específicos de feature
│   │   │   ├── layout/   # Layout components
│   │   │   └── shared/   # Componentes de negócio compartilhados
│   │   ├── hooks/        # Custom React hooks (6 hooks)
│   │   │   ├── useCampaignDetail.ts       (~828 linhas)
│   │   │   ├── useCampaignQuestions.ts
│   │   │   ├── useCampaignChat.ts
│   │   │   ├── useOrderChat.ts
│   │   │   ├── useOrderModal.ts           (352 linhas) ⭐
│   │   │   └── useOrderAutosave.ts        (~113 linhas) ⭐
│   │   ├── api/          # API services (13 serviços)
│   │   │   ├── config.ts
│   │   │   ├── types.ts  # Tipos compartilhados (OrderForm, OrderFormItem)
│   │   │   ├── client.ts
│   │   │   └── services/ # Domain services
│   │   ├── app/          # Next.js App Router (layouts, pages)
│   │   └── lib/
│   └── package.json
└── docker-compose.yml
```

## Workflow Recomendado

1. **Inicie os containers**:
   ```bash
   docker-compose up
   ```

2. **Abra seu editor** (VSCode, etc.)

3. **Edite código** normalmente

4. **Observe mudanças** aplicadas automaticamente:
   - Backend: Container reinicia
   - Frontend: Browser atualiza via HMR

5. **Após adicionar dependências**:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

## Dicas de Produtividade

### VSCode

Instale extensões úteis:
- Prisma (syntax highlighting)
- ESLint
- Prettier
- TailwindCSS IntelliSense
- Docker

### Terminal Integrado

Configure múltiplos terminais:
1. Terminal 1: `docker-compose up` (logs)
2. Terminal 2: Comandos avulsos (prisma, npm, etc)
3. Terminal 3: Git

### Debugging

Para debug do backend com breakpoints:

1. Adicione ao `backend/package.json`:
```json
"scripts": {
  "dev:debug": "tsx watch --inspect=0.0.0.0:9229 src/index.ts"
}
```

2. Atualize `docker-compose.yml`:
```yaml
backend:
  command: npm run dev:debug
  ports:
    - "3000:3000"
    - "9229:9229"  # Debug port
```

3. Configure VSCode launch.json:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}/backend",
  "remoteRoot": "/app"
}
```

## Performance Tips

- **Exclua node_modules** do seu editor de busca
- **Use .dockerignore** para evitar copiar arquivos desnecessários
- **Limite logs** se forem muito verbosos
- **Use Docker Desktop** para monitorar recursos

## Funcionalidades Implementadas

### Sistema de Modais de Pedidos (Order Modals) ⭐ NEW - Jan 2026

**Arquitetura Modular:**

Sistema refatorado em 2 fases para separar responsabilidades, eliminar bugs e simplificar código:

**Fase 1 (Early Jan 2026)**: Extração inicial
- Criados useOrderModal (352 linhas) e useOrderAutosave (118 linhas)
- Removidas ~237 linhas de useCampaignDetail (1130→893)

**Fase 2 (Jan 29, 2026)**: Consolidação e simplificação
- Removidas ~65 linhas adicionais de useCampaignDetail (893→~828)
- Simplificado useOrderAutosave (~113 linhas, removido skipNextSave)
- Total removido: ~302 linhas de useCampaignDetail

**1. useOrderModal Hook (352 linhas)**
- **Responsabilidade**: Gerenciamento de estado dos modais e operações CRUD
- **Estados**: 3 modais (edit, view, payment), 3 orders (editing, viewing, payment)
- **Operações**: create, update, delete orders com React Query mutations
- **Features**:
  - Atalhos de teclado (Ctrl/Cmd+S para salvar)
  - Integração com autosave
  - Validação de autenticação com `requireAuth`
  - Helper `closeEditOrderModal` para limpeza adequada do form

**2. useOrderAutosave Hook (~113 linhas)**
- **Responsabilidade**: Salvamento automático de mudanças
- **Features**:
  - Debounce de 2 segundos
  - Snapshot inicial para evitar saves desnecessários
  - Estado de autosave (isAutosaving, lastSaved)
  - Implementação simplificada (removido mecanismo skipNextSave)

**3. Tipos Compartilhados (api/types.ts)**
- `OrderForm`: Formulário completo com campaignId
- `OrderFormItem`: Item individual (productId, quantity, product?)

**Uso no useCampaignDetail:**
```typescript
const orderModal = useOrderModal({
  orders,
  campaignId,
  user,
  isActive,
  requireAuth,
});

// Acessar estados
const { isEditOrderModalOpen, editOrderForm } = orderModal;

// Acessar handlers
const { handleAddToOrder, handleEditOrder, closeEditOrderModal } = orderModal;

// Acessar autosave
const { isAutosaving, lastSaved } = orderModal.autosave;
```

**Benefícios da Refatoração:**
- ✅ Removido ~302 linhas totais de useCampaignDetail (1130→~828 linhas)
- ✅ Eliminados bugs de stale closure
- ✅ Código duplicado removido (handleEditOrderFromView, skipNextSave)
- ✅ **Bug Fix**: Produtos agora carregam corretamente no dropdown
- ✅ **Bug Fix**: Pedidos existentes aparecem e carregam corretamente
- ✅ **Bug Fix**: Autosave mais robusto previne perda de dados
- ✅ Testabilidade melhorada (24 testes useOrderModal, 15 testes useOrderAutosave)
- ✅ Separação clara de responsabilidades
- ✅ Abordagem mais segura: handleAddToOrder atualiza backend primeiro, depois abre modal

### Sistema de Autenticação

**Login/Registro:**
- Login com email/senha
- Google OAuth 2.0 com recursos avançados:
  - Account linking (vincular Google a conta existente)
  - Soft-delete reactivation (recuperar conta deletada)
  - Email change handling (googleId como identificador primário)
  - Non-blocking email queue (OAuth sempre sucede)
- Sistema de sessões com JWT
- Proteção de rotas (middleware)
- Suporte a usuários legados (virtual users)

**Reset de Senha:**
- Token de recuperação via email
- Validação de token com expiração
- Interface de redefinição de senha

**Google OAuth Flow Details:**
- Lookup por googleId primeiro (evita problemas com email)
- Reativa contas soft-deleted automaticamente
- Vincula Google a contas email/password existentes
- Testa com 13 testes de documentação (passport.test.ts)

### Sistema de Feedback (NEW - Dec 2025)

**Para Usuários:**
- Botão flutuante em todas as páginas
- Modal de envio com tipos: Bug, Sugestão, Melhoria, Outro
- Feedback anônimo (com email) ou autenticado
- Link direto por email no rodapé
- Componente: `FeedbackModal.tsx`

**Para Administradores (API):**

```bash
# Listar feedbacks
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/feedback?status=PENDING

# Estatísticas
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/feedback/stats

# Atualizar status
curl -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS", "adminNotes": "Investigando"}' \
  http://localhost:3000/api/feedback/FEEDBACK_ID
```

Status disponíveis: `PENDING`, `IN_PROGRESS`, `RESOLVED`, `DISMISSED`

### Menu Mobile

- Menu full-screen com animações suaves
- Acessibilidade completa (ARIA labels, keyboard navigation)
- Backdrop com blur effect
- Componentes modulares (HamburgerButton, MobileMenu)

### Chat de Pedidos (Order Messages)

- Mensagens privadas entre cliente e criador da campanha
- Sistema de leitura/não lida
- Contador de mensagens não lidas
- Notificações em tempo real (Socket.IO)
- Componente: `OrderChat.tsx`

### Chat de Campanhas - Q&A Público (NEW - Dec 2025)

**Para Usuários:**
- Perguntas públicas visíveis a todos após resposta
- Edição de perguntas (janela de 15 minutos, apenas não respondidas)
- Visualização de suas próprias perguntas (respondidas e não respondidas)
- Interface com contador de caracteres (1000 para perguntas)
- Componente: `CampaignChat.tsx`

**Para Criadores:**
- Painel de moderação com abas (Pendentes/Respondidas)
- Visualização de spam score e fatores de risco
- Informações do remetente (idade da conta, pedidos na campanha)
- Resposta com auto-publicação (2000 caracteres)
- Opção de deletar spam
- Desktop notifications para novas perguntas
- Componente: `CampaignQuestionsPanel.tsx`

**Sistema Anti-Spam:**
- Pontuação 0-100 baseada em 8 fatores:
  1. URLs na mensagem (até 30 pontos)
  2. Maiúsculas excessivas (20 pontos)
  3. Caracteres repetidos (até 15 pontos)
  4. Conta nova (<24h) (15 pontos)
  5. Sem pedidos na campanha (10 pontos)
  6. Histórico de spam (20 pontos)
  7. Mensagens não respondidas (até 15 pontos)
  8. Palavras proibidas (30 pontos)

**Rate Limiting:**
- Global: 10 mensagens por hora
- Por campanha: 1 mensagem a cada 2 minutos
- Burst: 3 mensagens por minuto
- Retry-after calculado automaticamente

**Reputação de Usuários:**
- `messageCount`: Total de perguntas feitas
- `answeredCount`: Total de respostas dadas (criadores)
- `spamScore`: Pontuação de risco (0-100)
- `isBanned`: Flag para banir usuários
- Score reduzido quando perguntas são respondidas

### Sistema de Notificações (NEW - Dec 2025)

**Tipos de Notificações:**
- `CAMPAIGN_READY_TO_SEND`: Todos os pedidos pagos, pronto para enviar ao fornecedor
- `CAMPAIGN_STATUS_CHANGED`: Status da campanha alterado
- `CAMPAIGN_ARCHIVED`: Campanha arquivada automaticamente

**Funcionalidades:**
- Notificações em tempo real via Socket.IO
- Contador visual de não lidas
- Metadata com detalhes (campaignId, campaignName)
- Marcar como lida e deletar
- Auto-criação quando condições atendidas

**Triggers Automáticos:**
- Campanha CLOSED + todos pedidos pagos → notificação READY_TO_SEND
- Campanha SENT + todos pedidos pagos → auto-archive + notificação CAMPAIGN_ARCHIVED
- Campanha ARCHIVED + pedido não pago → auto-unarchive + notificação STATUS_CHANGED

### Automação de Status de Campanhas (NEW - Dec 2025)

**CampaignStatusService:**
- Auto-arquivamento: SENT → ARCHIVED quando todos os pedidos estão pagos
- Auto-reversão: ARCHIVED → SENT quando algum pedido é marcado como não pago
- Emite eventos Socket.IO para notificar clientes conectados
- Integrado com NotificationService

**Condições de Arquivamento:**
1. Status deve ser SENT
2. Pelo menos 1 pedido na campanha
3. TODOS os pedidos marcados como pagos (`isPaid = true`)

**Condições de Reversão:**
1. Status deve ser ARCHIVED
2. Pelo menos 1 pedido na campanha
3. PELO MENOS UM pedido não pago (`isPaid = false`)

### Sistema de Perfil de Usuário (NEW - Jan 2026)

**Funcionalidades:**
- Edição de nome, telefone e senha
- Upload de avatar (max 5MB, JPEG/PNG/WebP, usa ImageUploadService)
- Troca de email com verificação:
  - Token enviado para NOVO email
  - Usuário confirma via link
  - Email antigo é notificado
  - Token expira em 24h
- Soft delete de conta:
  - Anonimização de dados (nome="Usuário Excluído", email=random@deleted.local)
  - Define `deletedAt` timestamp
  - Invalida todas as sessões
  - Mantém pedidos para integridade
- Exportação de dados (LGPD compliance)

**Rotas:**
```bash
# Atualizar perfil
PATCH /api/profile
{
  "name": "Novo Nome",
  "phone": "11987654321",
  "password": "novasenha123"
}

# Upload de avatar
POST /api/profile/avatar
(multipart/form-data com arquivo)

# Deletar avatar
DELETE /api/profile/avatar

# Solicitar troca de email
POST /api/profile/change-email
{
  "newEmail": "novoemail@exemplo.com"
}

# Confirmar troca de email
POST /api/profile/verify-email
{
  "token": "token-recebido-no-email"
}

# Excluir conta
DELETE /api/profile
{
  "reason": "Motivo opcional"
}

# Exportar dados
GET /api/profile/export
```

**Componentes:**
- `frontend/src/pages/Profile.tsx` - Página principal
- `frontend/src/pages/profile/` - Sub-componentes (ProfileHeader, ProfileForm, PasswordSection, EmailSection, AvatarUpload, DeleteAccountSection)
- `frontend/src/components/ui/Avatar.tsx` - Avatar com fallback para iniciais
- `frontend/src/pages/CompleteProfile.tsx` - Completar perfil após OAuth
- `frontend/src/pages/VerifyEmailChange.tsx` - Verificar troca de email

**Fluxo OAuth Completion:**
- Usuários OAuth (Google) são redirecionados para `/complete-profile`
- Devem informar telefone obrigatoriamente
- `phoneCompleted` flag controla acesso via `ProtectedRoute`

### Sistema de Preferências de Email (NEW - Jan 2026)

**Funcionalidades:**
- Opt-out global de emails
- Preferências por tipo de notificação:
  - Campaign Ready to Send
  - Campaign Status Changed
  - Campaign Archived
  - New Message
- Configurações de digest (REALTIME, DAILY, WEEKLY)
- Link de unsubscribe em todos os emails
- Sistema de fila com Bull + Redis
- Tracking de entregas (sent, failed, opened, clicked, bounced)
- Integração com Resend e Gmail

**Rotas:**
```bash
# Obter preferências
GET /api/email-preferences

# Atualizar preferências
PATCH /api/email-preferences
{
  "emailEnabled": true,
  "campaignReadyToSend": true,
  "campaignStatusChanged": false,
  "digestEnabled": true,
  "digestFrequency": "DAILY"
}

# Unsubscribe via email link
POST /api/email-preferences/unsubscribe/:token
```

**Arquitetura de Email:**
- `backend/src/services/email/emailQueue.ts` - Bull queue para envios assíncronos
- `backend/src/services/email/emailWorker.ts` - Worker que processa fila
- `backend/src/services/email/templates/` - Templates de email
- `backend/src/services/email/notificationEmailService.ts` - Serviço de envio
- `backend/src/config/email.ts` - Configuração (Resend/Gmail)

**Tabelas de Banco:**
- `EmailPreference` - Preferências do usuário
- `EmailLog` - Log de emails enviados com status e tracking

### Painel Administrativo (NEW - Jan 2026)

**Funcionalidades:**
- Dashboard com estatísticas (usuários, campanhas, pedidos, receita)
- Gestão de usuários:
  - Listar com filtros (search, role, isBanned)
  - Ver detalhes (avatar, stats, campanhas, pedidos)
  - Editar (nome, email, role)
  - Banir/desbanir
  - Deletar (soft delete com anonimização)
- Moderação de campanhas:
  - Listar com filtros (search, status)
  - Arquivar/restaurar
  - Deletar
- Moderação de mensagens:
  - Filtrar por spam score
  - Visualizar detalhes de spam
  - Deletar
- Logs de auditoria:
  - Rastreamento completo de ações admin
  - Filtros por ação, tipo, data
  - IP address + user agent tracking

**Rotas Admin:**
```bash
# Dashboard
GET /api/admin/dashboard/stats

# Usuários
GET /api/admin/users?page=1&search=nome&role=ADMIN
GET /api/admin/users/:id
PATCH /api/admin/users/:id
POST /api/admin/users/:id/ban
POST /api/admin/users/:id/unban
DELETE /api/admin/users/:id

# Campanhas
GET /api/admin/content/campaigns?page=1&search=nome&status=ACTIVE
PATCH /api/admin/content/campaigns/:id
DELETE /api/admin/content/campaigns/:id

# Mensagens
GET /api/admin/content/messages?page=1&minSpamScore=50
DELETE /api/admin/content/messages/:id

# Auditoria
GET /api/admin/audit?page=1&action=USER_VIEW&targetType=USER
```

**Componentes:**
- `frontend/src/pages/admin/AdminLayout.tsx` - Layout com sidebar
- `frontend/src/pages/admin/Dashboard.tsx` - Dashboard de estatísticas
- `frontend/src/pages/admin/Users.tsx` - Lista de usuários
- `frontend/src/pages/admin/UserDetail.tsx` - Detalhes do usuário
- `frontend/src/pages/admin/Campaigns.tsx` - Moderação de campanhas
- `frontend/src/pages/admin/Messages.tsx` - Moderação de mensagens
- `frontend/src/pages/admin/Audit.tsx` - Logs de auditoria
- `frontend/src/components/AdminRoute.tsx` - Proteção de rota (role='ADMIN')

**Middleware:**
- `backend/src/middleware/adminMiddleware.ts` - Combina requireAuth + requireRole('ADMIN') + auto audit logging
- Todas as ações admin são automaticamente logadas na tabela AuditLog

**Tabelas de Banco:**
- `AuditLog` - Registros de ações administrativas
  - Campos: adminId, action, targetType, targetId, details (JSON), ipAddress, userAgent
  - Ações: USER_*, CAMPAIGN_*, MESSAGE_*, AUDIT_*, SYSTEM_*, SETTINGS_*
  - Targets: USER, CAMPAIGN, ORDER, MESSAGE, FEEDBACK, SYSTEM

### Segurança XSS (NEW - Dec 2025)

**Sanitização de Conteúdo:**
- Utility: `frontend/src/lib/sanitize.ts`
- Usa DOMPurify para prevenir XSS attacks
- Funções:
  - `sanitizeText(text)`: Escapa HTML, preserva quebras de linha
  - `sanitizeHtml(html)`: Permite apenas tags seguras (b, i, em, strong, u, br, p, span)

**Aplicado em:**
- Mensagens de campanhas (perguntas e respostas)
- Mensagens de pedidos
- Descrições de campanhas/produtos
- Feedback de usuários

### Real-Time Features (Socket.IO)

**Eventos Disponíveis:**
- `campaign-question-received`: Nova pergunta em campanha
- `campaign-message-published`: Pergunta respondida e publicada
- `campaign-message-edited`: Pergunta editada
- `campaign-message-deleted`: Pergunta deletada (spam)
- `campaign-updated`: Status de campanha alterado
- `notification-created`: Nova notificação para usuário
- `order-chat-message`: Mensagem privada em pedido

**Rooms:**
- `user:{userId}`: Notificações específicas do usuário
- `campaign:{campaignId}`: Updates de campanha específica
- `order:{orderId}`: Chat de pedido específico

## Sistema de Testes (IMPLEMENTADO ✅)

### Frontend (Vitest + React Testing Library)

**Infraestrutura**:
- Vitest 4.0.15 + React Testing Library
- Setup global em `frontend/src/__tests__/setup.ts`
- Mock data factories em `frontend/src/__tests__/mock-data.ts`

**Cobertura Atual**:
- 607 testes passando (100% success)
- 50+ arquivos de teste
- Tempo de execução: ~13 segundos
- Campaign listing: 100% coberto
- Campaign Detail: 98% coberto
- Notifications: 100% coberto
- useOrderModal hook: 100% coberto (24/24 tests)
- useOrderAutosave hook: 100% coberto (15/15 tests, simplificado de 16 testes)

**Principais Arquivos de Teste**:
1. `src/__tests__/mock-data.ts` - Factories para dados mock
2. Campaign listing (8 arquivos) - 164 testes
3. Campaign Detail (15+ arquivos) - 400+ testes
4. Notifications (2 arquivos) - 42 testes
   - `src/components/__tests__/NotificationIcon.test.tsx` - 15 testes
   - `src/components/__tests__/NotificationDropdown.test.tsx` - 27 testes
5. useOrderModal hook - 24 testes (100% coverage)
   - `src/hooks/__tests__/useOrderModal.test.ts` - Modal state, CRUD, autosave
6. UI Components - 50+ testes

**Comandos**:
```bash
npm test --workspace=frontend              # Rodar testes
npm run test:ui --workspace=frontend       # UI interativa
npm run test:coverage --workspace=frontend # Relatório de cobertura
```

**Mock Data Factories**:
```typescript
import { createMockCampaign, mockActiveCampaign } from '@/tests/mock-data';

const campaign = createMockCampaign({ status: 'ACTIVE' });
const campaigns = [mockActiveCampaign, mockClosedCampaign];
```

### Backend (Jest + ts-jest)

**Infraestrutura**:
- Jest 29.7.0 + ts-jest
- Setup global em `backend/src/__tests__/setup.ts`

**Cobertura Atual**:
- 55 testes passando
- 3 arquivos de teste
- Tempo de execução: <1 segundo
- Money utility: 100% coverage
- Name formatter: 100% coverage
- Google OAuth: Complete documentation

**Arquivos de Teste**:
1. `src/utils/money.test.ts` - 31 testes (cálculos financeiros críticos)
2. `src/utils/nameFormatter.test.ts` - 11 testes (capitalização de nomes)
3. `src/config/passport.test.ts` - 13 testes (documentação do fluxo OAuth)

**Comandos**:
```bash
npm test --workspace=backend              # Rodar testes
npm run test:coverage --workspace=backend # Relatório de cobertura
```

### Estatísticas Totais

- **662 testes passando** (607 frontend + 55 backend)
- **50+ arquivos de teste**
- **100% taxa de sucesso**
- **~13 segundos** tempo total de execução

### Padrões de Teste Estabelecidos

1. **Factory Pattern**: Dados mock consistentes
2. **AAA Pattern**: Arrange, Act, Assert
3. **Mobile-First Testing**: Testes responsivos
4. **Accessibility Testing**: ARIA, keyboard navigation
5. **Edge Cases**: Estados vazios, erros, dados faltando

## Próximos Passos

- Configure ESLint + Prettier para code quality
- ✅ ~~Adicione testes automatizados (Jest/Vitest)~~ - COMPLETO
- ✅ ~~Configure CI/CD pipeline~~ - GitHub Actions configurado
- ✅ ~~Interface web de admin para gerenciar feedbacks visualmente~~ - COMPLETO (Painel Admin)
- ✅ ~~Email notifications para perguntas respondidas~~ - COMPLETO (Sistema de Email)
- ✅ ~~Sistema de perfil de usuário~~ - COMPLETO (Profile + Avatar)
- ✅ ~~Preferências de email~~ - COMPLETO (EmailPreferences)
- Adicione pre-commit hooks (Husky)
- **Expandir testes**: Admin pages, profile pages, email system
- **Pagination** para lista de mensagens/notificações
- **Push notifications** (web/mobile)
- **E2E tests** com Playwright
- **Visual regression testing**
