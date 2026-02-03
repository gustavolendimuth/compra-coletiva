# Repository Guidelines

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

## Frontend Development Rules

- Mobile-first only: build for 320–640px, then add `sm/md/lg` breakpoints.
- Theme consistency: blue/green/red/gray only; Tailwind scale for spacing; `shadow-sm`/`shadow`/`shadow-md`/`shadow-lg` only.
- Modular architecture: split files >250 lines, extract reusable UI into `ui/`, move logic into hooks.
- API architecture: all calls in `frontend/src/api` services with typed models; no direct axios in components.
- Sanitize any user-provided content using shared sanitize utilities before rendering.
- When touching a component, refactor violations (size, duplication, desktop-first styles).

## Backend Development Rules

- Always use the Money utility for financial calculations; never raw float math.
- Validate inputs with Zod in route files; wrap handlers with `asyncHandler` and throw `AppError` for 4xx/5xx.
- Enforce auth/authorization with `requireAuth`, `requireRole`, and ownership guards.
- Recalculate shipping totals on order create/update/delete.
- Sanitize user content stored or returned to clients.

## Testing Guidelines

- Backend: Jest + ts-jest. Frontend: Vitest + React Testing Library.
- Place tests in `src/**/__tests__` or as `*.test.ts(x)`.

## Commit & Pull Request Guidelines

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `test:`).
- PRs include summary, tests run, and screenshots for UI changes.

## Security & Configuration Tips

- Use `.env.example` templates; never commit secrets.
- Prisma workflows: `npx prisma generate` and `npx prisma migrate dev --name <name>` in `backend/`.

## Documentation Rules

- Crie e mantenha docs em `docs/`; evite novos `.md` na raiz, exceto `README.md`, `AGENTS.md` e `CLAUDE.md`.
- Antes de criar um novo doc, procure conteúdo existente e atualize o arquivo correto para evitar duplicação.
- Mantenha `README.md` curto (visão geral + quickstart + links). Detalhes vão para `docs/`.
- Evite informações voláteis: contagens de arquivos/testes, datas, linhas, logs e listas longas de arquivos/funções.
- Quando adicionar/remover/renomear docs, atualize os links em `README.md`.
- Prefira linguagem objetiva e tópicos estáveis; use exemplos apenas quando necessários.
