# Endurecimento de autenticação e sessão

Sources:

- `.tasks/auth-hardening.md` - critérios 1-24, decisões, Unresolved (todos seguidos pela coluna "Until answered")
- Auditoria de segurança da conversa (via task) - motivação; nenhuma tela binding (profile `light`)

Worktree: `.workspaces/compra-coletiva/sec-lane-auth`, branch `gustavolendimuth/sec-lane-auth`, base `7ea7b59`.

## Out of scope

- Ban bloqueando login, política de senha, anti-enumeração - decisão de produto (task)
- Segredos JWT no boot / algoritmo do verify - task `platform-hardening`
- Autorização de `join-order`/`creator-typing` no socket e shape de `GET /api/admin/users/:id` - task `access-and-data-exposure`
- Pré-takeover além do critério 22 - Unresolved 1 (nenhum critério de vínculo além do 22)
- Janela de graça no refresh concorrente - Unresolved 4 (frontend serializa o refresh por aba)
- Log de tentativas bloqueadas - Unresolved 5 (sem log além do critério 7)
- Mensagens novas no 429 / `oauth_state` / `email_not_verified` - Unresolved 3 (login exibe `message` do backend via `getApiErrorMessage`; `/auth/callback` mantém o toast genérico atual)

## Landing

Backend: `tokenService.ts` (hash/rotação/TTL), `routes/auth.ts` (limiters, refresh, reset, OAuth), `config/passport.ts`, `authMiddleware.ts`, `socketService.ts`, `admin/users.ts`, `profile.ts`, novos `middleware/rateLimiter.ts` + `middleware/rateLimitStore.ts` + `config/trustProxy.ts`, migração SQL. Frontend: `authStorage.ts`, `api/client.ts`, novo `api/refreshSession.ts`, `AuthContext.tsx`, `AuthCallback.tsx`. Reusa `ioredis` e `REDIS_*` já existentes, `errorHandler` shape `{ status: "error", message }`.

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| Hash do refresh em repouso (task) | `sessions.token = sha256_hex(refreshToken)`; migração `UPDATE sessions SET token = encode(sha256(token::bytea),'hex')` | bcrypt - impede lookup por índice único a cada `/refresh` |
| Rotação com revogação total no reuso (task) | JWT válido + hash ausente de `sessions` (ou já consumido por rotação concorrente) → `session.deleteMany({ where: { userId } })` + 401 | famílias de token (`familyId`) - coluna nova |
| Rate limit com store Redis (task) | deps `express-rate-limit@8` + `rate-limit-redis@6`, ioredis com `REDIS_URL` ou `REDIS_HOST/PORT/USERNAME|USER/PASSWORD`, prefixos `rl:login:`, `rl:register:`, `rl:password-reset:`, `rl:geo:` | store em memória - não soma entre instâncias |
| `trust proxy` (task) | `app.set("trust proxy", 1)` via `configureTrustProxy(app)` em `config/trustProxy.ts`, chamado em `index.ts`; `AuditService`/`LegalAcceptanceService` usam `req.ip` | ler `X-Forwarded-For` à mão - forjável |
| Store resiliente | wrapper `ResilientStore` em volta do `RedisStore`: nunca lança; em erro devolve `{ totalHits: 1, resetTime: now+windowMs }` (passa sem limite) e loga `[RateLimit]` no máx. 1x/60 s; `init` adiado para o 1º `increment`; ioredis `enableOfflineQueue: false`, `maxRetriesPerRequest: 1`, client lazy | `passOnStoreError: true` da lib - loga a cada requisição (viola C7); offline queue - requisições esperam reconexão |
| Corpo do 429 | `{ status: "error", message: "<pt-BR>" }` + `Retry-After` + headers `draft-7` | `message` string padrão da lib - não segue o shape do `errorHandler` |
| Chave do limite de reset | e-mail normalizado (`trim().toLowerCase()`); sem e-mail string → `ipKeyGenerator(req.ip)` | só IP - não cumpre "mesmo e-mail" |
| TTL do refresh | constante `REFRESH_TOKEN_TTL_DAYS = 30` usada no `expiresIn` do JWT, em `sessions.expiresAt` e no `maxAge` do cookie; env `JWT_REFRESH_EXPIRES_IN` deixa de ser lida | manter override por env - permite violar C14 |
| Consumo do token de reset | `$transaction`: `passwordResetToken.updateMany({ where: { id, used: false, expiresAt: { gt: now } }, data: { used: true } })`; `count !== 1` → 400 `TOKEN_ALREADY_USED`; depois `user.update`, `session.deleteMany({ userId })`, `passwordResetToken.deleteMany({ userId, id: { not } })` | SELECT + UPDATE incondicional (hoje) - corrida dá dois sucessos |
| Tokens de reset pendentes na migração | `DELETE FROM password_reset_tokens` | backfill de hash - expiram em 1 h, apagar é mais simples (task) |
| OAuth `state` | 32 bytes hex aleatórios em cookie HttpOnly `oauthState` (`path=/api/auth/google`, `maxAge` 10 min, `sameSite=lax`, `secure` em produção), passado como `state` ao `passport.authenticate`; callback compara com `crypto.timingSafeEqual` e limpa o cookie | `state: true` do passport-oauth2 - exige `express-session`, que o app não tem |
| Redirects de erro do OAuth | `${FRONTEND_URL}/auth/callback?error=oauth_state` e `?error=email_not_verified`; `auth_failed` existente mantém `/login?error=auth_failed` | unificar todos - churn sem critério |
| Sucesso do OAuth | redirect para exatamente `${FRONTEND_URL}/auth/callback` (sem query) | manter dados não-sensíveis na URL - critério 21 proíbe |
| E-mail não verificado | `profile.emails[0].verified` diferente de `true`/`"true"` + conta local existente com o e-mail → `done(null, false, { message: "email_not_verified" })`, sem update | vincular e apagar senha - Unresolved 1 |
| Conta excluída no login Google | usuário achado por `googleId` com `deletedAt` (legado) → `googleId: null` nele e segue para criação de conta nova; ramos de vínculo deixam de zerar `deletedAt/deletedReason` | reativar (hoje) - critério 10 |
| Indicador de sessão no frontend | cookie `auth-token=1` (valor literal `1`, 30 dias, `path=/; SameSite=Lax`), mais `user-role` como hoje; access token só em variável de módulo em `authStorage` | remover o cookie - quebra o redirect do `middleware.ts` (C24) |
| Refresh por aba | `refreshSession()` em `frontend/src/api/refreshSession.ts`: uma promessa em voo por aba, compartilhada por interceptor, `AuthContext` e `AuthCallback` | sem serialização - dispara C12 na própria aba (Unresolved 4) |
| Socket auth testável | middleware extraído como `export const authenticateSocket` em `socketService.ts`; só lê `handshake.auth.token` | testar via servidor socket.io real - backend não tem `socket.io-client` |
| Primeira conexão do store (descoberta no build) | antes do 1º comando, se o ioredis ainda está no status inicial (`wait`/`connecting`/`connect`), espera `ready`/`error`/`end` por até 1 s; em `reconnecting` não espera | fail-fast desde o boot - as primeiras requisições após o deploy passavam sem contagem (C5 vermelho) |

- Nothing else in this change is hard to reverse

## Checks

Critério da task → check: 1→C1 · 2→C2 · 3→C3 · 4→C4 · 5→C5 · 6→C6 · 7→C7 · 8→C8,C9,C10 (+C11 do Out of scope "query.token") · 9→C12 · 10→C13 · 11→C14 · 12→C15 · 13→C16,C17 · 14→C18 · 15→C19,C20 · 16→C21 · 17→C22 · 18→C23 · 19→C24 · 20→C25,C26,C27 · 21→C28,C29 · 22→C30,C31 · 23→C32,C33 (+C34 do Unresolved 4) · 24→C35

### S1 - Abuso é limitado, por IP real · 8 files · ~97 KB · ~24k

**C1** - 11ª `POST /api/auth/login` do mesmo IP em 15 min → 429 `{ status: "error", message }` com `Retry-After`; a 10ª não é 429
Proof: `cd backend && npx jest src/routes/__tests__/auth-rate-limit.test.ts -t "login: 11th call"`

**C2** - 4ª `POST /api/auth/request-password-reset` do mesmo e-mail em 1 h → 429 e `queuePasswordResetEmail` não é chamado nela
Proof: `cd backend && npx jest src/routes/__tests__/auth-rate-limit.test.ts -t "password reset: 4th call"`

**C3** - 6ª `POST /api/auth/register` do mesmo IP em 1 h → 429
Proof: `cd backend && npx jest src/routes/__tests__/auth-rate-limit.test.ts -t "register: 6th call"`

**C4** - 31ª chamada em 1 min somando `GET /api/geocoding/*` e `GET /api/campaigns/:idOrSlug/distance` → 429 e nenhum serviço externo (geocodingService/routingService) é chamado nela
Proof: `cd backend && npx jest src/routes/__tests__/geo-rate-limit.test.ts -t "geocoding and distance share"`

**C5** - Duas instâncias (módulos isolados, clients Redis distintos) somam as tentativas no mesmo Redis
Proof: `docker run -d --rm --name sec-lane-auth-redis -p 56381:6379 redis:7-alpine && cd backend && RATE_LIMIT_TEST_REDIS_URL=redis://127.0.0.1:56381 npx jest src/middleware/__tests__/rateLimitStore.redis.test.ts -t "two instances share"; docker rm -f sec-lane-auth-redis` (sem a env o teste é pulado)

**C6** - `X-Forwarded-For: 1.1.1.1, 203.0.113.7` com `trust proxy` → `req.ip`, IP do `AuditLog` e do `LegalAcceptanceLog` = `203.0.113.7`
Proof: `cd backend && npx jest src/config/__tests__/trustProxy.test.ts -t "rightmost client ip"`
Proof: `cd backend && grep -q "configureTrustProxy(app)" src/index.ts`
Proof: `cd backend && npx jest src/routes/__tests__/auth-rate-limit.test.ts -t "keys by real client ip"`

**C7** - Redis indisponível → rotas limitadas respondem normalmente acima do limite e `[RateLimit]` é logado uma única vez em 1 min
Proof: `cd backend && npx jest src/middleware/__tests__/rateLimitStore.test.ts -t "redis unavailable"`

### S2 - Conta excluída perde acesso na hora · 5 files · ~32 KB · ~8k

**C8** - Usuário com `deletedAt` e access token válido → `requireAuth` 401
Proof: `cd backend && npx jest src/middleware/__tests__/authMiddleware.test.ts -t "deleted user is rejected"`

**C9** - Usuário com `deletedAt` → `POST /api/auth/refresh` 401
Proof: `cd backend && npx jest src/routes/__tests__/auth-refresh.test.ts -t "deleted user gets 401"`

**C10** - Usuário com `deletedAt` → socket tratado como anônimo (sem `socket.user`, `next()` sem erro)
Proof: `cd backend && npx jest src/services/__tests__/socketAuth.test.ts -t "deleted user is anonymous"`

**C11** - Socket ignora `handshake.query.token` (só `handshake.auth.token`)
Proof: `cd backend && npx jest src/services/__tests__/socketAuth.test.ts -t "ignores query token"`

**C12** - `DELETE /api/admin/users/:id` remove todas as `Session` do usuário e grava `googleId: null`, `password: null`
Proof: `cd backend && npx jest src/routes/__tests__/admin-users-delete.test.ts -t "revokes sessions and credentials"`

**C13** - Login Google com conta excluída (achada por `googleId`, legado) → conta excluída continua com `deletedAt`; nova conta é criada
Proof: `cd backend && npx jest src/config/__tests__/passportGoogle.test.ts -t "deleted user is not reactivated"`

### S3 - Refresh rotaciona e não fica legível no banco · 3 files · ~39 KB · ~10k

**C14** - Refresh válido → novo cookie `refreshToken` diferente do anterior; o anterior passa a dar 401
Proof: `cd backend && npx jest src/routes/__tests__/auth-refresh.test.ts -t "rotates the refresh token"`

**C15** - Refresh com assinatura válida, não expirado e ausente de `sessions` → `session.deleteMany({ where: { userId } })` e 401
Proof: `cd backend && npx jest src/routes/__tests__/auth-refresh.test.ts -t "reuse revokes all sessions"`

**C16** - `saveRefreshToken` grava `sha256_hex(token)`, nunca o token; lookup e revogação usam o hash
Proof: `cd backend && npx jest src/services/__tests__/tokenService.test.ts -t "stores sha256 hex"`

**C17** - Migração converte `sessions.token` existente para `sha256_hex` (sessão antiga continua achável pelo hash) e apaga `password_reset_tokens`
Proof: `docker run -d --rm --name sec-lane-auth-pg -e POSTGRES_PASSWORD=pg -p 55433:5432 postgres:16-alpine && sleep 4 && bash backend/scripts/checks/hash-tokens-backfill.check.sh 55433; docker rm -f sec-lane-auth-pg`

**C18** - Refresh JWT `exp - iat = 30 d`, `sessions.expiresAt = agora + 30 d`, cookie `Max-Age=2592000`
Proof: `cd backend && npx jest src/services/__tests__/tokenService.test.ts -t "30 days"`
Proof: `cd backend && npx jest src/routes/__tests__/auth-refresh.test.ts -t "cookie lasts 30 days"`

### S4 - Senha trocada ou resetada derruba as outras sessões · 2 files · ~56 KB · ~14k

**C19** - `PATCH /api/auth/profile` com troca de senha → `session.deleteMany({ where: { userId, token: { not: sha256(cookieAtual) } } })`
Proof: `cd backend && npx jest src/routes/__tests__/auth-password.test.ts -t "auth profile password change keeps current session"`

**C20** - `PATCH /api/profile` com troca de senha → mesma remoção das outras sessões
Proof: `cd backend && npx jest src/routes/__tests__/profile-password.test.ts -t "profile password change keeps current session"`

**C21** - `reset-password` conclui → `session.deleteMany({ where: { userId } })` e outros `PasswordResetToken` do usuário apagados
Proof: `cd backend && npx jest src/routes/__tests__/auth-password.test.ts -t "reset revokes sessions and other tokens"`

**C22** - Duas `reset-password` paralelas com o mesmo token → exatamente uma 200 e a outra 400
Proof: `cd backend && npx jest src/routes/__tests__/auth-password.test.ts -t "parallel reset with same token"`

**C23** - `request-password-reset` grava `sha256_hex(token)` e o e-mail recebe o token cru; `reset-password` busca pelo hash
Proof: `cd backend && npx jest src/routes/__tests__/auth-password.test.ts -t "reset token stored as hash"`

**C24** - `NODE_ENV=production` + `EXPOSE_RESET_TOKEN_IN_RESPONSE=true` → resposta sem `token`
Proof: `cd backend && npx jest src/routes/__tests__/auth-password.test.ts -t "never exposes token in production"`

### S5 - OAuth Google sem CSRF e sem token na URL · 3 files · ~45 KB · ~11k

**C25** - `GET /api/auth/google` grava cookie HttpOnly `oauthState` e envia o mesmo valor como `state` ao Google
Proof: `cd backend && npx jest src/routes/__tests__/auth-google.test.ts -t "issues state"`

**C26** - Callback sem `state` → redirect `${FRONTEND_URL}/auth/callback?error=oauth_state` e nenhuma sessão criada
Proof: `cd backend && npx jest src/routes/__tests__/auth-google.test.ts -t "missing state"`

**C27** - Callback com `state` diferente do cookie → mesmo redirect e nenhuma sessão criada
Proof: `cd backend && npx jest src/routes/__tests__/auth-google.test.ts -t "mismatched state"`

**C28** - Callback com sucesso → `Location` é exatamente `${FRONTEND_URL}/auth/callback` (sem `accessToken`, `userEmail`, nem outro dado)
Proof: `cd backend && npx jest src/routes/__tests__/auth-google.test.ts -t "no user data in redirect"`

**C29** - Página `/auth/callback` obtém access token e usuário via `POST /api/auth/refresh`
Proof: `cd frontend && npx vitest run --configLoader runner src/views/__tests__/AuthCallback.test.tsx -t "uses refresh"`

**C30** - Google com `verified=false` + conta local com o e-mail → nenhuma atualização/vínculo; `done(null, false, { message: "email_not_verified" })`
Proof: `cd backend && npx jest src/config/__tests__/passportGoogle.test.ts -t "unverified email is not linked"`

**C31** - Falha `email_not_verified` no callback → redirect `${FRONTEND_URL}/auth/callback?error=email_not_verified`
Proof: `cd backend && npx jest src/routes/__tests__/auth-google.test.ts -t "email not verified redirect"`

### S6 - Access token só em memória · 7 files · ~30 KB · ~8k

**C32** - Após `setAuth`, `localStorage` não contém o access token e `document.cookie` não contém token; `getAccessToken()` devolve o valor em memória
Proof: `cd frontend && npx vitest run --configLoader runner src/lib/__tests__/authStorage.test.ts -t "keeps access token only in memory"`

**C33** - Ao montar `AuthProvider` com usuário salvo (recarga), o access token vem de `POST /api/auth/refresh`
Proof: `cd frontend && npx vitest run --configLoader runner src/contexts/__tests__/AuthContext.test.tsx -t "reload obtains access token via refresh"`

**C34** - Duas chamadas concorrentes de `refreshSession()` fazem um único `POST /auth/refresh` (Unresolved 4)
Proof: `cd frontend && npx vitest run --configLoader runner src/api/__tests__/refreshSession.test.ts -t "single refresh in flight"`

**C35** - Visitante sem cookie em `/admin` e `/perfil` → redirect `/campanhas?requireLogin=true&redirectTo=<rota>`; com `auth-token=1` `/perfil` passa
Proof: `cd frontend && npx vitest run --configLoader runner src/__tests__/proxy.test.ts -t "redirects visitor"`
Proof: `cd frontend && npx vitest run --configLoader runner src/__tests__/proxy.test.ts -t "session indicator"`

## Swept

- validation: C25-C27, C30
- failure modes: C7, C15
- idempotency and retry: C22
- authorization: C8-C12, C35
- concurrency and ordering: C22; refresh concorrente na mesma aba C34; entre abas - Unresolved 4 (sem janela)
- data lifecycle: C12, C16, C17, C23
- external-dependency failure: C7 (Redis); C4 (ViaCEP/Nominatim/OSRM não chamados acima do limite)
- state transitions: C13, C14, C15
- observability: C7

## Handoff

Aritmética (wc -c / 4, floor): S1 ~24k (inclui `campaigns.ts` 41 KB), S2 ~8k, S3 ~10k, S4 ~14k, S5 ~11k, S6 ~8k = ~75k < 150k → um único batch. Ordem de construção: S3 → S2 → S4 → S1 → S5 → S6 (S3 é a base de token que S2/S4/S5 usam). Se o contexto apertar, parar na fronteira de slice com tudo verde.

- Onde parou: S1-S6 construídos num único batch, C1-C35 verdes; último commit `634bd57` (branch `gustavolendimuth/sec-lane-auth`). Nenhuma fronteira de handoff usada.
- Decidido no build (sem usuário): linha de Landing "Primeira conexão do store" (C5 ficou vermelho com fail-fast puro); `passport.test.ts` (testes só-documentação `expect(true)`) teve o texto do caso de reativação reescrito para o comportamento novo; `.env.example` deixa de anunciar `JWT_REFRESH_EXPIRES_IN`; `OrdersTab.test.tsx > should show view button on all orders for creator` já falha na base `7ea7b59` (não é regressão).
- Abandonado: store com `enableOfflineQueue` padrão (requisições esperariam reconexão com Redis caído) e `passOnStoreError` da lib (log por requisição); script de prova do backfill dentro de `prisma/migrations/` (Prisma trataria a pasta como migração) - movido para `backend/scripts/checks/`.
- Correção pós-build (orquestrador): `auth-password.test.ts` chamava `request-password-reset` com o store Redis real; o ioredis ficava reconectando e o Jest não encerrava (prova pendurada). Corrigido mockando `rateLimitStore` com `MemoryStore` nesse arquivo (como os demais testes de rota) e fechando o client no shutdown (`index.ts`); `--detectOpenHandles` limpo nos arquivos novos. Commit `634bd57`.

## Testes enxugados, em 2026-11-11

- C35 aponta para `src/__tests__/proxy.test.ts`: `frontend/middleware.ts` virou `frontend/src/proxy.ts` (o Next só carrega o proxy ao lado de `src/app`) e o teste foi renomeado junto. `proxyLocation.test.ts` falha se sobrar um `middleware.ts`/`proxy.ts` fora do lugar.
- C14 e C18: "rotates the refresh token" e "cookie lasts 30 days" agora casam o mesmo teste (rotação, novo token funciona, `Max-Age=2592000`, antigo → 401).
- `consumeRefreshToken` ganhou a tabela de decisão em `tokenService.test.ts` (assinatura inválida, sessão ausente, userId diferente, `count === 0`, sessão expirada, consumido).
- Corrigidos testes que ficavam verdes com o código quebrado: "deleted user is not reactivated" (o laço não asseria nada), "deleted user gets 401" (agora confere cookie limpo e nenhuma sessão), "missing state"/"mismatched state" (+ state de tamanho diferente e state limpo no callback).
