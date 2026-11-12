# Endurecimento de autenticação e sessão - Verificação

**Verdict**: PASS (35/35 checks provados)
**Profile**: light (não declarado no `AGENTS.md`) - passo 1 (ui), junção `Coverage`, `Test policy` e fault injection não rodam neste profile
**Diff range**: 7ea7b59..028af21
**Round**: 1 - full
**Verifier**: sub-agente independente (author != verifier)

## Binding sources

Passo 1 não roda (profile `light`). Critério da task → check: os 24 critérios de `.tasks/auth-hardening.md` têm check, conforme o mapa do checklist (1→C1 … 24→C35); conferido contra a task: 8→C8/C9/C10, 13→C16/C17, 15→C19/C20, 16→C21 (asserta também o "outro token pendente → 400"), 20→C25/C26/C27, 21→C28/C29, 22→C30/C31, 23→C32/C33. Nenhum critério sem check.

## Checks

Provas em `HEAD` 028af21: backend numa invocação `timeout 900 npx jest --json` (cada teste conferido por `fullName` contra o `-t`), frontend numa invocação `vitest --run --configLoader runner --reporter=json`. Infra: C5 contra Redis 7 real (`sec-verify-redis`, 56390) `RATE_LIMIT_TEST_REDIS_URL=redis://127.0.0.1:56390 timeout 300 npx jest ...rateLimitStore.redis.test.ts -t "two instances share"` - 1 passed; C17 `CONTAINER=sec-verify-pg timeout 120 bash backend/scripts/checks/hash-tokens-backfill.check.sh 55440` - exit 0. Todos os arquivos de prova criados ou alterados no diff.

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | 11ª login → 429 `{status,message}` + `Retry-After`; 10ª não | jest `auth-rate-limit.test.ts` "login: 11th call" - 1 passed | `auth-rate-limit.test.ts:53` - `expect(res.status).not.toBe(429)` (loop 1..10); `:61` - `toBe(429)`; `:62` - `toEqual({ status: "error", message: expect.any(String) })`; `:64` - `retry-after > 0` | PASS |
| C2 | 4ª reset do mesmo e-mail → 429, sem enfileirar | idem "password reset: 4th call" - 1 passed | `:101` - `mockQueuePasswordResetEmail).toHaveBeenCalledTimes(3)`; `:108` - `toBe(429)`; `:110` - continua `3` | PASS |
| C3 | 6ª register → 429 | idem "register: 6th call" - 1 passed | `:120` - `not.toBe(429)` (1..5); `:126` - `toBe(429)` | PASS |
| C4 | 31ª geo+distance → 429, sem serviço externo | jest `geo-rate-limit.test.ts` "geocoding and distance share" - 1 passed | `geo-rate-limit.test.ts:72` - 30× `toBe(200)` alternando geocoding/distance; `:85-86` - `toBe(429)`; `:88-89` - `mockGeocodeCEP`/`mockGetRoute` `toHaveBeenCalledTimes(<antes>)` | PASS |
| C5 | duas instâncias somam no mesmo Redis | Redis real, 1 passed | `rateLimitStore.redis.test.ts:45` - `statuses).toEqual(Array(10).fill(200))` alternando A/B; `:49-50` - `blockedOnA/B.status).toBe(429)` | PASS |
| C6 | IP real = `203.0.113.7` em `req.ip`, AuditLog, LegalAcceptanceLog | jest `trustProxy.test.ts` "rightmost client ip" - 1 passed; `grep -q "configureTrustProxy(app)" src/index.ts` exit 0; `auth-rate-limit` "keys by real client ip" - 1 passed | `trustProxy.test.ts:24-28` - `toEqual({ reqIp: "203.0.113.7", auditIp: "203.0.113.7", legalIp: "203.0.113.7" })`; `backend/src/index.ts:46` - `configureTrustProxy(app)`; `auth-rate-limit.test.ts:80` - `otherClient.status).not.toBe(429)` | PASS |
| C7 | Redis fora → sem limite, `[RateLimit]` 1× | jest `rateLimitStore.test.ts` "redis unavailable" - 1 passed | `rateLimitStore.test.ts:38` - `toEqual(Array(15).fill(200))`; `:42` - `rateLimitLogs).toHaveLength(1)`; `:43` - `errorSpy).toHaveBeenCalledTimes(1)` | PASS |
| C8 | `deletedAt` + token válido → `requireAuth` 401 | jest `authMiddleware.test.ts` "deleted user is rejected" - 1 passed | `authMiddleware.test.ts:49` - `toBe(401)` | PASS |
| C9 | `deletedAt` → refresh 401 | jest `auth-refresh.test.ts` "deleted user gets 401" - 1 passed | `auth-refresh.test.ts:190` - `toBe(401)` | PASS |
| C10 | `deletedAt` → socket anônimo | jest `socketAuth.test.ts` "deleted user is anonymous" - 1 passed | `socketAuth.test.ts:45` - `next).toHaveBeenCalledWith()`; `:46` - `user).toBeUndefined()` | PASS |
| C11 | ignora `handshake.query.token` | idem "ignores query token" - 1 passed | `socketAuth.test.ts:57` - `user).toBeUndefined()`; `:58` - `mockUserFindUnique).not.toHaveBeenCalled()` | PASS |
| C12 | admin delete remove sessões, `googleId`/`password` null | jest `admin-users-delete.test.ts` "revokes sessions and credentials" - 1 passed | `admin-users-delete.test.ts:53-60` - `data: expect.objectContaining({ googleId: null, password: null, ... })`; `:62` - `sessionDeletes).toEqual([[{ where: { userId: "user-9" } }]])` | PASS |
| C13 | login Google não reativa conta excluída | jest `passportGoogle.test.ts` "deleted user is not reactivated" - 1 passed | `passportGoogle.test.ts:75` - `id).toBe("new-user")`; `:77` - `args.data).not.toHaveProperty("deletedAt", null)`; `:81` - `creates).toHaveLength(1)` | PASS |
| C14 | rotação: cookie novo ≠ antigo; antigo 401 | jest `auth-refresh.test.ts` "rotates the refresh token" - 2 passed | `auth-refresh.test.ts:117` - `newToken).not.toBe(oldToken)`; `:119` - `mockSessions.has(sha256Hex(oldToken))).toBe(false)`; `:124` - `replay.status).toBe(401)` | PASS |
| C15 | reuso → `deleteMany({ where: { userId } })` + 401 | idem "reuse revokes all sessions" - 1 passed | `:158` - `toBe(401)`; `:159-161` - `session.deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } })`; `:165` - user-2 mantém 1 sessão | PASS |
| C16 | grava `sha256_hex`; revogação pelo hash | jest `tokenService.test.ts` "stores sha256 hex" - 2 passed | `tokenService.test.ts:34` - `data.token).toBe(sha256Hex(refreshToken))`; `:36` - `toMatch(/^[0-9a-f]{64}$/)`; `:44` - `deleteMany` com o hash | PASS |
| C17 | migração: `sessions.token` → sha256 hex; resets apagados | script, exit 0 | `backend/scripts/checks/hash-tokens-backfill.check.sh:41` - `[ "$GOT" = "$EXPECTED" ] && [ "$RESETS" = "0" ]` (saída: `expected=20dac3b2… got=20dac3b2… resets=0`), aplicando a migração real `20261106120000_hash_auth_tokens/migration.sql` | PASS |
| C18 | JWT 30 d, `expiresAt` +30 d, cookie `Max-Age=2592000` | jest `tokenService.test.ts` "30 days" - 2 passed; `auth-refresh.test.ts` "cookie lasts 30 days" - 1 passed | `tokenService.test.ts:56` - `exp - iat).toBe(30 * 24 * 60 * 60)`; `:67-68` - `expiresAt` entre `before/after + THIRTY_DAYS_MS`; `auth-refresh.test.ts:201` - `toContain("Max-Age=2592000")` | PASS |
| C19 | `PATCH /api/auth/profile` com senha → apaga outras sessões | jest `auth-password.test.ts` "auth profile password change keeps current session" - 1 passed | `auth-password.test.ts:127-129` - `deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1", token: { not: sha256Hex("current-refresh") } } })` | PASS |
| C20 | `PATCH /api/profile` com senha → idem | jest `profile-password.test.ts` - 1 passed | `profile-password.test.ts:57-59` - mesma expressão | PASS |
| C21 | reset → todas as sessões; outros tokens do usuário → 400 | jest `auth-password.test.ts` "reset revokes sessions and other tokens" - 1 passed | `auth-password.test.ts:151` - `deleteMany).toHaveBeenCalledWith({ where: { userId: "user-1" } })`; `:156` - `other.status).toBe(400)`; `:157` - token de user-2 preservado | PASS |
| C22 | 2 resets paralelos → um 200, outro 400 | idem "parallel reset with same token" - 1 passed | `auth-password.test.ts:170` - `statuses).toEqual([200, 400])`; `:171` - `user.update).toHaveBeenCalledTimes(1)` | PASS (ver finding 1) |
| C23 | token de reset gravado como hash | idem "reset token stored as hash" - 1 passed | `:183` - `mockResetTokens[0].token).toBe(sha256Hex(rawToken))`; `:184` - `not.toBe(rawToken)`; `:189` - reset `toBe(200)` | PASS |
| C24 | produção não expõe token | idem "never exposes token in production" - 1 passed | `:205` - `res.body).not.toHaveProperty("token")`; `:207` - `JSON.stringify(res.body)).not.toContain(rawToken)` | PASS |
| C25 | cookie HttpOnly `oauthState` = `state` | jest `auth-google.test.ts` "issues state" - 1 passed | `auth-google.test.ts:92` - `toMatch(/HttpOnly/i)`; `:94` - `state).toMatch(/^[0-9a-f]{64}$/)`; `:95` - `cookieValue).toBe(state)` | PASS |
| C26 | sem `state` → `?error=oauth_state`, sem sessão | idem "missing state" - 2 passed | `:107` - `location).toBe(\`${FRONTEND_URL}/auth/callback?error=oauth_state\`)`; `:108` - `session.create).not.toHaveBeenCalled()` | PASS |
| C27 | `state` diferente → idem | idem "mismatched state" - 1 passed | `:126` - mesmo `location`; `:127` - `session.create` não chamado | PASS |
| C28 | sucesso → `Location` exatamente `/auth/callback` | idem "no user data in redirect" - 1 passed | `:140` - `location).toBe(\`${FRONTEND_URL}/auth/callback\`)`; `:141` - `not.toMatch(/accessToken\|userEmail\|userId\|userName\|maria/)` | PASS |
| C29 | `/auth/callback` usa refresh | vitest `AuthCallback.test.tsx` "uses refresh" - 1 passed | `AuthCallback.test.tsx:52` - `mockSetUser).toHaveBeenCalledWith(user)`; `:53` - `mockRefreshSession).toHaveBeenCalledTimes(1)` | PASS |
| C30 | `verified=false` + conta local → sem vínculo, `email_not_verified` | jest `passportGoogle.test.ts` "unverified email is not linked" - 1 passed | `passportGoogle.test.ts:102` - `user).toBe(false)`; `:103` - `info).toEqual({ message: "email_not_verified" })`; `:104` - `allUserUpdates()).toHaveLength(0)` | PASS |
| C31 | redirect `?error=email_not_verified` | jest `auth-google.test.ts` "email not verified redirect" - 1 passed | `auth-google.test.ts:155` - `location).toBe(\`${FRONTEND_URL}/auth/callback?error=email_not_verified\`)` | PASS |
| C32 | access token só em memória | vitest `authStorage.test.ts` "keeps access token only in memory" - 1 passed | `authStorage.test.ts:89` - nenhum valor do localStorage contém o token; `:91` - `document.cookie).not.toContain(token)`; `:93` - `toContain("auth-token=1")`; `:94` - `getAccessToken()).toBe(token)` | PASS |
| C33 | recarga obtém token via refresh | vitest `AuthContext.test.tsx` "reload obtains access token via refresh" - 1 passed | `AuthContext.test.tsx:59` - `mockPost).toHaveBeenCalledWith("/auth/refresh")`; `:61` - `getAccessToken()).toBe("fresh-token")` | PASS |
| C34 | 2 `refreshSession()` concorrentes → 1 POST | vitest `refreshSession.test.ts` "single refresh in flight" - 2 passed | `refreshSession.test.ts:29` - `mockPost).toHaveBeenCalledTimes(1)`; `:31-32` - ambos `fresh-token` | PASS |
| C35 | visitante em `/admin`, `/perfil` → redirect; `auth-token=1` passa | vitest `middleware.test.ts` "redirects visitor" - 2 passed; "session indicator" - 1 passed | `middleware.test.ts:14-16` - `pathname).toBe("/campanhas")`, `requireLogin` `"true"`, `redirectTo` `toBe(path)`; `:21` - `location")).toBeNull()` | PASS |

## Findings

1. **Garantia de banco provada em mock** (C22, crit. 17): a exclusividade do reset paralelo depende do `UPDATE ... WHERE used = false` atômico do Postgres, mas a prova roda sobre um `updateMany` falso que emula essa atomicidade (`auth-password.test.ts:31-40`). Prova que a rota usa a forma condicional e trata `count !== 1` como 400; não prova a corrida no banco real. Baixo risco, abaixo da fronteira do banco.
2. C7 prova "1 log" dentro de uma rajada de ~300 ms, não a janela de 60 s em si (o "no máximo 1×/min" é cumprido no sentido de "não loga por requisição"). Precisão baixa, não bloqueia.

## Swept existing re-read

| Row | Constraint citada | No código |
|---|---|---|
| Observable "tela `/auth/callback` - estado de carregamento" → existing `LoadingFallback` de `AuthCallbackPage.tsx` | `frontend/src/app/auth/callback/AuthCallbackPage.tsx:6` (`function LoadingFallback()`), `:19` (`<Suspense fallback={<LoadingFallback />}>`) | presente |

Os `Swept` do checklist não têm linhas que resolvam para *existing*.

## Gate

- `npm test --workspace=backend` (`timeout 900`): 324 passed, 1 skipped (`rateLimitStore.redis.test.ts` sem env; rodado à parte contra Redis real, passou), 0 failed
- `npm test --workspace=frontend`: 754 passed, 2 skipped, 1 failed - `OrdersTab.test.tsx` "should show view button on all orders for creator", pré-existente (falha igual em `7ea7b59`)
- `npx tsc --noEmit` backend e frontend: exit 0
- Nenhum Jest pendurado (todas as invocações com `timeout`, nenhuma saiu por 124)
