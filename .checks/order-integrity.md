# Integridade de pedido e valores

Sources:

- `.tasks/order-integrity.md` - task decidida: 21 critérios, 7 slices, 2 decisões, 6 Unresolved
- Auditoria de segurança da conversa (sem endereço) - evidência dos P0 2, 8, 9, 10, 11 e P2 "pedido duplicado", "TOCTOU", "recálculo sem transação", "scheduler sobrescreve status", "rateio negativo"
- Decisão literal do usuário (na task): participante só marca pago com comprovante; criador e admin marcam com ou sem - fixa critérios 1 a 4 e 7

Profile: `light` (não declarado no `AGENTS.md`). Handoff: `on`, budget 150k.
Base do worktree: `a583a1b` (task `access-and-data-exposure` já construída; suas provas continuam verdes).

## Out of scope

- Centavos `Int`, entidade `Payment`, webhook, ledger, reconciliação - plano do gateway
- `AuditLog` de `isPaid`/preço/frete por não-admin - entra com o ledger
- Limites de `quantity`, `price`, `shippingCost` e casas decimais - Unresolved 4, só `.min()` como hoje
- Status pela rota admin (`admin/content.ts`) - não muda
- Trocar `onDelete: Cascade` do schema - os critérios 17/18 bloqueiam na rota; o cascade fica
- Participante desmarcar o próprio pagamento - Unresolved 2: proibido (C5)
- `shippingCost` com pedidos pagos - Unresolved 3: redistribui inclusive em pagos, sem backfill
- Log novo em rejeição de 16/20/21 - Unresolved 5: sem log
- `ADMIN` e delete de pedido pago - Unresolved 6: 9 vale para qualquer ator; 10 para dono e criador; `ADMIN` mantém o delete atual
- Duplicatas em produção antes da migração - Unresolved 1, bloqueia go-live: rodar `SELECT "campaignId","userId",count(*) FROM orders GROUP BY 1,2 HAVING count(*)>1` antes do deploy

## Landing

Backend: `routes/orders.ts`, `routes/campaigns.ts`, `routes/products.ts`, `services/shippingCalculator.ts`,
`utils/money.ts`, `services/campaignScheduler.ts`, `services/orderCleanupService.ts`, `prisma/schema.prisma` + migração.
Frontend: `PaymentProofModal`/`CampaignModals`/`useCampaignDetail` (só prova e um helper de permissão).
Reusa `AppError`/`errorHandler` (`{ status: "error", message }`), `Money`, `requireOrderOrCampaignOwnership`, `PaymentProofStorage`.

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| Um pedido por usuário por campanha no banco (task) | `@@unique([campaignId, userId])` em `Order` (substitui `@@index([campaignId, userId])`); migração `20261106120000_unique_order_per_campaign_user`: `DROP INDEX IF EXISTS "orders_campaignId_userId_idx"; CREATE UNIQUE INDEX "orders_campaignId_userId_key" ON "orders"("campaignId","userId")` | lock na aplicação - não protege 2 instâncias |
| Transições manuais de status (task) | `backend/src/utils/campaignStatusTransitions.ts`: `MANUAL_STATUS_TRANSITIONS = { ACTIVE: ["CLOSED"], CLOSED: ["ACTIVE","SENT"], SENT: ["CLOSED"], ARCHIVED: [] }`, `isManualStatusTransitionAllowed(from, to)`; aplicado em `PATCH /:idOrSlug/status` e no `status` de `PATCH /:idOrSlug`, para qualquer ator dessas rotas; mesmo status (ex. ACTIVE→ACTIVE) → 400; mensagem `Transição de status não permitida: <from> → <to>` | validar só em `/status` - o PATCH genérico ficaria aberto |
| Escrita de itens sob lock (padrão novo) | interactive transaction Prisma: `SELECT status FROM campaigns WHERE id = $1 FOR NO KEY UPDATE` → status ≠ ACTIVE = 400; `SELECT "isPaid" FROM orders WHERE id = $1 FOR UPDATE` → pago = 400; grava itens e recalcula totais da campanha na mesma tx. Usado por `POST /`, `PUT /:id`, `POST /:id/items`, `DELETE /:id/items/:itemId` | isolamento `Serializable` - exige retry de P2034 e não faz o scheduler esperar; `update` condicional na campanha - mexe em `updatedAt` |
| Recálculo de totais vira uma operação de campanha | `ShippingCalculator.recalculateCampaignTotals(tx, campaignId)`: sob o lock da campanha, recalcula `subtotal` (`Money.sum` dos itens), `shippingFee` (0 se peso 0) e `total` de **todos** os pedidos, atualizando em ordem de `id`; `distributeShipping(campaignId)` e `recalculateOrderSubtotal(orderId)` ficam como wrappers que abrem a própria tx | manter subtotal por pedido + rateio separados fora de tx - deixa parcial (14) e mantém frete antigo em pedido peso 0 (11/12) |
| Rateio de frete | `Money.distributeProportionally` passa a maior resto em centavos (floor por quota, centavos restantes por maior fração, empate → maior índice); nunca negativo, soma exata | último recebe o resto (hoje) - gera parcela negativa (`0.05`, `[1,1,1,0.0001]` → `-0.01`) |
| Duplicata concorrente | P2002 em `orders(campaignId,userId)` no `POST /api/orders` → `409` `{ status: "error", message: "Você já tem um pedido nesta campanha. Atualize a página e tente novamente." }`; com o lock da campanha a 2ª requisição normalmente vira substituição (`200`) | repetir como update automático - esconde a corrida e duplica emissão de eventos |
| Harness de prova com Postgres real (padrão novo) | `backend/jest.pg.config.js` (`testMatch: **/*.pg.test.ts`, `TEST_DATABASE_URL`); `jest.config.js` ignora `\.pg\.test\.ts$`; script `test:pg`; helper `backend/src/__tests__/pgClient.ts` | rodar no `npm test` - quebra sem banco; só mocks - não provam rollback, índice único nem intercalação |
| `DELETE /api/orders/:id` aceita o criador até o guard de pago | middleware vira `requireOrderOrCampaignOwnership`; ordem: 404 → status≠ACTIVE e não-admin = 400 → pago e não-admin = 400 → não-dono e não-admin = 403 (criador continua sem apagar pedido alheio não pago) | manter `requireOrderOwnership` - criador recebe 403, contradiz o 400 literal do critério 10 |
| Contrato de `PATCH /:id/payment` | `isPaid` validado por Zod `z.enum(["true","false"])` (ausente/outro → 400); participante (não criador nem ADMIN): `"false"` → 403 sempre, `"true"` sem arquivo → 400 | aceitar `"false"` do participante em pedido não pago - Unresolved 2 diz que só criador/ADMIN desmarcam |

- `PATCH /:id` (isPaid/isSeparated) por participante → 403 `Apenas o criador da campanha ou um administrador pode alterar pagamento ou separação` - reversível
- `POST /:id/items` com produto inexistente passa de 404 a 400 (mesmo caminho do produto de outra campanha) - reversível
- Scheduler fecha por campanha com `updateMany({ where: { id, status: "ACTIVE", deadline: { lte: now } } })` e só checa liberação de pagamento das que fechou - reversível
- `DELETE /api/products/:id` em tx: lock da campanha, `SELECT o.id, o."isPaid" ... FOR UPDATE OF o` dos pedidos com o produto, pago → 400, senão apaga e recalcula a campanha - reversível
- Front: `canMarkPaidWithoutProof(user, campaign)` em `frontend/src/lib/orderPaymentPermissions.ts`, usado por `useCampaignDetail` - reversível
- Testes existentes `orders-items-delete.test.ts` e `upload-signature.test.ts`: só o mock do prisma ganha `$transaction`/`$queryRaw`/campos se a nova implementação exigir; asserções intactas
- (build) `DELETE /api/campaigns/:idOrSlug` conta pedidos e apaga numa tx com `lockCampaignRow` - pedido novo entre a contagem e o delete espera o lock (toda criação de pedido trava a campanha); alternativa rejeitada: contar fora de tx - o cascade levaria o pedido criado no meio. Registrado depois de escrito (falha de timing do autor) - reversível
- (build) `DELETE /api/products/:id` apaga a imagem só depois da tx confirmar - um 400 não deixa produto sem imagem - reversível
- Nada mais aqui é difícil de reverter

## Checks

PG harness (provas marcadas `[pg]`), do root do worktree:
`docker run -d --rm --name sec-lane-data-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cc_test -p 55432:5432 postgres:16-alpine && until docker exec sec-lane-data-pg pg_isready -U postgres; do sleep 1; done && cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:55432/cc_test npx prisma migrate deploy`
Teardown: `docker rm -f sec-lane-data-pg`. Prefixo de cada prova `[pg]`: `cd backend && TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:55432/cc_test npx jest -c jest.pg.config.js`

### S1 - Quem marca pago · 7 files · 105 KB · ~26k

**C1** - Dono participante: `PATCH /api/orders/:id` com `isPaid` ou `isSeparated` → 403 e `order.update` não chamado (crit. 1; table-driven sobre os 2 campos)
Proof: `cd backend && npx jest src/routes/__tests__/orders-payment-rules.test.ts -t "owner cannot patch status fields"`

**C2** - Dono participante: `PATCH /:id/payment` `isPaid=true` sem arquivo → 400 e `order.update` não chamado (crit. 2)
Proof: `cd backend && npx jest src/routes/__tests__/orders-payment-rules.test.ts -t "owner without proof"`

**C3** - Dono participante: `PATCH /:id/payment` `isPaid=true` com PNG válido → 200, update com `isPaid: true` e `paymentProofKey` preenchido (crit. 3)
Proof: `cd backend && npx jest src/routes/__tests__/orders-payment-rules.test.ts -t "owner with proof"`

**C4** - Criador e ADMIN marcam `isPaid=true` sem comprovante por `/:id/payment` e por `PATCH /:id` → 200 com `isPaid: true` (crit. 4; table-driven 2 papéis × 2 rotas)
Proof: `cd backend && npx jest src/routes/__tests__/orders-payment-rules.test.ts -t "creator and admin mark paid"`

**C5** - Pedido pago, dono participante envia `isPaid=false` em `/:id/payment` → 403, sem `order.update` e sem apagar o comprovante (crit. 5)
Proof: `cd backend && npx jest src/routes/__tests__/orders-payment-rules.test.ts -t "owner cannot unmark paid"`

**C6** - `PATCH /:id/payment` sem `isPaid` → 400 e nada muda (crit. 6)
Proof: `cd backend && npx jest src/routes/__tests__/orders-payment-rules.test.ts -t "missing isPaid"`

**C7** - `canMarkPaidWithoutProof`: participante `false`, criador `true`, ADMIN `true` (crit. 7, decisão por papel; table-driven)
Proof: `cd frontend && npx vitest run src/lib/__tests__/orderPaymentPermissions.test.ts -t "mark paid without proof by role"`

**C8** - `CampaignModals` passa `onMarkPaidWithoutProof` ao `PaymentProofModal` só com `canMarkPaidWithoutProof=true` (crit. 7, fiação)
Proof: `cd frontend && npx vitest run src/views/campaign-detail/__tests__/CampaignModals.test.tsx -t "mark paid without proof wiring"`

**C9** - `PaymentProofModal` sem `onMarkPaidWithoutProof` não mostra "Marcar como Pago sem Comprovante"; com ele, mostra (crit. 7, tela)
Proof: `cd frontend && npx vitest run src/views/campaign-detail/modals/__tests__/PaymentProofModal.test.tsx -t "without proof button"`

### S2 - Pedido só contém produtos da própria campanha · 1 file · 28 KB · ~7k

**C10** - `POST /api/orders`, `PUT /api/orders/:id`, `POST /api/orders/:id/items` com `productId` de outra campanha → 400 e nenhum item/pedido gravado (crit. 8; table-driven sobre as 3 rotas)
Proof: `cd backend && npx jest src/routes/__tests__/orders-integrity.test.ts -t "product from another campaign"`

### S3 - Pedido pago não muda de valor · 2 files · 36 KB · ~9k

**C11** - Pedido pago: `PUT /:id`, `POST /:id/items`, `DELETE /:id/items/:itemId`, `POST /` (substituição) → 400 e nenhum item apagado/criado nem total alterado, para dono e ADMIN (crit. 9; table-driven 4 rotas × 2 atores)
Proof: `cd backend && npx jest src/routes/__tests__/orders-integrity.test.ts -t "paid order is locked"`

**C12** - Pedido pago: `DELETE /:id` pelo dono ou pelo criador → 400 e `order.delete` não chamado (crit. 10; table-driven 2 atores)
Proof: `cd backend && npx jest src/routes/__tests__/orders-integrity.test.ts -t "paid order cannot be deleted"`

### S4 - Totais batem com itens e frete · 3 files · 13 KB · ~4k

**C13** - Pedido com peso 0 e subtotal 50.00 → `shippingFee = 0`, `total = 50.00` após o recálculo (crit. 11)
Proof: `cd backend && npx jest src/services/__tests__/shippingCalculator.test.ts -t "zero weight order"`

**C14** - Pedido esvaziado → `subtotal = 0`, `shippingFee = 0`, `total = 0` após o recálculo (crit. 12)
Proof: `cd backend && npx jest src/services/__tests__/shippingCalculator.test.ts -t "emptied order"`

**C15** - `distributeProportionally`: soma = total e nenhuma parcela < 0; `0.05` com `[1,1,1,0.0001]` sem negativo; 2000 casos pseudo-aleatórios com semente fixa (crit. 13, regra)
Proof: `cd backend && npx jest src/utils/money.test.ts -t "never negative and sums exactly"`

**C16** - Recálculo da campanha com `shippingCost = 0.05` e pesos `[1,1,1,0.0001]`: soma de `shippingFee` = 0.05, nenhuma < 0 (crit. 13, pedidos)
Proof: `cd backend && npx jest src/services/__tests__/shippingCalculator.test.ts -t "fees sum to shipping cost"`

**C17** - `[pg]` Falha no 2º update do recálculo → todos os pedidos mantêm `shippingFee` e `total` anteriores (crit. 14)
Proof: PG harness + `[pg] src/services/__tests__/shippingCalculator.pg.test.ts -t "rolls back partial recalculation"`

### S5 - Status da campanha segue as transições da UI · 3 files · 47 KB · ~12k

**C18** - `PATCH /api/campaigns/:idOrSlug/status` e `PATCH /api/campaigns/:idOrSlug` com `status`: as 4 transições permitidas → 200 com update; as outras 12 de 16 pares → 400 sem update (crit. 15; table-driven 16 pares × 2 rotas)
Proof: `cd backend && npx jest src/routes/__tests__/campaigns-status-transitions.test.ts -t "status transitions"`

**C19** - `[pg]` Campanha que virou `SENT` entre a leitura e a escrita do scheduler continua `SENT`; a outra vencida `ACTIVE` vira `CLOSED` (crit. 16)
Proof: PG harness + `[pg] src/services/__tests__/campaignScheduler.pg.test.ts -t "does not overwrite status changed after read"`

### S6 - Registros financeiros não somem · 4 files · 57 KB · ~14k

**C20** - `DELETE /api/campaigns/:id` com ≥ 1 pedido → 400 `Não é possível deletar uma campanha com pedidos. Arquive-a em vez disso.` e `campaign.delete` não chamado (crit. 17)
Proof: `cd backend && npx jest src/routes/__tests__/campaigns-delete.test.ts -t "campaign with orders"`

**C21** - `DELETE /api/products/:id` com item em pedido pago → 400 e `product.delete` não chamado (crit. 18, bloqueio)
Proof: `cd backend && npx jest src/routes/__tests__/products-delete.test.ts -t "product in paid order"`

**C22** - `[pg]` `DELETE /api/products/:id` sem pedido pago → itens removidos e `subtotal`, `shippingFee`, `total` dos pedidos afetados recalculados (crit. 18, recálculo)
Proof: PG harness + `[pg] src/routes/__tests__/products-delete.pg.test.ts -t "recalculates affected orders"`

**C23** - `[pg]` `cleanupEmptyOrders` não apaga pedido vazio antigo com `isPaid=true` (e apaga o não pago) (crit. 19)
Proof: PG harness + `[pg] src/services/__tests__/orderCleanupService.pg.test.ts -t "keeps paid orders"`

### S7 - Concorrência na criação de pedido · 3 files · 45 KB · ~11k

**C24** - `[pg]` Dois `POST /api/orders` paralelos do mesmo usuário/campanha → exatamente 1 pedido para o par e cada resposta ∈ {200, 201, 409} (crit. 20)
Proof: PG harness + `[pg] src/routes/__tests__/orders-concurrency.pg.test.ts -t "parallel create keeps one order"`

**C25** - `[pg]` O banco rejeita segundo pedido com o mesmo (`campaignId`, `userId`) (crit. 20, índice)
Proof: PG harness + `[pg] src/routes/__tests__/orders-concurrency.pg.test.ts -t "unique campaign user"`

**C26** - P2002 no create do `POST /api/orders` → 409 `{ status: "error", message }` (crit. 20, mapeamento)
Proof: `cd backend && npx jest src/routes/__tests__/orders-integrity.test.ts -t "duplicate order returns 409"`

**C27** - `[pg]` Campanha fechada depois da leitura inicial e antes da gravação → `POST /api/orders` 400 e nenhum pedido ou item gravado (crit. 21)
Proof: PG harness + `[pg] src/routes/__tests__/orders-concurrency.pg.test.ts -t "closed during request"`

## Swept

- validation: C6, C10
- failure modes: C17, C27
- idempotency and retry: C24, C26
- authorization: C1, C4, C5, C7, C8, C9
- concurrency and ordering: C19, C24, C27 (lock de campanha/pedido na tx de itens - Landing)
- data lifecycle: C20, C21, C22, C23
- external-dependency failure: n/a - nenhuma dependência externa nova; upload coberto por `access-and-data-exposure`
- state transitions: C18, C19; pagamento: C3, C4, C5
- observability: Unresolved 5 - sem log novo

## Coverage

- Claims naming a status code, route or response shape: C1-C6, C10-C12, C18, C20, C21, C22, C24, C26, C27 - cada prova cruza a rota via supertest
- C13-C16 provam no `ShippingCalculator`/`Money`, não na rota; light não exige a junção

## Handoff

Aritmética (wc -c/4 dos arquivos tocados, piso): S1 ~26k, S2 ~7k (orders.ts já lido), S3 ~9k, S4 ~4k, S5 ~12k, S6 ~14k, S7 ~11k = ~83k. Cabe num batch de 150k; sem handoff, um agente constrói S1-S7.

- Onde parou: batch único, S1-S7 construídos; C1-C27 verdes em `bd98547` (base `a583a1b`; commits `7806b1f` S4, `85d0b01` S1, `aa5989e` S2/S3/C26, `7379b08` S7, `92aeba6` S5, `bd98547` S6)
- Decidido no meio do build pelo usuário: nada
- Abandonado: checar pago/status fora de tx em `DELETE /:id/items` para não mexer no mock de `orders-items-delete.test.ts` - descartado por consistência com as outras 3 rotas de itens; o mock ganhou `$transaction`/`$queryRaw`/`recalculateCampaignTotals`, asserções intactas

