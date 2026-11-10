# Acesso e exposição de dados - Verificação

**Verdict**: PASS (26/26 checks provados; 1 level gap declarado, não fechável no código)
**Profile**: light (não declarado no `AGENTS.md`) - passo 1 (ui), junção `Coverage`, `Test policy` e fault injection não rodam neste profile
**Diff range**: 7ea7b59..028af21
**Round**: 1 - full
**Verifier**: sub-agente independente (author != verifier)

## Binding sources

Passo 1 não roda (profile `light`). Critério da task → check: os 18 critérios de `.tasks/access-and-data-exposure.md` têm check (1→C1, 2→C2, 3→C3, 4→C4, 5→C5, 6→C6, 7→C7, 8→C8, 9→C9/C10, 10→C11, 11→C12, 12→C13, 13→C14/C15, 14→C16/C17, 15→C18/C19/C20, 16→C22/C23/C24, 17→C25, 18→C26). Nenhum critério sem check.

## Checks

Provas rodadas em `HEAD` 028af21: backend numa invocação `timeout 900 npx jest --json` (suíte inteira; cada teste nomeado conferido por `fullName` contra o regex do `-t` do check), frontend numa invocação `timeout 900 npx vitest --run --configLoader runner --reporter=json`. Todos os arquivos de prova foram criados ou alterados no diff (os testes nomeados de `orders-public`, `OrderModals`, `OverviewTab` foram adicionados no diff).

| Check | Claim | Proof run | Evidence | Result |
|---|---|---|---|---|
| C1 | anônimo não entra em `order-<id>` nem recebe `message-sent` | jest `socketService.test.ts` "anonymous join-order" - 1 passed | `socketService.test.ts:144` - `expect(await roomSize(\`order-${ORDER_ID}\`)).toBe(0)`; `:147` - `expect(received).toHaveLength(0)` (helper `joinOrderDenied`, chamado em `:153`) | PASS |
| C2 | estranho autenticado negado | idem "stranger join-order" - 1 passed | `socketService.test.ts:144`, `:147` (mesmo helper, teste `:158`) | PASS |
| C3 | dono, criador, ADMIN recebem | idem "allowed join-order" - 3 passed (owner/creator/admin) | `socketService.test.ts:163` `it.each(["owner","creator","admin"])`; `:170` - `expect(received[0]).toEqual({ id: "msg-1", message: "oi" })` | PASS |
| C4 | 4 eventos `order-*` = `{ orderId, campaignId }` | idem "order event payload" - 4 passed | `socketService.test.ts:184-187` (4 emitters); `:195` - `expect(received[0]).toEqual({ orderId: ORDER_ID, campaignId: CAMPAIGN_ID })` | PASS |
| C5 | nenhuma chave sensível em `campaign-<id>` | idem "campaign room never carries sensitive keys" - 8 passed | `socketService.test.ts:199-206` (8 emitters, payloads com `email`/`paymentProofKey`); `:218` - `expect(keys.has(key)).toBe(false)` | PASS |
| C6 | `creator-typing` sem pedido não chega; com pedido chega | idem "creator-typing" - 2 passed | `socketService.test.ts:232` - `expect(received).toHaveLength(0)`; `:247` - `expect(received[0]).toEqual({ creatorId: ..., isTyping: true })` | PASS |
| C7 | item de outro pedido → 404, item fica | jest `orders-items-delete.test.ts` "item from another order" - 1 passed | `orders-items-delete.test.ts:93` - `expect(res.status).toBe(404)`; `:94` - `expect(items.find((item) => item.id === "item-i")).toBeDefined()` | PASS |
| C8 | body `orderId` sem acesso → 403, nada criado | jest `messages-access.test.ts` "body orderId without access" - 1 passed | `messages-access.test.ts:68` - `toBe(403)`; `:69` - `expect(mockOrderMessageCreate).not.toHaveBeenCalled()` | PASS |
| C9 | JSON-LD escapado, só 2 `<script>` | vitest `page.test.tsx` "escapes user content in JSON-LD" - 1 passed | `page.test.tsx:40` - `expect(html).toContain("\\u003c/script>")`; `:43` - `expect(html.match(/<script/g)).toHaveLength(2)`; payload em `name`/`description`/`creator.name` (`:21-25`) | PASS |
| C10 | `StructuredData` escapa `<` | vitest `StructuredData.test.tsx` "escapes" - 2 passed | `StructuredData.test.tsx:18` - `toContain("\\u003c/script>")`; `:19` - `toHaveLength(1)` | PASS |
| C11 | bytes não-imagem → 400, nada gravado (3 rotas) | jest `upload-signature.test.ts` "rejects non-image bytes" - 3 passed | `upload-signature.test.ts:108-118` (avatar, campanha, comprovante com `contentType: "image/png"`); `:124` - `toBe(400)`; `:125-126` - `expect(listFiles(publicDir)).toEqual([])` / `privateDir` | PASS |
| C12 | extensão do tipo detectado | jest `fileUpload.test.ts` "extension from detected type" - 6 passed | `fileUpload.test.ts:45` - `toMatch(new RegExp(\`^campaigns/[^/]+\\.${extension}$\`))` com `originalname` `evil.html`; `:53` - `toMatch(/^payment-proofs\/[^/]+\.pdf$/)` | PASS |
| C13 | `/uploads/*` com nosniff | jest `uploadsStatic.test.ts` "nosniff" - 2 passed | `uploadsStatic.test.ts:40`, `:46` - `expect(res.headers["x-content-type-options"]).toBe("nosniff")` | PASS |
| C14 | estranho → 403 | jest `orders-payment-proof.test.ts` "forbidden for stranger" - 1 passed | `orders-payment-proof.test.ts:101` - `toBe(403)`; `:102` - `expect(mockGetSignedUrl).not.toHaveBeenCalled()` | PASS |
| C15 | 3 papéis × S3 302 (300 s) / LOCAL 200 | idem "allowed roles" - 6 passed | `:111` - `toBe(302)`; `:112` - `expect(res.headers.location).toBe(SIGNED_URL)`; `:113-117` - `toHaveBeenCalledWith(..., { expiresIn: 300 })`; `:130-131` - `toBe(200)` + `Buffer.compare(res.body, PNG_BYTES)).toBe(0)` | PASS |
| C16 | comprovante S3 sem `ACL` | jest `fileUpload.test.ts` "payment proof S3 without ACL" - 1 passed | `fileUpload.test.ts:83` - `expect(uploadParams[0]).not.toHaveProperty("ACL")` | PASS |
| C17 | LOCAL em `PRIVATE_UPLOAD_DIR`; `/uploads/payment-proofs/*` 404 | jest `uploadsStatic.test.ts` "payment proof not served" - 2 passed | `uploadsStatic.test.ts:53-54` - existe em `privateDir`, não em `publicDir`; `:57`, `:65` - `toBe(404)` (novo e legado) | PASS |
| C18 | `paymentProofUrl = /api/orders/<id>/payment-proof` | jest `upload-signature.test.ts` "payment proof url is the endpoint" - 1 passed | `upload-signature.test.ts:143-147` - `data: expect.objectContaining({ paymentProofUrl: "/api/orders/o-1/payment-proof" })` | PASS |
| C19 | migração S3 `PutObjectAcl private`, LOCAL movido, URL opaca | jest `paymentProofMigration.test.ts` "migrates" - 1 passed | `paymentProofMigration.test.ts:63` - `toEqual({ Bucket: "bucket", Key: "payment-proofs/s3.png", ACL: "private" })`; `:65-66` (sai de public, bytes em private); `:67-68` - `paymentProofUrl).toBe("/api/orders/o-s3/payment-proof")` | PASS |
| C20 | migração idempotente | idem "idempotent" - 2 passed | `paymentProofMigration.test.ts:84` - `expect(second).toMatchObject({ failed: 0, missing: 0 })` + `expectMigratedState()` (`:60-68`) | PASS |
| C21 | front carrega comprovante por blob, PDF por `blob.type` | vitest `OrderModals.test.tsx` "payment proof from endpoint" - 3 passed | `OrderModals.test.tsx:584` - `toHaveAttribute('src', 'blob:proof-1')`; `:585` - `mockGetPaymentProof).toHaveBeenCalledWith('order-proof')`; `:594` - `expect(frame.tagName).toBe('IFRAME')` | PASS |
| C22 | visibilidade do PIX (7 cenários × 2 rotas) | jest `campaigns-pix.test.ts` "pix visibility" - 22 passed | `campaigns-pix.test.ts:57-65` (cenários com `seesPix` literal); `:87` - `expect(body[key]).toBe(PIX[key])` / `:89` - `expect(body).not.toHaveProperty(key)`; detalhe `:106`, lista `:115-116` | PASS |
| C23 | `hasPixConfigured` nas duas rotas | idem "hasPixConfigured" - 8 passed | `campaigns-pix.test.ts:126-127` - `toBe(true)` em detalhe e lista; `:135` - `toBe(false)` sem PIX | PASS |
| C24 | aviso de login com `hasPixConfigured` sem `pixKey` | vitest `OverviewTab.test.tsx` "login notice from hasPixConfigured" - 2 passed | `OverviewTab.test.tsx:730` - `getByText("Esta campanha possui pagamento via PIX")).toBeInTheDocument()`; `:750` - `not.toBeInTheDocument()` | PASS |
| C25 | pedido alheio sem `id`/`userId`; próprio mantém | jest `orders-public.test.ts` "only own order keeps id and userId" - 1 passed | `orders-public.test.ts:226-227` - `not.toHaveProperty("id")`/`("userId")`; `:228-229` - `toHaveProperty("id", "order-2")`/`("userId", "user-2")` | PASS |
| C26 | admin detail sem segredos | jest `admin-users-detail.test.ts` "omits secrets" - 1 passed | `admin-users-detail.test.ts:46-48` - `not.toHaveProperty("password"/"pendingEmailToken"/"googleId")` | PASS |

## Findings

1. **Level gap (declarado no checklist, `Coverage`)** - crit. 14/15 "GET direto na URL do objeto S3 responde 403": provado só como "upload sem `ACL`" (C16) e "`PutObjectAcl` `private`" (C19) com S3 mockado. Uma bucket policy pública anularia; não fechável no código. Aceito como limitação de infra, não como falha da build.
2. C15 302 → navegador: depende do CORS do bucket (declarado; fora do código).

## Swept existing re-read

| Row | Constraint citada | No código |
|---|---|---|
| Observable "error shape and codes" do `GET /api/orders/:id/payment-proof` → existing `{ status: "error", message }` | `backend/src/middleware/errorHandler.ts:22-26` (`AppError` → `{ status: 'error', message }`); rota em `backend/src/routes/orders.ts:824`; asserido em `orders-payment-proof.test.ts:143` | presente |

## Gate

- `npm test --workspace=backend` (= `jest`, `timeout 900`): 48 suites passed, 1 skipped (`rateLimitStore.redis.test.ts`, pula sem env) - 324 passed, 1 skipped, 0 failed
- `npm test --workspace=frontend` (`vitest --run --configLoader runner`): 754 passed, 2 skipped, 1 failed - `OrdersTab.test.tsx` "should show view button on all orders for creator", **pré-existente**: falha igual em `7ea7b59` (worktree temporário + `npm ci`, removido); `OrdersTab*` não tocado no diff
- `npx tsc --noEmit` backend: exit 0; frontend: exit 0
- Árvore: `git status --porcelain` igual ao início (` M .gitignore`, `?? .checks/`); `frontend/next-env.d.ts` e `frontend/tsconfig.tsbuildinfo` regenerados por `next build`/`tsc` foram restaurados
