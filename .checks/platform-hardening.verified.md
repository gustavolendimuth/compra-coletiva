# Endurecimento da plataforma - Verificação

**Verdict**: PASS (27/27 checks provados)
**Profile**: light (não declarado no `AGENTS.md`) - passo 1 (ui), junção `Coverage` (a tabela do checklist não foi recomputada), `Test policy` e fault injection não rodam neste profile
**Diff range**: 7ea7b59..028af21
**Round**: 1 - full
**Verifier**: sub-agente independente (author != verifier)

## Binding sources

Passo 1 não roda (profile `light`). Critério da task → check: os 12 critérios de `.tasks/platform-hardening.md` têm check conforme o mapa do checklist (1→C1/C2/C3, 2→C4, 3→C5, 4→C6/C7, 5→C8, 6→C9-C12, 7→C13, 8→C14/C15, 9→C16/C17 (+C18), 10→C19/C20, 11→C21/C22, 12→C23-C27). Nenhum critério sem check.

## Checks

Provas em `HEAD` 028af21. Jest/vitest: mesmas invocações únicas da feature (`timeout 900 npx jest --json`; `vitest --run --configLoader runner --reporter=json`), cada teste conferido por `fullName`. Infra: `timeout 900 npm run build` (Next 16.4.5) + `next start -p 5491` + `security-headers.check.sh` (servidor encerrado no fim); `timeout 900 docker build -t sec-verify-backend-test backend/` + `id -u` + `container-upload.check.sh` (imagem e volume removidos); `npm audit --omit=dev --json` na raiz e em `backend/ --no-workspaces` (saídas no scratchpad, não em `/tmp`). Todos os arquivos de prova criados no diff.

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | 3 segredos × 3 defeitos acusados; forte não acusa | jest `secrets.test.ts` "rejects" - 10 passed (9 + "rejects nothing") | `secrets.test.ts:25-29` (missing, `"x".repeat(31)`, default dev) × `:31` (3 nomes); `:41-43` - `problems).toHaveLength(1)`, `toContain(name)`, `not.toContain(value)`; `:49` - `findSecretProblems(strongEnv())).toEqual([])` | PASS |
| C2 | boot real sem `JWT_ACCESS_SECRET` → exit 1, stderr cita | jest `bootSecrets.test.ts` "exits 1" - 2 passed | `bootSecrets.test.ts:32` - `result.status).toBe(1)`; `:33` - `stderr).toContain("JWT_ACCESS_SECRET")` | PASS |
| C3 | refresh fraco → exit 1, sem o valor | idem "never prints the value" - 1 passed | `:44` - `toBe(1)`; `:45` - `toContain("JWT_REFRESH_SECRET")`; `:46` - `not.toContain(weak)` | PASS |
| C4 | fora de produção: sem exit, defaults de dev | jest `secrets.test.ts` "outside production" - 1 passed | `secrets.test.ts:67-69` - `getSecret(...)).toBe("dev-...-change-in-production")` (3); `:71` - `exit).not.toHaveBeenCalled()` | PASS |
| C5 | HS512 com segredo correto → 401 | jest `authMiddleware.test.ts` "rejects HS512" - 1 passed | `authMiddleware.test.ts:63-67` - `jwt.sign(..., getSecret("JWT_ACCESS_SECRET"), { algorithm: "HS512" })`; `:71` - `toBe(401)` | PASS |
| C6 | unsubscribe não usa `JWT_SECRET`; troca de `JWT_ACCESS_SECRET` invalida | jest `linkBuilder.test.ts` "not JWT_SECRET" - 2 passed | `linkBuilder.test.ts:20` - `toBe(true)` com outro `JWT_SECRET`; `:23-24` - HMAC legado (`another-jwt-secret`, `default-secret-change-me`) `toBe(false)`; `:33` - `toBe(false)` após trocar `JWT_ACCESS_SECRET` | PASS |
| C7 | `timingSafeEqual`; tamanho diferente → false | idem "timingSafeEqual" - 2 passed | `:46` - `expect(spy).toHaveBeenCalled()`; `:51-52` - `toBe(false)` sem lançar | PASS |
| C8 | docs e `.env.example` listam exatamente os 3, sem `JWT_SECRET` | jest `secretsDocs.test.ts` "lists exactly" - 2 passed | `secretsDocs.test.ts:15-17` - `toEqual(["JWT_ACCESS_SECRET","JWT_REFRESH_SECRET","PUBLIC_ALIAS_SECRET"].sort())`; `:18` - `not.toMatch(/\bJWT_SECRET\b/)` | PASS |
| C9 | nosniff, HSTS, XFO DENY | jest `httpSecurity.test.ts` "security headers" - 2 passed | `httpSecurity.test.ts:28` - `toBe("nosniff")`; `:29` - `toBe("max-age=31536000; includeSubDomains")`; `:30` - `toBe("DENY")` | PASS |
| C10 | `index.ts` monta só via `configureHttpSecurity` | grep do checklist, exit 0 | `backend/src/index.ts:52` - `configureHttpSecurity(app, corsOrigins);`, sem `app.use(cors(` | PASS |
| C11 | preflight com credentials | idem "cors with credentials" - 2 passed | `httpSecurity.test.ts:45` - `access-control-allow-origin).toBe(FRONTEND_ORIGIN)`; `:46` - `allow-credentials).toBe("true")` | PASS |
| C12 | Socket.IO conecta via polling com segurança aplicada | idem "socket.io connects" - 1 passed | `httpSecurity.test.ts:96` - `client.connected).toBe(true)` | PASS |
| C13 | `/` e `/campanhas` via `next start` com CSP e headers | build exit 0 + script exit 0 | `frontend/scripts/checks/security-headers.check.sh:21-29` (`expect_header` dos 6 valores por página); saída: 12 linhas `ok`, `check=0` | PASS |
| C14 | `/_next/image` externo → 400 | mesmo script | `security-headers.check.sh:31-38` - `status != "400"` → fail; saída `ok /_next/image externo: 400` | PASS |
| C15 | `remotePatterns` aceita S3 configurado e API `/uploads`, recusa externo e outro bucket (matcher do Next) | vitest `imageRemotePatterns.test.ts` - 7 passed | `imageRemotePatterns.test.ts:6` - `hasRemoteMatch` de `next/dist/shared/lib/match-remote-pattern`; `:26` - API `toBe(true)`; `:30` - externo `toBe(false)`; `:34` - outro bucket `toBe(false)`; `:20-23` - S3 configurado `true` | PASS |
| C16 | `npm audit --omit=dev` raiz: 0 critical | exit 0 | `metadata.vulnerabilities = {"low":5,"moderate":3,"high":2,"critical":0}` | PASS |
| C17 | `high` só `nodemailer`/`zod` | exit 0 | highs `[ 'nodemailer', 'zod' ]`, bad `[]` | PASS |
| C18 | `backend/package-lock.json` sem critical | exit 0 | `{"low":5,"moderate":3,"high":2,"critical":0}` | PASS |
| C19 | `id -u` ≠ 0 na imagem | `docker build` exit 0; `id -u` = `1000` | `test "$(docker run ... id -u)" != "0"` exit 0 | PASS |
| C20 | upload local grava em `UPLOAD_DIR` (default e montado) | `container-upload.check.sh` exit 0 | saída `uid 1000 wrote /app/uploads/probe/...png` e `uid 1000 wrote /app/data/probe/...png`; script `:21-23` sai 2 se não gravou | PASS |
| C21 | 5.000 entradas por cache | jest `boundedTtlCache.test.ts` "max entries" - 2 passed; `geocodingService.test.ts` "5000" - 3 passed | `boundedTtlCache.test.ts:13-16` - `size).toBe(5000)`, `get("k0")).toBeUndefined()`; `geocodingService.test.ts:56` - `viaCepCalls(cepFor(5000))).toBe(1)`; `:59` - `cepFor(0)).toBe(2)`; `:72` - `nominatimCalls()).toBe(5002)` | PASS |
| C22 | > 24 h buscada de novo, 24 h - 1 ms do cache | `boundedTtlCache` "24h" - 1 passed; `geocodingService` "24h" - 3 passed | `boundedTtlCache.test.ts:37` - `toBe(1)` em `day - 1`; `:40` - `toBeUndefined()`; `geocodingService.test.ts:79` - `toBe(1)`; `:83` - `toBe(2)` (CEP); `:90`/`:94` (coords) | PASS |
| C23 | login (200, 401, 500) sem e-mail/senha/token/body | jest `auth-logs.test.ts` "login" - 3 passed | `auth-logs.test.ts:83-86` - `expect(logText).not.toContain(value)` por valor; chamado com `[EMAIL, PASSWORD, res.body.accessToken, "maria.sensivel"]` (200), `[EMAIL, PASSWORD, ...]` (401), `[EMAIL, PASSWORD]` (500) | PASS |
| C24 | refresh (200, 500) sem e-mail/token | idem "refresh" - 2 passed | `auth-logs.test.ts:147`, `:160` - status + `expectNoSensitive(...)` | PASS |
| C25 | complete-phone (200, 400, 500) | idem "complete-phone" - 3 passed | `auth-logs.test.ts:177`, `:190`, `:204` - status + `expectNoSensitive(...)` | PASS |
| C26 | socket (autenticado, token inválido, erro de banco) sem e-mail/token | jest `socketAuth.test.ts` "logs no email" - 3 passed | `socketAuth.test.ts:82-83`, `:90-91`, `:98-99` - `logText()).not.toContain("u@test.com")` / token | PASS |
| C27 | e-mail (sucesso/falha/exceção, Gmail, Resend) sem destinatário | jest `emailLogs.test.ts` "no recipient" - 5 passed | `emailLogs.test.ts:68`, `:78`, `:88`, `:102`, `:115` - `logText()).not.toContain(RECIPIENT)` | PASS |

## Findings

Nenhum gap de check. Observações:

- `next build` reescreve `frontend/next-env.d.ts` e `tsc` reescreve `frontend/tsconfig.tsbuildinfo` (ambos versionados) - restaurados pelo verificador; a árvore fica suja depois de qualquer build (já registrado no Handoff do checklist).
- Prova de C16-C18 escreve em `/tmp/audit*.json`; rodada aqui com caminho do scratchpad, semântica igual.

## Swept existing re-read

Os `Swept` do checklist e da task não têm linhas que resolvam para *existing* (todas citam checks ou `n/a`).

## Gate

- `npm test --workspace=backend` (`timeout 900`): 324 passed, 1 skipped, 0 failed
- `npm test --workspace=frontend`: 754 passed, 2 skipped, 1 failed - `OrdersTab.test.tsx` "should show view button on all orders for creator", pré-existente (falha igual em `7ea7b59`, `OrdersTab*` não tocado no diff)
- `npx tsc --noEmit` backend e frontend: exit 0
- `next build` (Next 16.4.5): exit 0; `docker build` backend: exit 0
- Limpeza: imagem `sec-verify-backend-test`, containers `sec-verify-*`, volume do check e worktree temporário removidos; nenhum `next start` restante; porcelain igual ao início
