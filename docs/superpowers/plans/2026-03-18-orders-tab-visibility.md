# Orders Tab Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow all authenticated users to see all campaign orders in the Orders tab, with role-based action buttons.

**Architecture:** Enrich the existing public orders endpoint with `id`, `userId`, and `items` for authenticated users (using `optionalAuth`). Frontend fetches public orders for regular users, full orders for admin/creator. Action buttons rendered conditionally based on `currentUserId`, `isAdmin`, and `isCreator`.

**Tech Stack:** Express + Prisma (backend), Next.js + React + TanStack Query (frontend), Vitest + RTL (tests)

**Spec:** `docs/superpowers/specs/2026-03-18-orders-tab-visibility-design.md`

---

### File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `backend/src/routes/orders.ts:52-135` | Enrich public endpoint for authenticated users |
| Modify | `frontend/src/api/types.ts:269-293` | Add optional fields to `PublicOrderSummary` |
| Modify | `frontend/src/views/campaign-detail/useCampaignDetail.ts:152-183` | Change data fetching for regular users, expose role info |
| Modify | `frontend/src/views/campaign-detail/tabs/OrdersTab.tsx` | Add role-based button visibility |
| Modify | `frontend/src/components/campaign/OrderCard.tsx` | Add role-based button visibility |
| Modify | `frontend/src/views/CampaignDetail.tsx:93-110` | Pass new props to OrdersTab |
| Modify | `frontend/src/app/(main)/campanhas/[slug]/CampaignDetailPage.tsx:95-112` | Pass new props to OrdersTab (second consumer) |
| Modify | `frontend/src/views/campaign-detail/tabs/OverviewTab.tsx:346-376` | Role-based buttons in "Por Pessoa" section |
| Modify | `frontend/src/views/campaign-detail/tabs/__tests__/OrdersTab.test.tsx` | Update tests for new props and button logic |

---

### Task 1: Backend — Enrich public orders endpoint for authenticated users

**Files:**
- Modify: `backend/src/routes/orders.ts:52-135`

- [ ] **Step 1: Add `optionalAuth` middleware to the public endpoint**

In `backend/src/routes/orders.ts`, change line 53 from:
```typescript
router.get('/public', asyncHandler(async (req, res) => {
```
to:
```typescript
router.get('/public', optionalAuth, asyncHandler(async (req, res) => {
```

Add `optionalAuth` to the import on line 5:
```typescript
import { requireAuth, optionalAuth, requireOrderOwnership, requireOrderOrCampaignOwnership } from '../middleware/authMiddleware';
```

- [ ] **Step 2: Update the Prisma select to always include `id` and enriched `items`**

Replace the `prisma.order.findMany` call (lines 60-82) with:
```typescript
  const isAuthenticated = !!req.user;

  const orders = await prisma.order.findMany({
    where: { campaignId },
    select: {
      id: true,
      userId: true,
      isPaid: true,
      subtotal: true,
      shippingFee: true,
      total: true,
      createdAt: true,
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          subtotal: true,
          product: {
            select: { name: true },
          },
        },
      },
      customer: {
        select: {
          name: true,
          hideNameInCampaigns: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
```

Note: We always select all fields from Prisma for simplicity, but only conditionally include `id`, `userId`, and `items` in the response based on authentication.

- [ ] **Step 3: Update the response mapping to conditionally include enriched fields**

Replace the `publicOrders` mapping (lines 84-101) with:
```typescript
  const publicOrders = orders.map((order) => {
    const quantityTotal = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const base = {
      alias: getCampaignParticipantDisplayName({
        fullName: order.customer?.name,
        hideNameInCampaigns: order.customer?.hideNameInCampaigns ?? true,
        userId: order.userId,
        campaignId,
      }),
      isPaid: order.isPaid,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      itemsCount: order.items.length,
      quantityTotal,
      createdAt: order.createdAt,
    };

    if (isAuthenticated) {
      return {
        ...base,
        id: order.id,
        userId: order.userId,
        items: order.items.map((item) => ({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          product: item.product,
        })),
      };
    }

    return base;
  });
```

- [ ] **Step 4: Verify the backend compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/orders.ts
git commit -m "feat: enrich public orders endpoint for authenticated users"
```

---

### Task 2: Frontend — Update `PublicOrderSummary` type

**Files:**
- Modify: `frontend/src/api/types.ts:269-278`

- [ ] **Step 1: Add optional fields to `PublicOrderSummary`**

Replace the `PublicOrderSummary` interface (lines 269-278) with:
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
  // Present only for authenticated users
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

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/types.ts
git commit -m "feat: add optional authenticated fields to PublicOrderSummary"
```

---

### Task 3: Frontend — Update `useCampaignDetail` hook data fetching

**Files:**
- Modify: `frontend/src/views/campaign-detail/useCampaignDetail.ts:152-199`

- [ ] **Step 1: Change data fetching logic for regular users**

Replace lines 152-183 (the `canViewAllOrders` logic and orders query) with:
```typescript
  const campaignId = campaign?.id;
  const isAdmin = user?.role === "ADMIN";
  const isCreator = campaign?.creatorId === user?.id;
  const canViewAllOrders =
    !!campaign &&
    !!user &&
    (isAdmin || isCreator);

  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ["products", campaignId],
    queryFn: () => productApi.getByCampaign(campaignId!),
    enabled: !!campaignId,
  });

  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["orders", campaignId, user?.id, canViewAllOrders ? "all" : "public"],
    queryFn: async () => {
      if (!campaignId) {
        return [];
      }

      if (canViewAllOrders) {
        return orderApi.getByCampaign(campaignId);
      }

      const publicData = await orderApi.getPublicByCampaign(campaignId);
      return publicData.orders.map((po) => ({
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
        items: (po.items ?? []).map((item) => ({
          id: "",
          orderId: po.id ?? "",
          productId: "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          product: {
            id: "",
            name: item.product.name,
            price: item.unitPrice,
            campaignId: campaignId,
            createdAt: "",
            updatedAt: "",
          },
        })),
      })) as Order[];
    },
    enabled: !!campaignId,
  });
```

- [ ] **Step 2: Expose `isAdmin` and `isCreator` in the return object**

Add to the return statement (around line 928, in the "Computed state" section):
```typescript
    isAdmin: isAdmin ?? false,
    isCreator: isCreator ?? false,
    currentUserId: user?.id,
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors (may have errors in CampaignDetail.tsx until Task 5 is done — that's OK)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/views/campaign-detail/useCampaignDetail.ts
git commit -m "feat: fetch public orders for regular users and expose role info"
```

---

### Task 4: Frontend — Update `OrdersTab` with role-based buttons

**Files:**
- Modify: `frontend/src/views/campaign-detail/tabs/OrdersTab.tsx`

- [ ] **Step 1: Update the `OrdersTabProps` interface**

Replace the interface (lines 21-38) with:
```typescript
interface OrdersTabProps {
  orders: Order[];
  filteredOrders: Order[];
  isActive: boolean;
  currentUserId?: string;
  isAdmin: boolean;
  isCreator: boolean;
  orderSearch: string;
  sortField: "customerName" | "subtotal" | "shippingFee" | "total" | "isPaid";
  sortDirection: "asc" | "desc";
  onAddOrder: () => void;
  onViewOrder: (order: Order) => void;
  onTogglePayment: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onSearchChange: (value: string) => void;
  onSort: (
    field: "customerName" | "subtotal" | "shippingFee" | "total" | "isPaid"
  ) => void;
}
```

- [ ] **Step 2: Update the component destructuring**

Replace lines 40-55 with:
```typescript
export function OrdersTab({
  orders: _orders,
  filteredOrders,
  isActive,
  currentUserId,
  isAdmin,
  isCreator,
  orderSearch,
  sortField,
  sortDirection,
  onAddOrder,
  onViewOrder,
  onTogglePayment,
  onEditOrder,
  onDeleteOrder,
  onSearchChange,
  onSort,
}: OrdersTabProps) {
```

- [ ] **Step 3: Add a permission helper function inside the component**

Add after the `renderSortIcon` function (after line 78):
```typescript
  const canViewOrder = (order: Order) =>
    isAdmin || isCreator || order.userId === currentUserId;

  const canManageOrder = (order: Order) =>
    isAdmin || order.userId === currentUserId;

  const canDeleteOrder = (order: Order) =>
    isActive && (isAdmin || order.userId === currentUserId);
```

- [ ] **Step 4: Update the mobile OrderCard rendering**

Replace the mobile cards section (lines 178-191) with:
```typescript
          <div className="space-y-2 md:hidden">
            {filteredOrders?.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                showView={canViewOrder(order)}
                showManage={canManageOrder(order)}
                showDelete={canDeleteOrder(order)}
                onView={() => onViewOrder(order)}
                onTogglePayment={() => onTogglePayment(order)}
                onEdit={() => onEditOrder(order)}
                onDelete={() => handleDeleteClick(order)}
              />
            ))}
          </div>
```

- [ ] **Step 5: Update the desktop table action buttons**

Replace the actions `<td>` (lines 295-332) with:
```typescript
                      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                        <div className="flex gap-1 justify-end">
                          {canViewOrder(order) && (
                            <IconButton
                              size="sm"
                              variant="secondary"
                              icon={<Eye className="w-5 h-5" />}
                              onClick={() => onViewOrder(order)}
                              title="Visualizar pedido"
                            />
                          )}
                          {canManageOrder(order) && (
                            <>
                              <IconButton
                                size="sm"
                                variant={order.isPaid ? "success" : "secondary"}
                                icon={<Upload className="w-5 h-5" />}
                                onClick={() => onTogglePayment(order)}
                                title={
                                  order.isPaid
                                    ? "Marcar como não pago"
                                    : "Enviar comprovante de pagamento"
                                }
                              />
                              <IconButton
                                size="sm"
                                variant="secondary"
                                icon={<Edit className="w-4 h-4" />}
                                onClick={() => onEditOrder(order)}
                                title="Editar pedido"
                              />
                            </>
                          )}
                          {canDeleteOrder(order) && (
                            <IconButton
                              size="sm"
                              variant="danger"
                              icon={<Trash2 className="w-4 h-4" />}
                              onClick={() => handleDeleteClick(order)}
                              title="Remover pedido"
                            />
                          )}
                        </div>
                      </td>
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/views/campaign-detail/tabs/OrdersTab.tsx
git commit -m "feat: add role-based action buttons to OrdersTab"
```

---

### Task 5: Frontend — Update `OrderCard` with role-based buttons

**Files:**
- Modify: `frontend/src/components/campaign/OrderCard.tsx`

- [ ] **Step 1: Update the `OrderCardProps` interface and component**

Replace the interface and destructuring (lines 15-33) with:
```typescript
interface OrderCardProps {
  order: Order;
  showView: boolean;
  showManage: boolean;
  showDelete: boolean;
  onView: () => void;
  onTogglePayment: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function OrderCard({
  order,
  showView,
  showManage,
  showDelete,
  onView,
  onTogglePayment,
  onEdit,
  onDelete,
}: OrderCardProps) {
```

- [ ] **Step 2: Remove old permission variables and update action buttons**

Remove lines 34-35 (`const canEdit = true;` and `const canDelete = ...;`).

Replace the actions section (lines 100-137) with:
```typescript
        {(showView || showManage || showDelete) && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            {showView && (
              <IconButton
                size="sm"
                variant="secondary"
                icon={<Eye className="w-4 h-4" />}
                onClick={onView}
                title="Visualizar pedido"
                className="flex-1"
              />
            )}
            {showManage && (
              <>
                <IconButton
                  size="sm"
                  variant={order.isPaid ? "success" : "secondary"}
                  icon={<Upload className="w-4 h-4" />}
                  onClick={onTogglePayment}
                  title={order.isPaid ? "Marcar como não pago" : "Enviar comprovante de pagamento"}
                  className="flex-1"
                />
                <IconButton
                  size="sm"
                  variant="secondary"
                  icon={<Edit className="w-4 h-4" />}
                  onClick={onEdit}
                  title="Editar pedido"
                  className="flex-1"
                />
              </>
            )}
            {showDelete && (
              <IconButton
                size="sm"
                variant="danger"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={onDelete}
                title="Remover pedido"
                className="flex-1"
              />
            )}
          </div>
        )}
```

- [ ] **Step 3: Update the customer name display to use `order.customer.name`**

Line 52 already uses `order.customer.name` — no change needed. This will display the `alias` for public orders since it's mapped to `customer.name`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/campaign/OrderCard.tsx
git commit -m "feat: add role-based action buttons to OrderCard"
```

---

### Task 6: Frontend — Update `CampaignDetail.tsx` to pass new props

**Files:**
- Modify: `frontend/src/views/CampaignDetail.tsx:93-110`

- [ ] **Step 1: Update the OrdersTab usage**

Replace lines 93-110 with:
```typescript
      {activeTab === "orders" && (
        <OrdersTab
          orders={hook.orders || []}
          filteredOrders={hook.filteredOrders || []}
          isActive={hook.isActive}
          currentUserId={hook.currentUserId}
          isAdmin={hook.isAdmin}
          isCreator={hook.isCreator}
          orderSearch={hook.orderSearch}
          sortField={hook.orderSortField}
          sortDirection={hook.orderSortDirection}
          onAddOrder={hook.orderModal.handleAddOrder}
          onViewOrder={hook.orderModal.handleViewOrder}
          onTogglePayment={hook.orderModal.handleTogglePayment}
          onEditOrder={hook.handleOpenEditOrder}
          onDeleteOrder={hook.handleDeleteOrder}
          onSearchChange={hook.setOrderSearch}
          onSort={hook.handleSort}
        />
      )}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/views/CampaignDetail.tsx
git commit -m "feat: pass role props to OrdersTab in CampaignDetail"
```

---

### Task 7: Frontend — Update `CampaignDetailPage.tsx` to pass new props

**Files:**
- Modify: `frontend/src/app/(main)/campanhas/[slug]/CampaignDetailPage.tsx:95-112`

This is a second consumer of `OrdersTab` (alongside `CampaignDetail.tsx`). It uses the same hook but accesses callbacks directly (e.g., `hook.handleAddOrder` instead of `hook.orderModal.handleAddOrder`).

- [ ] **Step 1: Update the OrdersTab usage**

Replace lines 95-112 with:
```typescript
      {activeTab === 'orders' && (
        <OrdersTab
          orders={hook.orders || []}
          filteredOrders={hook.filteredOrders || []}
          isActive={hook.isActive}
          currentUserId={hook.currentUserId}
          isAdmin={hook.isAdmin}
          isCreator={hook.isCreator}
          orderSearch={hook.orderSearch}
          sortField={hook.orderSortField}
          sortDirection={hook.orderSortDirection}
          onAddOrder={hook.handleAddOrder}
          onViewOrder={hook.handleViewOrder}
          onTogglePayment={hook.handleTogglePayment}
          onEditOrder={hook.handleOpenEditOrder}
          onDeleteOrder={hook.handleDeleteOrder}
          onSearchChange={hook.setOrderSearch}
          onSort={hook.handleSort}
        />
      )}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/(main)/campanhas/[slug]/CampaignDetailPage.tsx
git commit -m "feat: pass role props to OrdersTab in CampaignDetailPage"
```

---

### Task 8: Frontend — Update `OverviewTab` action buttons

**Files:**
- Modify: `frontend/src/views/campaign-detail/tabs/OverviewTab.tsx:346-376`

- [ ] **Step 1: Update the "Por Pessoa" action buttons to be role-based**

The `OverviewTab` already has `useAuth()` access (line 87). Add role derivation after line 89:
```typescript
  const isAdmin = user?.role === "ADMIN";
  const isCreator = campaign.creatorId === user?.id;
```

Replace the action buttons inside the `byCustomer` map (lines 348-376) with:
```typescript
                          <div className="flex items-center gap-2">
                            {order && (isAdmin || isCreator || order.userId === user?.id) && (
                              <IconButton
                                size="sm"
                                variant="secondary"
                                icon={<Eye className="w-5 h-5" />}
                                onClick={() => onViewOrder(order)}
                                title="Visualizar pedido"
                              />
                            )}
                            {order && (isAdmin || order.userId === user?.id) && (
                              <>
                                <IconButton
                                  size="sm"
                                  variant={item.isPaid ? "success" : "secondary"}
                                  icon={<Upload className="w-5 h-5" />}
                                  onClick={() => onTogglePayment(order)}
                                  title={
                                    item.isPaid
                                      ? "Marcar como não pago"
                                      : "Enviar comprovante de pagamento"
                                  }
                                />
                                <IconButton
                                  size="sm"
                                  variant="secondary"
                                  icon={<Edit className="w-4 h-4" />}
                                  onClick={() => onEditOrder(order)}
                                  title="Editar pedido"
                                />
                              </>
                            )}
                          </div>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/views/campaign-detail/tabs/OverviewTab.tsx
git commit -m "feat: add role-based action buttons to OverviewTab"
```

---

### Task 9: Update tests

**Files:**
- Modify: `frontend/src/views/campaign-detail/tabs/__tests__/OrdersTab.test.tsx`

- [ ] **Step 1: Update the mock OrderCard to reflect new props**

Replace the mock (lines 8-18) with:
```typescript
vi.mock('@/components/campaign/OrderCard', () => ({
  default: ({ order, showView, showManage, showDelete, onView, onEdit, onDelete, onTogglePayment }: Record<string, unknown>) => (
    <div data-testid={`order-card-${(order as { id: string }).id}`}>
      <span>Order: {(order as { customer: { name: string } }).customer.name}</span>
      {showView && <button onClick={onView as () => void}>View</button>}
      {showManage && (
        <>
          <button onClick={onEdit as () => void}>Edit</button>
          <button onClick={onTogglePayment as () => void}>Toggle Payment</button>
        </>
      )}
      {showDelete && <button onClick={onDelete as () => void}>Delete</button>}
    </div>
  ),
}));
```

- [ ] **Step 2: Update `defaultProps` to include new required props**

Replace `defaultProps` (lines 67-76) with:
```typescript
  const defaultProps = {
    orders: mockOrders,
    filteredOrders: mockOrders,
    isActive: true,
    currentUserId: 'u1',
    isAdmin: false,
    isCreator: false,
    orderSearch: '',
    sortField: 'customerName' as const,
    sortDirection: 'asc' as const,
    ...mockCallbacks,
  };
```

Also update `mockOrders` to set `userId` on each order:
```typescript
  const mockOrders = [
    createMockOrder({
      id: 'order-1',
      userId: 'u1',
      customer: { id: 'u1', name: 'Alice', email: 'alice@test.com' },
      subtotal: 100,
      shippingFee: 10,
      total: 110,
      isPaid: true,
    }),
    createMockOrder({
      id: 'order-2',
      userId: 'u2',
      customer: { id: 'u2', name: 'Bob', email: 'bob@test.com' },
      subtotal: 200,
      shippingFee: 20,
      total: 220,
      isPaid: false,
    }),
    createMockOrder({
      id: 'order-3',
      userId: 'u3',
      customer: { id: 'u3', name: 'Charlie', email: 'charlie@test.com' },
      subtotal: 150,
      shippingFee: 15,
      total: 165,
      isPaid: false,
    }),
  ];
```

- [ ] **Step 3: Replace the Permissions test suite**

Replace the entire `describe('Permissions', ...)` block (lines 375-417) with:
```typescript
  describe('Permissions', () => {
    it('should show all action buttons for admin on all orders', () => {
      render(<OrdersTab {...defaultProps} currentUserId="admin-1" isAdmin={true} />);

      // Admin sees view, payment, edit on all orders (3 orders × 3 buttons = 9 in desktop table)
      expect(screen.queryAllByTitle(/visualizar pedido/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByTitle(/marcar como|enviar comprovante/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByTitle(/editar pedido/i).length).toBeGreaterThan(0);
      expect(screen.queryAllByTitle(/remover pedido/i).length).toBeGreaterThan(0);
    });

    it('should show action buttons only on own order for regular user', () => {
      render(<OrdersTab {...defaultProps} currentUserId="u1" isAdmin={false} isCreator={false} />);

      // u1 owns order-1 only
      // Buttons appear in both mobile (via mock OrderCard) and desktop table
      // So we expect 2 of each (1 mobile + 1 desktop) for the user's own order
      const viewButtons = screen.queryAllByTitle(/visualizar pedido/i);
      const paymentButtons = screen.queryAllByTitle(/marcar como|enviar comprovante/i);
      const editButtons = screen.queryAllByTitle(/editar pedido/i);
      const deleteButtons = screen.queryAllByTitle(/remover pedido/i);

      // No buttons for orders u2 and u3
      expect(viewButtons.length).toBe(1); // Only desktop table (mock OrderCard uses text buttons not title)
      expect(paymentButtons.length).toBe(1);
      expect(editButtons.length).toBe(1);
      expect(deleteButtons.length).toBe(1);
    });

    it('should show view button on all orders for creator', () => {
      render(<OrdersTab {...defaultProps} currentUserId="creator-1" isAdmin={false} isCreator={true} />);

      // Creator sees view on all 3 orders in desktop table
      const viewButtons = screen.queryAllByTitle(/visualizar pedido/i);
      expect(viewButtons.length).toBe(3);

      // No manage buttons since creator-1 doesn't own any of these orders
      expect(screen.queryAllByTitle(/marcar como|enviar comprovante/i).length).toBe(0);
      expect(screen.queryAllByTitle(/editar pedido/i).length).toBe(0);
    });

    it('should not show delete button when campaign is not active', () => {
      render(<OrdersTab {...defaultProps} isActive={false} currentUserId="u1" />);

      expect(screen.queryAllByTitle(/remover pedido/i).length).toBe(0);
    });

    it('should not show any action buttons when user has no matching order and is not admin or creator', () => {
      render(<OrdersTab {...defaultProps} currentUserId="unknown-user" isAdmin={false} isCreator={false} />);

      expect(screen.queryAllByTitle(/visualizar pedido/i).length).toBe(0);
      expect(screen.queryAllByTitle(/marcar como|enviar comprovante/i).length).toBe(0);
      expect(screen.queryAllByTitle(/editar pedido/i).length).toBe(0);
      expect(screen.queryAllByTitle(/remover pedido/i).length).toBe(0);
    });
  });
```

- [ ] **Step 4: Run the tests**

Run: `cd frontend && npx vitest run src/views/campaign-detail/tabs/__tests__/OrdersTab.test.tsx`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/campaign-detail/tabs/__tests__/OrdersTab.test.tsx
git commit -m "test: update OrdersTab tests for role-based action buttons"
```

---

### Task 10: Final verification

- [ ] **Step 1: Run full frontend tests**

Run: `cd frontend && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run TypeScript type check**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run backend type check**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Manual smoke test**

Start the dev environment:
```bash
docker-compose up
```

Verify:
1. As a regular user, open a campaign page → Orders tab shows all orders with first+last name
2. Action buttons appear only on own order
3. As creator, open own campaign → Orders tab shows all orders with full names, View button on all
4. As admin, open any campaign → all buttons on all orders
5. Incognito/logged out → `/api/orders/public` returns data without `id`, `userId`, `items`
