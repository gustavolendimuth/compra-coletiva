# Desenvolvimento

Guia curto para rodar o projeto localmente e executar tarefas comuns.

## Pré-requisitos
- Docker e Docker Compose
- Node.js 20+ (opcional, se rodar fora do Docker)

## Subir ambiente local (Docker)
```bash
docker-compose up
```

Serviços e portas:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Prisma Studio: http://localhost:5555
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Hot reload
O `docker-compose.yml` já está configurado com polling para o hot reload do backend (`tsx watch`) e frontend (Next.js Fast Refresh).

## Comandos úteis
- Ver logs: `docker-compose logs -f`
- Reiniciar serviços: `docker-compose restart`
- Rebuild após mudar dependências: `docker-compose down` + `docker-compose up --build`
- Executar comandos no backend: `docker-compose exec backend <comando>`
- Executar comandos no frontend: `docker-compose exec frontend <comando>`

## Prisma e banco
- Criar migration local: `docker-compose exec backend npx prisma migrate dev --name <nome>`
- Aplicar migrations: `docker-compose exec backend npx prisma migrate deploy`
- Gerar client: `docker-compose exec backend npx prisma generate`
- Prisma Studio: `docker-compose exec backend npx prisma studio`

## Migrations pendentes
Se existir conteúdo em `backend/prisma/migrations_pending`, mova as pastas para `backend/prisma/migrations` e execute:
- `docker-compose exec backend npx prisma migrate deploy`
- `docker-compose exec backend npx prisma generate`

## Scripts úteis
- Migração de usuários legados: `docker-compose exec backend node scripts/fix-legacy-users.js`
- Resolver migrations falhadas (Railway): `docker-compose exec backend sh scripts/fix-railway-migrations.sh`

## Testes
- Backend: `npm test --workspace=backend`
- Frontend: `npm test --workspace=frontend`
- Todos: `npm test --workspaces`

## Rodar sem Docker (opcional)
- Backend: `npm run dev --workspace=backend`
- Frontend: `npm run dev --workspace=frontend`
