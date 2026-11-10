# CLAUDE.md

Guia curto para assistentes que atuam neste repositório.

## Documentation Rules

- Crie e mantenha docs em `docs/`; evite novos `.md` na raiz, exceto `README.md`, `AGENTS.md` e `CLAUDE.md`.
- Antes de criar um novo doc, procure conteúdo existente e atualize o arquivo correto para evitar duplicação.
- Mantenha `README.md` curto (visão geral + quickstart + links). Detalhes vão para `docs/`.
- Evite informações voláteis: contagens de arquivos/testes, datas, linhas, logs e listas longas de arquivos/funções.
- Quando adicionar/remover/renomear docs, atualize os links em `README.md`.
- Prefira linguagem objetiva e tópicos estáveis; use exemplos apenas quando necessários.

## Project Structure & Module Organization

- Monorepo with npm workspaces: `backend/` (Express + Prisma + Socket.IO) and `frontend/` (Next.js + React).
- Backend source: `backend/src`, Prisma schema/migrations: `backend/prisma`, uploads: `backend/uploads`, build output: `backend/dist`.
- Frontend source: `frontend/src`, App Router in `frontend/src/app`, UI modules in `frontend/src/components` (`ui/`, `features/`, `layout/`, `shared/`), assets in `frontend/public`.

## Build, Test, and Development Commands

```bash
# Docker-based local dev
docker-compose up

# Workspace dev servers
npm run dev --workspace=backend
npm run dev --workspace=frontend

# Build all workspaces
npm run build

# Tests
npm test --workspace=backend
npm test --workspace=frontend
```

## Coding Style & Naming Conventions

- TypeScript throughout, 2-space indent, double quotes, semicolons.
- Components: PascalCase. Hooks: `useX`. Services: `*.service.ts`. Tests: `*.test.ts(x)`.

## Testing changes in a worktree

- Toda alteração ou feature que tocar o frontend termina com teste no browser: depois de implementar, abra as telas afetadas e confira o fluxo de verdade antes de dar o trabalho por concluído. Testes automatizados não substituem esse passo.
- Sempre que for testar no browser trabalhando numa worktree, suba o app com `npm run preview:start` a partir dela e use as URLs que ele imprime. Não use o `docker-compose up` nem as portas 5173/3000: elas servem o código do checkout principal, não o da worktree.
- **Sempre rode `npm run preview:stop` ao terminar de validar** — não deixe processos de preview rodando.
- Detalhes (banco, emails, login Google) em `docs/development.md`.

## Testing Guidelines

- Place tests in `src/**/__tests__` or as `*.test.ts(x)`.

## Commit & Pull Request Guidelines

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`).
- PRs include summary, tests run, and screenshots for UI changes.

## Security & Configuration Tips

- Use `.env.example` templates; never commit secrets.
- Prisma workflows: `npx prisma generate` and `npx prisma migrate dev --name <name>` in `backend/`.

