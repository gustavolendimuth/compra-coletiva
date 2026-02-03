# Compra Coletiva

Sistema web para organizar compras coletivas com campanhas, pedidos, pagamentos e comunicação entre participantes.

## Principais recursos
- Gestão de campanhas e produtos
- Pedidos com cálculo automático de frete por peso
- Autenticação com email/senha e Google OAuth
- Chat e perguntas públicas por campanha
- Notificações em tempo real
- Painel administrativo e auditoria
- Preferências de email e fila de envio

## Stack
- Backend: Node.js, TypeScript, Express, Prisma, PostgreSQL, Redis, Socket.IO
- Frontend: Next.js, React, TypeScript, TailwindCSS, React Query
- DevOps: Docker, Railway

## Estrutura
```
compra-coletiva/
├── backend/
├── frontend/
├── docker-compose.yml
└── railway.json
```

## Quickstart local (Docker)
```bash
docker-compose up
```

Serviços e portas:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Prisma Studio: http://localhost:5555
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Comandos úteis
```bash
# Subir ambiente
npm run dev

# Rodar testes
npm test --workspace=backend
npm test --workspace=frontend
```

## Documentação
- `docs/development.md`
- `docs/deployment.md`
- `docs/features.md`

## Licença
MIT
