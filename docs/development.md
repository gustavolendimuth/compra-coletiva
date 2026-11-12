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

## Preview de uma worktree
O `docker-compose.yml` só serve o código do checkout principal. Para ver no browser o que foi feito numa git worktree, rode a partir dela:

```bash
npm run preview:start     # sobe backend + frontend desta worktree em portas livres e mostra as URLs
npm run preview:stop      # derruba
npm run preview:reset-db  # apaga o banco do preview (o próximo start clona de novo)
```

- Reaproveita o postgres/redis do docker principal (sobe `db` e `redis` se estiverem parados).
- Banco próprio por worktree (`compra_coletiva_<worktree>`), clonado do `compra_coletiva` na primeira vez e migrado com as migrations da branch. O banco principal nunca é migrado.
- Copia `backend/.env` e `frontend/.env` do checkout principal se a worktree não tiver.
- Serve em `127.0.0.1` (não `localhost`) para o login não sobrescrever a sessão do docker principal.
- Emails desligados e fila no Redis db 1, separada da do docker principal.
- Login com Google não funciona no preview (o callback não está registrado no OAuth); use email/senha.
- Logs em `logs/preview-backend.log` e `logs/preview-frontend.log`.

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

## Lint
- Backend: `npm run lint --workspace=backend`

## Rodar sem Docker (opcional)
- Backend: `npm run dev --workspace=backend`
- Frontend: `npm run dev --workspace=frontend`
