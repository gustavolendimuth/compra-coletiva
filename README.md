# Compra Coletiva

Sistema web profissional para gerenciamento de compras coletivas, desenvolvido com as melhores práticas de desenvolvimento.

---

## Funcionalidades

### Core Features
- **Gestão de Grupos**: Crie e gerencie múltiplos grupos de compra coletiva
- **Catálogo de Produtos**: Cadastre produtos com preço e peso
- **Controle de Pedidos**: Registre pedidos de clientes com múltiplos produtos
- **Cálculo Automático de Frete**: Frete distribuído proporcionalmente ao peso de cada pedido
- **Controle de Pagamentos**: Marque pedidos como pagos ou não pagos
- **Dashboard Analytics**: Visualize totais por produto, cliente e status de pagamento
- **Design Responsivo**: Interface moderna e adaptável para todos os dispositivos

### Authentication & Users
- **Autenticação**: Sistema completo de login com Google OAuth e email/senha
- **Google OAuth Avançado**: Account linking, soft-delete reactivation, email change handling
- **Usuários Legados**: Suporte para pedidos históricos pré-autenticação
- **Sessões Seguras**: JWT-based authentication com refresh tokens
- **Perfil de Usuário**: Edição de dados pessoais, avatar, telefone, senha
- **Troca de Email**: Fluxo de verificação com token enviado para novo email
- **Exclusão de Conta**: Soft delete com anonimização de dados (LGPD)
- **Exportação de Dados**: Conformidade com LGPD

### User Preferences & Notifications (NEW)
- **Preferências de Email**: Controle global e por tipo de notificação
- **Email Digest**: Opção de receber resumos diários/semanais (futuro)
- **Unsubscribe**: Link para cancelar inscrição diretamente nos emails
- **Notificações por Email**: Sistema de fila com Resend/Gmail, tracking de entregas

### Admin Panel (NEW)
- **Dashboard Administrativo**: Estatísticas de usuários, campanhas, pedidos, receita
- **Gestão de Usuários**: Listar, buscar, editar, banir/desbanir, deletar
- **Moderação de Campanhas**: Listar, arquivar/restaurar, deletar
- **Moderação de Mensagens**: Visualizar spam scores, filtrar, deletar
- **Logs de Auditoria**: Rastreamento completo de ações administrativas
- **Controle de Acesso**: Apenas usuários com role ADMIN

### Communication Systems
- **Chat de Pedidos**: Mensagens privadas entre cliente e criador da campanha
- **Q&A Público de Campanhas**: Sistema de perguntas e respostas públicas com:
  - Moderação de spam com pontuação inteligente (8 fatores)
  - Rate limiting para prevenir abuso
  - Edição de perguntas (janela de 15 minutos)
  - Sistema de reputação de usuários
- **Notificações em Tempo Real**: Alertas via Socket.IO para:
  - Campanhas prontas para enviar (todos pedidos pagos)
  - Mudanças de status de campanhas
  - Arquivamento automático de campanhas

### Automation (NEW)
- **Auto-arquivamento**: Campanhas são automaticamente arquivadas quando todos os pedidos estão pagos
- **Auto-reversão**: Campanhas arquivadas voltam para SENT se houver pagamentos pendentes
- **Notificações Automáticas**: Criadores são notificados quando campanha está pronta para envio

### Feedback & Support (NEW)
- **Sistema de Feedback**: Usuários podem reportar bugs, dar sugestões e feedback
- **Feedback Anônimo**: Opção de enviar feedback sem login (com email)
- **Gestão de Feedback**: API para administradores gerenciarem feedback

### Security
- **Proteção XSS**: Sanitização automática de conteúdo gerado por usuários
- **Rate Limiting**: Proteção contra spam e abuso
- **CORS Configurável**: Suporte a múltiplos domínios

## Stack Tecnológico

### Backend
- **Node.js** + **TypeScript**: Runtime e linguagem type-safe
- **Express**: Framework web minimalista e robusto
- **Prisma ORM**: ORM moderno com type-safety
- **PostgreSQL**: Banco de dados relacional
- **Redis**: Cache e fila de jobs (Bull)
- **Socket.IO**: Real-time bidirectional communication
- **Bull**: Sistema de fila para emails
- **Resend** + **Nodemailer**: Envio de emails transacionais
- **Zod**: Validação de schemas
- **Passport.js**: Autenticação (Local + Google OAuth com account linking)
- **JWT**: JSON Web Tokens para sessões
- **Jest** + **ts-jest**: Testing framework (55 tests, 100% success)

### Frontend
- **React 18** + **TypeScript**: Biblioteca UI com tipos
- **Next.js 14**: Framework React com App Router e SSR
- **TailwindCSS**: Framework CSS utility-first
- **React Query**: Gerenciamento de estado do servidor
- **Socket.IO Client**: Real-time updates
- **DOMPurify**: Sanitização XSS
- **Axios**: HTTP client
- **Lucide React**: Ícones modernos
- **React Hot Toast**: Notificações de UI
- **Vitest** + **React Testing Library**: Testing (608 tests, 100% success)

### DevOps
- **Docker** + **Docker Compose**: Containerização
- **Railway**: Platform para deploy em produção
- **GitHub Actions**: CI/CD com testes automáticos

## Estrutura do Projeto

```
compra-coletiva/
├── backend/                    # API Node.js
│   ├── prisma/
│   │   └── schema.prisma      # Schema do banco de dados
│   ├── src/
│   │   ├── routes/            # Rotas da API
│   │   ├── services/          # Lógica de negócio
│   │   ├── middleware/        # Middlewares Express
│   │   └── index.ts           # Entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # App React
│   ├── src/
│   │   ├── components/        # 90 componentes (ui/, features/, layout/, shared/)
│   │   ├── hooks/             # 6 custom hooks
│   │   │   ├── useCampaignDetail.ts (~828 linhas, consolidado)
│   │   │   ├── useOrderModal.ts (352 linhas, modal management)
│   │   │   ├── useOrderAutosave.ts (~113 linhas, simplificado)
│   │   │   └── ... (outros hooks)
│   │   ├── api/               # 13 serviços de API com tipos compartilhados
│   │   ├── pages/             # 54 páginas
│   │   ├── lib/               # Utilitários e API client
│   │   └── main.tsx           # Entry point
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml         # Orquestração de containers
├── Dockerfile.production      # Build otimizado para produção
├── railway.json               # Configuração Railway
└── README.md
```

## Como Executar Localmente

### Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 20+ (opcional, se quiser rodar fora do Docker)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd compra-coletiva
```

2. **Inicie os containers**
```bash
docker-compose up
```

Isso irá iniciar:
- PostgreSQL na porta `5432`
- Redis na porta `6379` (fila de emails)
- Backend na porta `3000`
- Frontend na porta `5173`

3. **Acesse a aplicação**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

### Primeira Execução

Na primeira vez, você precisa criar as tabelas do banco:

```bash
# Entre no container do backend
docker exec -it compra-coletiva-backend sh

# Execute as migrations
npx prisma migrate dev --name init

# (Opcional) Abra o Prisma Studio para visualizar os dados
npx prisma studio
```

## API Endpoints

### Autenticação (`/api/auth`)
- `POST /register` - Registrar novo usuário
- `POST /login` - Login com email/senha
- `POST /google` - Login com Google OAuth
- `GET /me` - Obter usuário atual
- `POST /logout` - Encerrar sessão

### Grupos (`/api/campaigns`)
- `GET /` - Lista todos os grupos
- `GET /:id` - Busca um grupo específico
- `POST /` - Cria novo grupo (auth requerida)
- `PATCH /:id` - Atualiza grupo (owner only)
- `DELETE /:id` - Remove grupo (owner only)

### Produtos (`/api/products`)
- `GET /?campaignId=xxx` - Lista produtos de um grupo
- `POST /` - Adiciona produto (auth requerida)
- `PATCH /:id` - Atualiza produto
- `DELETE /:id` - Remove produto

### Pedidos (`/api/orders`)
- `GET /?campaignId=xxx` - Lista pedidos de um grupo
- `POST /` - Cria pedido (auth requerida)
- `PATCH /:id` - Atualiza pedido
- `PATCH /:id/payment` - Alterna status de pagamento
- `DELETE /:id` - Remove pedido

### Mensagens de Campanhas (`/api/campaign-messages`) - NEW
- `GET /?campaignId=xxx` - Lista Q&As públicos (sem auth)
- `GET /mine?campaignId=xxx` - Minhas perguntas (auth requerida)
- `GET /unanswered?campaignId=xxx` - Não respondidas (criador only)
- `POST /` - Fazer pergunta (auth requerida, rate limited)
- `PATCH /:id` - Editar pergunta (janela de 15min)
- `PATCH /:id/answer` - Responder pergunta (criador only)
- `DELETE /:id` - Deletar spam (criador only)

### Feedback (`/api/feedback`) - NEW
- `POST /` - Enviar feedback (auth opcional)
- `GET /` - Listar todos (admin only)
- `GET /my` - Meus feedbacks (auth requerida)
- `GET /stats` - Estatísticas (admin only)
- `PATCH /:id` - Atualizar status (admin only)
- `DELETE /:id` - Deletar (admin only)

### Notificações (`/api/notifications`) - NEW
- `GET /` - Minhas notificações
- `PATCH /:id/read` - Marcar como lida
- `DELETE /:id` - Deletar notificação

### Analytics (`/api/analytics`)
- `GET /campaign/:campaignId` - Retorna estatísticas do grupo

### Validação (`/api/validation`)
- `GET /campaign/:campaignId` - Validar integridade financeira

### Perfil (`/api/profile`) - NEW
- `PATCH /` - Atualizar nome, telefone, senha
- `POST /avatar` - Upload de avatar (max 5MB, JPEG/PNG/WebP)
- `DELETE /avatar` - Deletar avatar
- `POST /change-email` - Solicitar troca de email (envia verificação)
- `POST /verify-email` - Confirmar troca de email com token
- `DELETE /` - Excluir conta (soft delete com anonimização)
- `GET /export` - Exportar dados do usuário (LGPD)

### Preferências de Email (`/api/email-preferences`) - NEW
- `GET /` - Obter preferências do usuário
- `PATCH /` - Atualizar preferências
- `POST /unsubscribe/:token` - Cancelar inscrição via email

### Admin (`/api/admin`) - NEW (apenas ADMIN role)
**Dashboard**:
- `GET /dashboard/stats` - Estatísticas (usuários, campanhas, pedidos, receita)

**Gestão de Usuários**:
- `GET /users` - Listar usuários (filtros: search, role, isBanned, page)
- `GET /users/:id` - Detalhes do usuário com estatísticas
- `PATCH /users/:id` - Editar usuário (nome, email, role)
- `POST /users/:id/ban` - Banir usuário
- `POST /users/:id/unban` - Desbanir usuário
- `DELETE /users/:id` - Deletar usuário (soft delete com anonimização)

**Moderação de Conteúdo**:
- `GET /content/campaigns` - Listar campanhas (filtros: search, status, page)
- `PATCH /content/campaigns/:id` - Arquivar/restaurar campanha
- `DELETE /content/campaigns/:id` - Deletar campanha
- `GET /content/messages` - Listar mensagens (filtro: minSpamScore, page)
- `DELETE /content/messages/:id` - Deletar mensagem

**Logs de Auditoria**:
- `GET /audit` - Listar logs de auditoria (filtros: action, targetType, page)

## Deploy no Railway

### Configuração

1. **Crie um novo projeto no Railway**
2. **Adicione um PostgreSQL database**
3. **Adicione um novo serviço a partir do repositório Git**
4. **Configure as variáveis de ambiente:**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
CORS_ORIGIN=https://seu-dominio.railway.app
```

5. **O Railway detectará automaticamente o `railway.json` e usará o Dockerfile de produção**

### Build e Deploy Automático

O Railway fará o build e deploy automaticamente a cada push para a branch principal.

## Desenvolvimento

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Prisma Studio (Visualizar Banco de Dados)

```bash
cd backend
npx prisma studio
```

Abre interface visual em http://localhost:5555

### Migrations

```bash
cd backend

# Criar nova migration
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations em produção
npx prisma migrate deploy

# Reset database (CUIDADO: apaga todos os dados)
npx prisma migrate reset
```

### Testes

```bash
# Rodar todos os testes
npm test

# Backend tests apenas
npm test --workspace=backend

# Frontend tests apenas
npm test --workspace=frontend

# Frontend com UI interativa
npm run test:ui --workspace=frontend

# Coverage reports
npm run test:coverage --workspace=frontend
npm run test:coverage --workspace=backend
```

**Estatísticas de Testes**:
- **Total**: 662 testes passando (607 frontend + 55 backend)
- **Taxa de sucesso**: 100%
- **Tempo de execução**: ~13 segundos
- **Coverage**: Campaign listing + Campaign Detail + UI components + Hooks (useOrderModal + useOrderAutosave) + Notifications + OAuth flow
- **Melhorias Recentes** (Dez 2025 - Jan 2026):
  - Jan 29: **Refatoração Phase 2** - Consolidação order modals
    - Removidas ~65 linhas duplicadas de useCampaignDetail (893→~828)
    - Simplificado useOrderAutosave (~113 linhas, removido skipNextSave)
    - Fixed bugs: produtos carregam, orders aparecem, autosave robusto
    - 24/24 testes useOrderModal (100%), 15/15 testes useOrderAutosave (100%)
  - Jan 7: Added 24 backend tests (Google OAuth + name formatter)
  - Dec 29: Added 42 notification tests (NotificationIcon + NotificationDropdown)
  - Dec 6: Fixed 34 failing tests (87% improvement in reliability)
  - Progression: 93.1% → 98.8% → 100%

## Funcionalidades Futuras (Roadmap)

- [ ] Autenticação e autorização de usuários
- [ ] Exportação de relatórios (PDF, Excel)
- [ ] Notificações por email
- [ ] Histórico de alterações
- [ ] Múltiplas formas de pagamento
- [ ] Integração com gateways de pagamento
- [ ] App mobile (React Native)
- [ ] Modo offline
- [ ] Temas customizáveis
- [ ] Suporte multi-idioma

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## Licença

MIT

## 📚 Documentação Adicional

### Deploy & Troubleshooting
- **[RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)** - Guia completo de deploy no Railway
- **[RAILWAY_QUICK_FIX.md](RAILWAY_QUICK_FIX.md)** - Solução rápida para erro CORS 502
- **[RAILWAY_DATABASE_FIX.md](RAILWAY_DATABASE_FIX.md)** - Fix para problemas de conexão com banco de dados
- **[RAILWAY_IMAGE_STORAGE_FIX.md](RAILWAY_IMAGE_STORAGE_FIX.md)** - Configurar S3 para imagens (recomendado para produção)
- **[RAILWAY_VOLUME_SETUP.md](RAILWAY_VOLUME_SETUP.md)** - Configurar volumes persistentes (alternativa ao S3)
- **[TROUBLESHOOT_RAILWAY.md](TROUBLESHOOT_RAILWAY.md)** - Troubleshooting detalhado Railway

### Configuração
- **[GOOGLE_OAUTH_RAILWAY.md](GOOGLE_OAUTH_RAILWAY.md)** - Configurar Google OAuth no Railway
- **[LEGAL_PAGES.md](LEGAL_PAGES.md)** - Documentação Política de Privacidade e Termos

### Desenvolvimento
- **[CLAUDE.md](CLAUDE.md)** - Guia completo para desenvolvimento (arquitetura, padrões, comandos, hooks)
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Guia de desenvolvimento detalhado (inclui sistema de modais de pedidos)

## Suporte

Para reportar bugs ou solicitar features, abra uma issue no repositório.
