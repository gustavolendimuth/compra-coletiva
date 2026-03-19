# Orders Tab Visibility — Design Spec

## Objetivo

Permitir que qualquer usuario autenticado veja todos os pedidos de uma campanha na aba "Pedidos", com niveis de acesso diferenciados por papel.

## Regras de acesso

| Papel | Pedidos visiveis | Nome exibido | Botoes de acao |
|-------|-----------------|--------------|----------------|
| Usuario comum | Todos da campanha | Primeiro + ultimo nome (ou alias se `hideNameInCampaigns`) | Apenas no proprio pedido (visualizar, pagamento, editar, deletar) |
| Criador da campanha | Todos da campanha | Nome completo (endpoint autenticado) | Visualizar em todos os pedidos + acoes completas no proprio pedido |
| Admin | Todos da campanha | Nome completo (endpoint autenticado) | Todos os botoes em todos os pedidos |

## Mudancas no Backend

### `GET /api/orders/public?campaignId=xxx`

Atualmente retorna dados resumidos sem identificar o usuario. Adicionar:

1. **`userId`** em cada pedido da resposta — necessario para o frontend identificar o pedido do proprio usuario e exibir botoes de acao.
2. **`id`** (order ID) em cada pedido — necessario para acoes (editar, deletar, pagamento).
3. **`items`** com detalhes — array com `quantity`, `unitPrice`, `subtotal` e `product.name` para exibir na tabela igual ao que o criador ve hoje.
4. **`shippingFee`**, `subtotal`, `total`, `isPaid`, `createdAt` — ja retornados hoje, manter.

A logica de nome (`getCampaignParticipantDisplayName`) ja existe e respeita `hideNameInCampaigns`. Nao precisa mudar.

Resposta atualizada de cada pedido:
```json
{
  "id": "order-id",
  "userId": "user-id",
  "alias": "Nome Sobrenome",
  "isPaid": false,
  "subtotal": 100.0,
  "shippingFee": 10.0,
  "total": 110.0,
  "itemsCount": 2,
  "quantityTotal": 5,
  "createdAt": "2026-03-18T...",
  "items": [
    {
      "quantity": 3,
      "unitPrice": 20.0,
      "subtotal": 60.0,
      "product": { "name": "Produto X" }
    }
  ]
}
```

## Mudancas no Frontend

### Tipos (`frontend/src/api/types.ts`)

Atualizar `PublicOrder` (ou criar se nao existir) para incluir os novos campos: `id`, `userId`, `items`.

### Hook (`frontend/src/views/campaign-detail/useCampaignDetail.ts`)

Logica atual:
- Admin/Criador: `orderApi.getByCampaign(campaignId)` → retorna `Order[]`
- Usuario comum: `orderApi.getMyByCampaign(campaignId)` → retorna `Order | null`

Nova logica:
- Admin/Criador: mantém `orderApi.getByCampaign(campaignId)` → retorna `Order[]`
- Usuario comum: `orderApi.getPublicByCampaign(campaignId)` → retorna `PublicOrdersResponse`, mapear `orders` para formato compativel com a tabela

Expor `currentUserId` e `isAdmin` para os componentes de tab.

### `OrdersTab.tsx`

Novas props:
- `currentUserId: string | undefined` — ID do usuario logado
- `isAdmin: boolean` — se o usuario e admin
- `isCreator: boolean` — se o usuario e criador da campanha

Logica de botoes por pedido:
- **Visualizar**: sempre visivel se `isAdmin || isCreator || order.userId === currentUserId`
- **Pagamento, Editar**: visivel se `isAdmin || order.userId === currentUserId`
- **Deletar**: visivel se `isActive && (isAdmin || (order.userId === currentUserId))`

### `OrderCard.tsx`

Mesma logica de botoes. Substituir as props `canEditCampaign` por `canManageOrder` (booleano calculado no pai).

Alternativamente, passar `currentUserId`, `isAdmin`, `isCreator` e calcular dentro do componente.

### `CampaignDetail.tsx`

Passar as novas props (`currentUserId`, `isAdmin`, `isCreator`) para `OrdersTab`.

## Fora de escopo

- Pagina separada de pedidos para Admin (todos de todas as campanhas).
- Mudancas no endpoint `GET /api/orders` (autenticado, criador/admin).
- Mudancas na logica de `hideNameInCampaigns` — ja funciona corretamente.
- Mudancas no botao "Adicionar Pedido" — segue aparecendo apenas quando a campanha esta ativa.
