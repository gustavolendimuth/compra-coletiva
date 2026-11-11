# Acesso e exposição de dados

Sources:

- `.tasks/access-and-data-exposure.md` - task decidida: 18 critérios, 5 slices, 3 decisões, 3 Unresolved
- Auditoria de segurança da conversa (sem endereço) - evidência dos P0 1, 3, 4, 5, 6, 7 e P1 "vazamento de dados"

Profile: `light` (não declarado no `AGENTS.md`). Handoff: `on`, budget 150k.

## Out of scope

- Organizador criando pedido com e-mail de usuário existente (`orders.ts` POST `/`) - Unresolved 1, comportamento atual continua
- `GET /campaign-messages` mostrando `sender.name` com `hideNameInCampaigns=true` (L1) - sem critério
- Rate limit de upload e do endpoint de comprovante - task `auth-hardening`
- Marcar pago / travar pedido pago / troca concorrente de comprovante - task `order-integrity`
- Erro de `join-order` para o cliente - Unresolved 2: negado = silencioso, sem evento
- Arquivo órfão ao apagar pedido/conta e falha do S3 ao assinar - Unresolved 3: órfão fica como hoje (agora privado); falha ao assinar = 500 genérico do `errorHandler`

## Landing

Backend: `socketService.ts` (salas, emitters), `routes/orders.ts`, `routes/messages.ts`, `middleware/authMiddleware.ts`,
`routes/campaigns.ts`, `routes/admin/users.ts`, `routes/profile.ts`, `services/imageUploadService.ts`, `index.ts`.
Frontend: `app/(main)/campanhas/[slug]/page.tsx`, `components/seo/StructuredData.tsx`, `OverviewTab.tsx`,
`lib/paymentRelease.ts`, modais de comprovante. Reusa `AppError`/`errorHandler`, `requireOrderOrCampaignOwnership`,
`optionalAuth`, `ImageStorageType` (sem schema novo).

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| Payload dos eventos `order-*` em `campaign-<id>` (task) | `{ orderId: string, campaignId: string }`; emitters passam a receber `(campaignId, orderId)` | payload completo filtrado por destinatário - exige salas por usuário e o único consumidor (`useRealtimeUpdates`) descarta o payload |
| Endpoint do comprovante (task) | `GET /api/orders/:id/payment-proof` → `302` para URL assinada S3 `expiresIn: 300`, ou `200` com o arquivo (LOCAL); `403`/`404` no shape `{ status: "error", message }` | URL S3 pública com nome aleatório - link vazado vale para sempre |
| Detecção de tipo (task) | `backend/src/utils/fileSignature.ts`: JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF....WEBP`, PDF `%PDF-` | dependência `file-type` - ESM-only, backend é `commonjs` |
| Nova dependência de assinatura S3 | `@aws-sdk/s3-request-presigner@3.946.0` (mesma versão do `client-s3`) em `backend` | assinar à mão com `@smithy/signature-v4` - dependência transitiva não declarada, API interna |
| Nova devDependency de teste | `socket.io-client@^4.8.1` em `backend` devDependencies, para provas que cruzam o socket real | sockets falsos - a prova não cruzaria a fronteira de sala/evento |
| `Order.paymentProofUrl` passa a ser opaco | sempre `/api/orders/<orderId>/payment-proof` quando há comprovante | `null` - quebra a checagem de verdade em `useOrderModal.ts:508` e a condição de render em `OrderModals.tsx:376`; a chave do storage - expõe caminho interno |
| Diretório local privado | `PRIVATE_UPLOAD_DIR` (env), default `<cwd>/private-uploads`; comprovantes em `<private>/payment-proofs/` | subpasta dentro de `UPLOAD_DIR` com exclusão no static - viola C14 ("fora do diretório servido") |
| Montagem do `/uploads` vira um módulo | `backend/src/utils/uploadsStatic.ts` → `mountUploadsStatic(app, dir)` usado por `index.ts` e pelos testes, com `X-Content-Type-Options: nosniff` | `express.static` inline em `index.ts` - o teste não teria como montar a mesma assembly (index.ts sobe o servidor ao importar) |
| Sanitização dos emitters da sala da campanha | todo emit em `campaign-<id>` passa por `stripSensitiveKeys` (remove `email`, `pixKey`, `pixName`, `pixType`, `paymentProofUrl`, `paymentProofKey` em qualquer nível) | confiar em cada chamador - deriva quando alguém passar um objeto Prisma inteiro de novo |
| `hasPixConfigured` | `Boolean(pixKey && pixType)` na campanha, sempre presente em `GET /api/campaigns[/:idOrSlug]`; a regra de `ARCHIVED` fica no front | incluir status no booleano - mistura "configurado" com "visível" |
| Migração de comprovantes | lógica em `backend/src/services/paymentProofMigration.ts` (testável, jest `roots: src`), runner `backend/scripts/migrate-payment-proofs-private.ts` via `tsx` | só script em `scripts/` - jest não alcança `scripts/` |
| Front carrega comprovante pelo endpoint | `orderApi.getPaymentProof(orderId)` → `apiClient.get(..., { responseType: "blob", withCredentials: false })` → object URL; PDF por `blob.type` | `<img src>` direto - não carrega `Authorization`; checar `.pdf` na URL - URL agora é opaca |

| `/uploads/payment-proofs/*` bloqueado já no deploy (antes da migração) | `mountUploadsStatic` responde `404` nesse prefixo; o endpoint lê do diretório privado e, como fallback, do público legado (`PaymentProofStorage.resolveLocalPath`) | só bloquear depois da migração - deixa a janela pública aberta até alguém rodar o script |
| Teste existente `orders-public.test.ts` "authenticated response includes id, userId" | reescrito para o critério 17 (pedido alheio sem `id`/`userId`) + caso novo do próprio pedido | manter a asserção antiga - contradiz o critério 17 da task |

- `GET /api/campaigns/:idOrSlug` ganha `optionalAuth` (hoje não identifica o requisitante) - reversível, não é porta
- Upload de comprovante passa a gravar o novo antes de apagar o anterior (rejeição 400 não apaga o atual) - reversível
- `POST /campaigns/:idOrSlug/image`: multer em Promise para o 400 da assinatura chegar ao `errorHandler` (antes o throw no callback ficava sem resposta); `POST /profile/avatar` mapeia `AppError` para o status dele - reversível
- Nada mais aqui é difícil de reverter

## Checks

### S1 - Salas do Socket.IO só entregam o que o ouvinte pode ver · 6 files · 60 KB · ~15k

**C1** - Socket sem usuário que emite `join-order` não entra em `order-<id>` e não recebe `message-sent` (crit. 1)
Proof: `cd backend && npx jest src/services/__tests__/socketService.test.ts -t "anonymous join-order"`

**C2** - Usuário autenticado que não é dono, nem criador, nem ADMIN não entra na sala e não recebe `message-sent` (crit. 2)
Proof: `cd backend && npx jest src/services/__tests__/socketService.test.ts -t "stranger join-order"`

**C3** - Dono, criador da campanha e ADMIN entram e recebem `message-sent` (crit. 3; table-driven sobre os 3 papéis)
Proof: `cd backend && npx jest src/services/__tests__/socketService.test.ts -t "allowed join-order"`

**C4** - `order-created`, `order-updated`, `order-deleted`, `order-status-changed` em `campaign-<id>` carregam exatamente `{ orderId, campaignId }` (crit. 4; table-driven sobre os 4)
Proof: `cd backend && npx jest src/services/__tests__/socketService.test.ts -t "order event payload"`

**C5** - Nenhum evento em `campaign-<id>` contém `email`, `pixKey`, `pixName`, `pixType`, `paymentProofUrl`, `paymentProofKey` em qualquer nível (crit. 5; table-driven sobre os emitters da sala que levam dados; os `order-*` têm o payload exato `{orderId, campaignId}` provado em C4)
Proof: `cd backend && npx jest src/services/__tests__/socketService.test.ts -t "campaign room never carries sensitive keys"`

**C6** - `creator-typing` para `userId` sem pedido em campanha do emissor não chega em `user-<userId>`; com pedido, chega (crit. 6)
Proof: `cd backend && npx jest src/services/__tests__/socketService.test.ts -t "creator-typing"`

### S2 - Escrita em pedido e chat só por quem tem acesso · 4 files · 49 KB · ~12k

**C7** - B dono de X chama `DELETE /api/orders/X/items/I` com I de Y → `404` e I continua existindo (crit. 7)
Proof: `cd backend && npx jest src/routes/__tests__/orders-items-delete.test.ts -t "item from another order"`

**C8** - `POST /api/messages?orderId=X` com body `{ orderId: Y }`, remetente só com acesso a X → `403` e nenhuma `OrderMessage` criada (crit. 8)
Proof: `cd backend && npx jest src/routes/__tests__/messages-access.test.ts -t "body orderId without access"`

### S3 - Conteúdo de usuário não executa como script · 8 files · 94 KB · ~23k

**C9** - `/campanhas/<slug>` com `description`/`name`/`creator.name` = `</script><script>window.__xss=1</script>`: JSON-LD contém `</script>` e o HTML só tem as 2 tags `<script>` do app (crit. 9)
Proof: `cd frontend && npx vitest run "src/app/(main)/campanhas/[slug]/__tests__/page.test.tsx" -t "escapes user content in JSON-LD"`

**C10** - `StructuredData` serializa com `<` escapado como `<` (crit. 9, componente)
Proof: `cd frontend && npx vitest run src/components/seo/__tests__/StructuredData.test.tsx -t "escapes"`

**C11** - Upload de avatar, imagem de campanha e comprovante com bytes que não são JPEG/PNG/WebP (ou PDF no comprovante) → `400` e nada gravado no storage; ex. HTML com `Content-Type: image/png` (crit. 10; table-driven sobre as 3 rotas)
Proof: `cd backend && npx jest src/routes/__tests__/upload-signature.test.ts -t "rejects non-image bytes"`

**C12** - Arquivo aceito é gravado com extensão do tipo detectado (`.jpg`, `.png`, `.webp`, `.pdf`), nunca da `originalname` (crit. 11; table-driven sobre os 4)
Proof: `cd backend && npx jest src/services/__tests__/fileUpload.test.ts -t "extension from detected type"`

**C13** - Respostas sob `/uploads/*` têm `X-Content-Type-Options: nosniff` (crit. 12)
Proof: `cd backend && npx jest src/utils/__tests__/uploadsStatic.test.ts -t "nosniff"`

### S4 - Comprovantes só para dono, criador e admin · 8 files · 75 KB · ~19k

**C14** - `GET /api/orders/:id/payment-proof` por quem não é dono/criador/ADMIN → `403` (crit. 13)
Proof: `cd backend && npx jest src/routes/__tests__/orders-payment-proof.test.ts -t "forbidden for stranger"`

**C15** - Dono, criador e ADMIN: S3 → `302` com `Location` = URL assinada com `expiresIn: 300`; LOCAL → `200` com os bytes do arquivo (crit. 13; table-driven sobre 3 papéis × 2 storages)
Proof: `cd backend && npx jest src/routes/__tests__/orders-payment-proof.test.ts -t "allowed roles"`

**C16** - Comprovante novo no S3 é enviado sem `ACL` (crit. 14)
Proof: `cd backend && npx jest src/services/__tests__/fileUpload.test.ts -t "payment proof S3 without ACL"`

**C17** - Comprovante novo LOCAL é gravado em `PRIVATE_UPLOAD_DIR` e `GET /uploads/payment-proofs/<arquivo>` → `404` (crit. 14)
Proof: `cd backend && npx jest src/utils/__tests__/uploadsStatic.test.ts -t "payment proof not served"` (o 404, com o arquivo legado ainda na pasta pública)
Proof: `cd backend && npx jest src/routes/__tests__/upload-signature.test.ts -t "payment proof url is the endpoint"` (gravado na pasta privada)

**C18** - `PATCH /api/orders/:id/payment` grava `paymentProofUrl = /api/orders/<id>/payment-proof` (crit. 15, URL não pública para novos)
Proof: `cd backend && npx jest src/routes/__tests__/upload-signature.test.ts -t "payment proof url is the endpoint"`

**C19** - Migração: S3 → `PutObjectAcl` `ACL: "private"` no key; LOCAL → arquivo movido de `<UPLOAD_DIR>/payment-proofs` para `<PRIVATE_UPLOAD_DIR>/payment-proofs`; ambos com `paymentProofUrl = /api/orders/<id>/payment-proof` (crit. 15)
Proof: `cd backend && npx jest src/services/__tests__/paymentProofMigration.test.ts -t "migrates"`

**C20** - Migração rodada duas vezes termina no mesmo estado sem erro (crit. 15, idempotência)
Proof: `cd backend && npx jest src/services/__tests__/paymentProofMigration.test.ts -t "idempotent"`

**C21** - Front mostra o comprovante pelo endpoint (blob), decidindo PDF por `blob.type`
Proof: `cd frontend && npx vitest run src/views/campaign-detail/modals/__tests__/OrderModals.test.tsx -t "payment proof from endpoint"`

### S5 - Respostas de API não vazam dados de terceiros · 6 files · 110 KB · ~27k

**C22** - `GET /api/campaigns/:idOrSlug` e `GET /api/campaigns`: `pixKey`/`pixName`/`pixType` só para criador, ADMIN, ou requisitante com pedido + `paymentReleased=true` + `status != ARCHIVED` (crit. 16; table-driven no detalhe: anônimo, sem pedido, pedido não liberado, pedido liberado, liberado+ARCHIVED, criador, ADMIN; na listagem e nas sugestões de busca, as linhas que provam a ligação: comprador com pedido liberado e anônimo)
Proof: `cd backend && npx jest src/routes/__tests__/campaigns-pix.test.ts -t "pix visibility"`

**C23** - As duas rotas trazem `hasPixConfigured: boolean` (crit. 16)
Proof: `cd backend && npx jest src/routes/__tests__/campaigns-pix.test.ts -t "hasPixConfigured"`

**C24** - Front mantém o aviso "faça login para ver o PIX" com `hasPixConfigured=true` e sem `pixKey` (crit. 16)
Proof: `cd frontend && npx vitest run src/views/campaign-detail/tabs/__tests__/OverviewTab.test.tsx -t "login notice from hasPixConfigured"`

**C25** - `GET /api/orders/public`: pedidos de outros sem `id`/`userId`; o do requisitante mantém os dois (crit. 17)
Proof: `cd backend && npx jest src/routes/__tests__/orders-public.test.ts -t "only own order keeps id and userId"`

**C26** - `GET /api/admin/users/:id` sem `password`, `pendingEmailToken`, `googleId` (crit. 18)
Proof: `cd backend && npx jest src/routes/__tests__/admin-users-detail.test.ts -t "omits secrets"`

## Swept

- validation: C11, C12
- failure modes: C11 (nada gravado em rejeição); C19/C20 (migração); falha ao assinar = 500 genérico (Unresolved 3)
- idempotency: C20; n/a nos demais (leituras e rejeições sem efeito)
- authorization: C1, C2, C3, C6, C7, C8, C14, C15, C22
- concurrency: n/a - troca concorrente de comprovante é `order-integrity`
- data lifecycle: C16, C17, C19; arquivo órfão = Unresolved 3, fica como hoje
- dependency failure: C15 (S3 assinando); falha = 500 genérico (Unresolved 3)
- state transitions: n/a - nenhum ciclo de vida muda
- observability: n/a - `join-order` negado sem log novo

## Coverage

Sem rodar `Coverage` join (profile `light`). Gaps de nível conhecidos:

- C16/C14 da task ("GET direto na URL S3 responde 403"): provado só como "upload sem ACL" com S3 mockado; bucket policy pública em produção anularia - não verificável sem S3 real
- C15 302 → front: navegador seguir o redirect até o S3 depende do CORS do bucket (fora do código)

## Handoff

Aritmética (wc -c/4, floor): S1 ~15k + S2 ~12k + S3 ~23k + S4 ~19k + S5 ~27k = ~96k < 150k, com `orders.ts` (26 KB) lido uma vez e contado em 4 slices. Um batch só; sem handoff planejado.

- Onde parou: batch único fechado, C1-C26 verdes em `a583a1b` (base `7ea7b59`). Próximo: Verifier sobre `7ea7b59..HEAD` (orquestrador), depois `order-integrity` no mesmo worktree.
- Decidido no meio do build: nada com o usuário; portas novas estão em `Landing`. Falha pré-existente em `frontend/.../OrdersTab.test.tsx` "should show view button on all orders for creator" (falha igual na base `7ea7b59`), não tocada.
- Abandonado: escapar também `>` e `&` no JSON-LD - quebraria o valor literal `</script>` do crit. 9; só `<` (+ U+2028/2029) é escapado.

## Testes enxugados, em 2026-11-11

- C5: as linhas `order-*` da tabela saíram (o payload exato está em C4) e a linha `user-typing` também (export sem uso em produção). As linhas restantes comparam o payload inteiro depois da limpeza, inclusive com `Date`.
- C17: o teste "new local proof" saiu porque o 404 dele não podia falhar (o arquivo nunca está na pasta pública); a prova ficou dividida entre o teste legado e o de `upload-signature`.
- C22: a listagem passou de 7 para 2 linhas (é a mesma função do detalhe); entraram as sugestões de busca, que não tinham teste e são um caminho de vazamento da chave PIX.
- `orders-payment-proof`: entrou arquivo LOCAL com bytes desconhecidos → `application/octet-stream` + `attachment`, `Cache-Control: private, no-store`, a pasta pública legada e a chave que escapa das pastas → 404.
