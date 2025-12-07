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
- **Usuários Legados**: Suporte para pedidos históricos pré-autenticação
- **Sessões Seguras**: JWT-based authentication com refresh tokens

### Communication Systems (NEW)
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
- **Socket.IO**: Real-time bidirectional communication
- **Zod**: Validação de schemas
- **Passport.js**: Autenticação (Local + Google OAuth)
- **JWT**: JSON Web Tokens para sessões
- **Jest** + **ts-jest**: Testing framework (31 tests, 100% success)

### Frontend
- **React 18** + **TypeScript**: Biblioteca UI com tipos
- **Vite**: Build tool ultrarrápido
- **TailwindCSS**: Framework CSS utility-first
- **React Query**: Gerenciamento de estado do servidor
- **React Router**: Roteamento client-side
- **Socket.IO Client**: Real-time updates
- **DOMPurify**: Sanitização XSS
- **Axios**: HTTP client
- **Lucide React**: Ícones modernos
- **React Hot Toast**: Notificações de UI
- **Vitest** + **React Testing Library**: Testing (565 tests, 98.8% success)

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
│   │   ├── components/        # Componentes reutilizáveis
│   │   ├── pages/             # Páginas da aplicação
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
- **Total**: 596 testes passando (565 frontend + 31 backend), 5 failing
- **Taxa de sucesso**: 98.8% (87% improvement!)
- **Tempo de execução**: ~13 segundos
- **Coverage**: Campaign listing + Campaign Detail + UI components + Hooks
- **Melhoria Recente** (Dez 2025):
  - Before: 39 failing tests (93.1% success)
  - After: 5 failing tests (98.8% success)
  - Fixed: 34 tests across 9 components

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

## Suporte

Para reportar bugs ou solicitar features, abra uma issue no repositório.
