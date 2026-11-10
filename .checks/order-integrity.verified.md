# Integridade de pedido e valores - Verificação

**Verdict**: PASS (27/27 checks provados; 1 Swept existing não encontrado no código)
**Profile**: light (não declarado no `AGENTS.md`) - passo 1 (ui), junção `Coverage`, `Test policy` e fault injection não rodam neste profile
**Diff range**: 7ea7b59..028af21
**Round**: 1 - full
**Verifier**: sub-agente independente (author != verifier)

## Binding sources

Passo 1 não roda (profile `light`). Critério da task → check: os 21 critérios de `.tasks/order-integrity.md` têm check (1→C1, 2→C2, 3→C3, 4→C4, 5→C5, 6→C6, 7→C7/C8/C9, 8→C10, 9→C11, 10→C12, 11→C13, 12→C14, 13→C15/C16, 14→C17, 15→C18, 16→C19, 17→C20, 18→C21/C22, 19→C23, 20→C24/C25/C26, 21→C27). Nenhum critério sem check.

## Checks

Provas em `HEAD` 028af21. Não-`[pg]`: backend numa invocação `timeout 900 npx jest --json` (cada teste conferido por `fullName` contra o `-t` do check); frontend numa invocação `vitest --run --configLoader runner --reporter=json`. `[pg]`: Postgres 16 real em container `sec-verify-pg` (porta 55440), `prisma migrate deploy` (33 migrações, "schema is up to date"), uma invocação `TEST_DATABASE_URL=... timeout 600 npx jest -c jest.pg.config.js <5 arquivos> -t "<7 nomes>"` - 7 passed, 1 skipped (fora do filtro). Todos os arquivos de prova criados ou alterados no diff.

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | dono: `PATCH /:id` `isPaid`/`isSeparated` → 403, sem update | jest `orders-payment-rules.test.ts` "owner cannot patch status fields" - 2 passed | `orders-payment-rules.test.ts:115` - `toBe(403)`; `:116` - `expect(mockPrisma.order.update).not.toHaveBeenCalled()` | PASS |
| C2 | dono sem arquivo → 400 | idem "owner without proof" - 1 passed | `:124` - `toBe(400)`; `:125` - `order.update).not.toHaveBeenCalled()` | PASS |
| C3 | dono com PNG → 200, `isPaid` e `paymentProofKey` | idem "owner with proof" - 1 passed | `:136` - `toBe(200)`; `:137` - `res.body.isPaid).toBe(true)`; `:140-144` - `data: expect.objectContaining({ isPaid: true, paymentProofKey: expect.any(String) })` | PASS |
| C4 | criador/ADMIN × 2 rotas sem comprovante → 200 | idem "creator and admin mark paid" - 4 passed | `:148-151` (tabela 2×2); `:162` - `toBe(200)`; `:163` - `isPaid).toBe(true)` | PASS |
| C5 | dono desmarcar pago → 403, comprovante mantido | idem "owner cannot unmark paid" - 1 passed | `:175` - `toBe(403)`; `:176` - `order.update` não chamado; `:177` - `expect(mockProofDelete).not.toHaveBeenCalled()` | PASS |
| C6 | sem `isPaid` → 400 | idem "missing isPaid" - 3 passed | `:189` - `toBe(400)`; `:190-192` - sem update, sem delete, `readdirSync(privateDir)).toEqual([])` | PASS |
| C7 | `canMarkPaidWithoutProof` por papel | vitest `orderPaymentPermissions.test.ts` "mark paid without proof by role" - 4 passed | `orderPaymentPermissions.test.ts:8-11` (participant `false`, creator `true`, admin `true`, anonymous `false`); `:13` - `expect(canMarkPaidWithoutProof(user, campaign)).toBe(expected)` | PASS |
| C8 | fiação `onMarkPaidWithoutProof` | vitest `CampaignModals.test.tsx` "mark paid without proof wiring" - 2 passed | `CampaignModals.test.tsx:153` - `expect(props.onMarkPaidWithoutProof).toBe(flag ? hook.handleMarkPaidWithoutProof : undefined)` | PASS |
| C9 | botão "sem comprovante" só com a prop | vitest `PaymentProofModal.test.tsx` "without proof button" - 2 passed | `PaymentProofModal.test.tsx:23` - `queryByRole("button", { name: /sem comprovante/i })).not.toBeInTheDocument()`; `:29` - `getByRole(... /marcar como pago sem comprovante/i)).toBeInTheDocument()` | PASS |
| C10 | produto de outra campanha (3 rotas) → 400, nada gravado | jest `orders-integrity.test.ts` "product from another campaign" - 6 passed | `orders-integrity.test.ts:154-156` (3 rotas); `:162`/`:171` - `toBe(400)`; `expectNoItemWrites()` `:117-122` (sem `orderItem.create/createMany/deleteMany`, `order.create/update`, recálculo) | PASS |
| C11 | pedido pago: 4 rotas × dono/ADMIN → 400 | idem "paid order is locked" - 8 passed | `:176-179` (4 rotas), `:182` (owner, admin); `:194` - `toBe(400)` + `expectNoItemWrites()` (a rota de item usa `deleteMany`, `orders.ts:806`, coberto em `:119`) | PASS |
| C12 | pedido pago: `DELETE /:id` dono/criador → 400 | idem "paid order cannot be deleted" - 2 passed | `:216` - `toBe(400)`; `:217-218` - `order.delete`/`deleteMany` não chamados | PASS |
| C13 | peso 0, subtotal 50 → fee 0, total 50 | jest `shippingCalculator.test.ts` "zero weight order" - 1 passed | `shippingCalculator.test.ts:45` - `expect(updates.get("o-zero")).toEqual({ subtotal: 50, shippingFee: 0, total: 50 })` | PASS |
| C14 | pedido esvaziado → 0/0/0 | idem "emptied order" - 1 passed | `:57` - `toEqual({ subtotal: 0, shippingFee: 0, total: 0 })` | PASS |
| C15 | `distributeProportionally` nunca negativo, soma exata, 2000 casos semente fixa | jest `money.test.ts` "never negative and sums exactly" - 1 passed | `money.test.ts:142-144` - exemplo `0.05`/`[1,1,1,0.0001]`, `toBeGreaterThanOrEqual(0)` e soma `toBe(5)` centavos; `:146-147` - `seeded(20261106)`, `i < 2000`; `:159`, `:162` - `>= 0` e `toBe(toCents(total))` | PASS |
| C16 | recálculo `0.05` com pesos `[1,1,1,0.0001]` | jest `shippingCalculator.test.ts` "fees sum to shipping cost" - 1 passed | `:70-72` - 4 fees, `toBeGreaterThanOrEqual(0)`, soma em centavos `toBe(5)` | PASS |
| C17 | `[pg]` falha no 2º update → valores anteriores | pg "rolls back partial recalculation" - passed | `shippingCalculator.pg.test.ts:50` - `rejects.toThrow("boom on second update")`; `:56-57` - `shippingFee).toBe(999)`, `total).toBe(1998)` | PASS |
| C18 | 16 pares × 2 rotas: 4 → 200, 12 → 400 | jest `campaigns-status-transitions.test.ts` "status transitions" - 32 passed | `:48` - `ALLOWED = new Set(["ACTIVE→CLOSED","CLOSED→ACTIVE","CLOSED→SENT","SENT→CLOSED"])`; `:76` - `toBe(expected)`; `:78` - `statusWrites()).toEqual([to])`; `:80-81` - shape de erro e `toEqual([])` | PASS |
| C19 | `[pg]` scheduler não sobrescreve `SENT` | pg "does not overwrite status changed after read" - passed | `campaignScheduler.pg.test.ts:34` - `status).toBe("SENT")`; `:35` - `toBe("CLOSED")`; `:36` - `closed).toBe(1)` | PASS |
| C20 | campanha com pedidos → 400 + mensagem, nada apagado | jest `campaigns-delete.test.ts` "campaign with orders" - 1 passed | `campaigns-delete.test.ts:48` - `toBe(400)`; `:49-52` - `toEqual({ status: "error", message: "Não é possível deletar uma campanha com pedidos. Arquive-a em vez disso." })`; `:53` - `campaign.delete` não chamado | PASS |
| C21 | produto em pedido pago → 400 | jest `products-delete.test.ts` "product in paid order" - 1 passed | `products-delete.test.ts:70` - `toBe(400)`; `:71-73` - `product.delete`/`deleteMany` e `orderItem.deleteMany` não chamados | PASS |
| C22 | `[pg]` produto sem pago → itens removidos e totais recalculados | pg "recalculates affected orders" - passed | `products-delete.pg.test.ts:52` - `toBe(204)`; `:54` - `orderItem.count(...)).toBe(0)`; `:60-62` - `toMatchObject({ subtotal: 10, shippingFee: 10, total: 20 })` etc. | PASS |
| C23 | `[pg]` cleanup não apaga pago | pg "keeps paid orders" - passed | `orderCleanupService.pg.test.ts:24` - `deleted).toBe(1)`; `:25` - pago `not.toBeNull()`; `:26` - não pago `toBeNull()` | PASS |
| C24 | `[pg]` 2 POST paralelos → 1 pedido, status ∈ {200,201,409} | pg "parallel create keeps one order" - passed | `orders-concurrency.pg.test.ts:63` - `expect([200, 201, 409]).toContain(res.status)`; `:65` - `order.count(...)).toBe(1)` | PASS |
| C25 | `[pg]` índice único rejeita 2º pedido | pg "unique campaign user" - passed | `orders-concurrency.pg.test.ts:74-76` - `rejects.toMatchObject({ code: "P2002" })` | PASS |
| C26 | P2002 → 409 `{ status, message }` | jest `orders-integrity.test.ts` "duplicate order returns 409" - 1 passed | `orders-integrity.test.ts:252` - `toBe(409)`; `:253` - `toEqual({ status: "error", message: expect.any(String) })` | PASS |
| C27 | `[pg]` campanha fechada no meio → 400, nada gravado | pg "closed during request" - passed | `orders-concurrency.pg.test.ts:97` - `toBe(400)`; `:98-99` - `order.count` e `orderItem.count` `toBe(0)` | PASS |

## Findings

1. **Swept existing ausente no código** - Observable "tela detalhe da campanha | ação destrutiva (apagar campanha) confirma antes | existing - modal de confirmação atual" (`.tasks/order-integrity.md:110`): não há UI que apague campanha. `campaignService.delete` (`frontend/src/api/services/campaign.service.ts:80`) e `adminService.deleteCampaign` (`admin.service.ts:47`) não têm chamador no `frontend/src` (busca `rg "campaignService\.delete\(|deleteCampaign\("` sem hit fora da definição; igual em `7ea7b59`). A restrição citada não existe; risco baixo (a ação não é exposta), mas a linha está errada.
2. Fiação `useCampaignDetail` → `canMarkPaidWithoutProof` (`frontend/src/views/campaign-detail/useCampaignDetail.ts:284`) está no código, mas nenhum check a prova: C7 prova o helper, C8 recebe o flag de um hook falso. Elo sem prova, de baixo risco.

## Swept existing re-read

| Row | Constraint citada | No código |
|---|---|---|
| States `SENT → ARCHIVED` / `ARCHIVED → SENT` (campaignStatusService) | `backend/src/services/campaignStatusService.ts:84` (`data: { status: 'ARCHIVED' }`), `:174` (`data: { status: 'SENT' }`) | presente |
| "APIs acima - error shape" `{ status: "error", message }` | `backend/src/middleware/errorHandler.ts:22-26` | presente |
| "erro ao editar pedido pago" → `toast.error(getApiErrorMessage(...))` | `frontend/src/hooks/useOrderModal.ts:151`, `frontend/src/views/campaign-detail/useCampaignDetail.ts:535` | presente |
| "apagar campanha confirma antes" → modal atual | sem UI de apagar campanha | **ausente** (finding 1) |
| `campaignScheduler` falha no meio → captura e loga por ciclo | `backend/src/services/campaignScheduler.ts:48-49` (catch por campanha), `:62-63` (catch do ciclo) | presente |

## Gate

- `npm test --workspace=backend` (`timeout 900`): 324 passed, 1 skipped, 0 failed
- `npm run test:pg` (os 5 arquivos `*.pg.test.ts`, Postgres real): 7 passed, 1 skipped (fora do filtro `-t`), exit 0
- `npm test --workspace=frontend`: 754 passed, 2 skipped, 1 failed - `OrdersTab.test.tsx` "should show view button on all orders for creator", pré-existente (falha igual em `7ea7b59`)
- `npx tsc --noEmit` backend e frontend: exit 0
- Containers `sec-verify-pg`/`sec-verify-redis` removidos; porcelain igual ao início
