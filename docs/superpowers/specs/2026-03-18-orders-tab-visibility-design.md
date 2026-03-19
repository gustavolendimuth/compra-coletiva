# Orders Tab Visibility — Design Spec

## Objetivo

Permitir que qualquer usuario autenticado veja todos os pedidos de uma campanha na aba "Pedidos", com niveis de acesso diferenciados por papel.

## Regras de acesso

| Papel | Pedidos visiveis | Nome exibido | Botoes de acao |
|-------|-----------------|--------------|----------------|
| Usuario comum | Todos da campanha | Primeiro + ultimo nome (ou alias se `hideNameInCampaigns`) | Apenas no proprio pedido (visualizar, pagamento, editar, deletar) |
| Criador da campanha | Todos da campanha | Nome completo (endpoint `GET /api/orders`) | Visualizar em todos + acoes completas no proprio pedido |
| Admin | Todos da campanha | Nome completo (endpoint `GET /api/orders`) | Todos os botoes em todos os pedidos |

Usuarios nao autenticados: endpoint `/api/orders/public` continua acessivel sem auth, mas **sem** `userId` nem `id`. A resposta enriquecida (com `userId`, `id`, `items`) so e retornada para usuarios autenticados.

## Mudancas no Backend

### `GET /api/orders/public?campaignId=xxx`

Adicionar verificacao de auth **opcional** (checar header Authorization, mas nao rejeitar se ausente).

**Se autenticado**, retornar campos adicionais em cada pedido:
1. **`id`** (order ID) — necessario para acoes (editar, deletar, pagamento).
2. **`userId`** — necessario para o frontend identificar o pedido do proprio usuario.
3. **`items`** — array com `quantity`, `unitPrice`, `subtotal` e `product.name`.

**Se nao autenticado**, manter a resposta atual (sem `id`, `userId`, `items`).

A logica de nome (`getCampaignParticipantDisplayName`) ja existe e respeita `hideNameInCampaigns`. Nao precisa mudar.

Incluir no select do Prisma:
- `id` (order)
- `userId`
- `items` com `quantity`, `unitPrice`, `subtotal` e relacao `product` com `select: { name: true }`

Resposta de cada pedido (autenticado):
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

Resposta de cada pedido (nao autenticado — igual a atual):
```json
{
  "alias": "Nome Sobrenome",
  "isPaid": false,
  "subtotal": 100.0,
  "shippingFee": 10.0,
  "total": 110.0,
  "itemsCount": 2,
  "quantityTotal": 5,
  "createdAt": "2026-03-18T..."
}
```

## Mudancas no Frontend

### Tipos (`frontend/src/api/types.ts`)

Atualizar `PublicOrderSummary` para incluir campos opcionais retornados quando autenticado:

```typescript
export interface PublicOrderSummary {
  alias: string;
  isPaid: boolean;
  subtotal: number;
  shippingFee: number;
  total: number;
  itemsCount: number;
  quantityTotal: number;
  createdAt: string;
  // Campos presentes apenas para usuarios autenticados
  id?: string;
  userId?: string;
  items?: Array<{
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: { name: string };
  }>;
}
```

### Hook (`frontend/src/views/campaign-detail/useCampaignDetail.ts`)

Logica atual:
- Admin/Criador: `orderApi.getByCampaign(campaignId)` → `Order[]`
- Usuario comum: `orderApi.getMyByCampaign(campaignId)` → `Order | null`

Nova logica:
- Admin/Criador: mantem `orderApi.getByCampaign(campaignId)` → `Order[]`
- Usuario comum autenticado: `orderApi.getPublicByCampaign(campaignId)` → `PublicOrdersResponse`

Mapear `PublicOrderSummary` para formato compativel com `Order`:
```typescript
const mappedOrders = publicData.orders.map(po => ({
  id: po.id ?? "",
  campaignId,
  userId: po.userId ?? "",
  customer: { id: "", name: po.alias, email: "" },
  isPaid: po.isPaid,
  isSeparated: false,
  subtotal: po.subtotal,
  shippingFee: po.shippingFee,
  total: po.total,
  createdAt: po.createdAt,
  updatedAt: po.createdAt,
  items: (po.items ?? []).map(item => ({
    id: "",
    orderId: po.id ?? "",
    productId: "",
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
    product: { id: "", name: item.product.name, price: item.unitPrice, campaignId, createdAt: "", updatedAt: "" },
  })),
})) as Order[];
```

Expor `currentUserId`, `isAdmin`, `isCreator` para os componentes.

### `OrdersTab.tsx`

Novas props:
- `currentUserId: string | undefined` — ID do usuario logado
- `isAdmin: boolean` — se o usuario e admin
- `isCreator: boolean` — se o usuario e criador da campanha

Logica de botoes por pedido:
- **Visualizar**: `isAdmin || isCreator || order.userId === currentUserId`
- **Pagamento**: `isAdmin || order.userId === currentUserId`
- **Editar**: `isAdmin || order.userId === currentUserId`
- **Deletar**: `isActive && (isAdmin || order.userId === currentUserId)`

Nome do cliente: usar `getCustomerDisplayName(order)` que acessara `order.customer.name` — para pedidos publicos, esse campo contera o `alias` ja mapeado.

O modal de confirmacao de delete tambem usara `getCustomerDisplayName`, que funcionara corretamente com o alias mapeado.

Remover prop `canEditCampaign` (substituida pela logica acima).

### `OrderCard.tsx`

Novas props: `currentUserId`, `isAdmin`, `isCreator`.
Remover props `canEditCampaign`.

Logica de botoes igual ao `OrdersTab`.

Atualizar exibicao de nome: usar `order.customer.name` (ja contem alias para pedidos publicos).

### `OverviewTab.tsx`

A secao "Por Pessoa" (analytics `byCustomer`) mostra botoes de acao por pedido. Aplicar mesma logica:
- **Visualizar**: `isAdmin || isCreator || order?.userId === user.id`
- **Pagamento, Editar**: `isAdmin || order?.userId === user.id`

Novas props necessarias: nenhuma — `OverviewTab` ja acessa `useAuth()` internamente e recebe `canEditCampaign`. Adicionar `isAdmin` derivado de `user.role === "ADMIN"` localmente.

### `CampaignDetail.tsx`

Passar `currentUserId`, `isAdmin`, `isCreator` para `OrdersTab`.

### Busca e ordenacao (`useCampaignDetail.ts`)

A logica de filtro por nome (`order.customer.name?.toLowerCase().includes(...)`) funcionara corretamente porque o mapeamento coloca o `alias` em `customer.name`.

A ordenacao por `customerName` tambem funcionara pelo mesmo motivo.

## Testes

Arquivos de teste a atualizar:
- `frontend/src/views/campaign-detail/tabs/__tests__/OrdersTab.test.tsx` — novos cenarios para botoes condicionais por papel
- Backend: testes para `GET /api/orders/public` — verificar que `userId`/`id`/`items` aparecem quando autenticado e nao aparecem quando nao autenticado

## Fora de escopo

- Pagina separada de pedidos para Admin (todos de todas as campanhas).
- Mudancas no endpoint `GET /api/orders` (autenticado, criador/admin).
- Mudancas na logica de `hideNameInCampaigns` — ja funciona corretamente.
- Mudancas no botao "Adicionar Pedido" — segue aparecendo apenas quando a campanha esta ativa.
- Campo `isSeparated` — nao retornado no endpoint publico, mapeado como `false`.
