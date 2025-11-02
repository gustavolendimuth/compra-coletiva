# Compra Coletiva

Sistema web profissional para gerenciamento de compras coletivas, desenvolvido com as melhores práticas de desenvolvimento.

## Funcionalidades

- **Gestão de Grupos**: Crie e gerencie múltiplos grupos de compra coletiva
- **Catálogo de Produtos**: Cadastre produtos com preço e peso
- **Controle de Pedidos**: Registre pedidos de clientes com múltiplos produtos
- **Cálculo Automático de Frete**: Frete distribuído proporcionalmente ao peso de cada pedido
- **Controle de Pagamentos**: Marque pedidos como pagos ou não pagos
- **Dashboard Analytics**: Visualize totais por produto, cliente e status de pagamento
- **Design Responsivo**: Interface moderna e adaptável para todos os dispositivos

## Stack Tecnológico

### Backend
- **Node.js** + **TypeScript**: Runtime e linguagem type-safe
- **Express**: Framework web minimalista e robusto
- **Prisma ORM**: ORM moderno com type-safety
- **PostgreSQL**: Banco de dados relacional
- **Zod**: Validação de schemas

### Frontend
- **React 18** + **TypeScript**: Biblioteca UI com tipos
- **Vite**: Build tool ultrarrápido
- **TailwindCSS**: Framework CSS utility-first
- **React Query**: Gerenciamento de estado do servidor
- **React Router**: Roteamento client-side
- **Lucide React**: Ícones modernos

### DevOps
- **Docker** + **Docker Compose**: Containerização
- **Railway**: Platform para deploy em produção

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

### Grupos
- `GET /api/campaigns` - Lista todos os grupos
- `GET /api/campaigns/:id` - Busca um grupo específico
- `POST /api/campaigns` - Cria novo grupo
- `PATCH /api/campaigns/:id` - Atualiza grupo
- `DELETE /api/campaigns/:id` - Remove grupo

### Produtos
- `GET /api/products?campaignId=xxx` - Lista produtos de um grupo
- `POST /api/products` - Adiciona produto
- `PATCH /api/products/:id` - Atualiza produto
- `DELETE /api/products/:id` - Remove produto

### Pedidos
- `GET /api/orders?campaignId=xxx` - Lista pedidos de um grupo
- `POST /api/orders` - Cria pedido
- `PATCH /api/orders/:id` - Atualiza pedido
- `DELETE /api/orders/:id` - Remove pedido

### Analytics
- `GET /api/analytics/campaign/:campaignId` - Retorna estatísticas do grupo

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
