import express from "express";
import request from "supertest";

// ── Mocks ───────────────────────────────────────────────────────────────────

type StoredItem = { id: string; orderId: string };
let items: StoredItem[] = [];

const mockOrderFindUnique = jest.fn();
const mockOrderItemDelete = jest.fn();
const mockOrderItemDeleteMany = jest.fn();
jest.mock("../../index", () => {
  const prisma: Record<string, unknown> = {
    order: { findUnique: mockOrderFindUnique },
    orderItem: { delete: mockOrderItemDelete, deleteMany: mockOrderItemDeleteMany },
    // Locks da escrita de itens: campanha ACTIVE e pedido não pago
    $queryRaw: jest.fn((strings: TemplateStringsArray) =>
      Promise.resolve(/FROM campaigns/i.test(strings.join("?")) ? [{ status: "ACTIVE" }] : [{ isPaid: false }])
    ),
  };
  prisma.$transaction = (fn: (tx: unknown) => Promise<unknown>) => fn(prisma);
  return { prisma };
});

jest.mock("../../services/shippingCalculator", () => ({
  ShippingCalculator: { recalculateOrderSubtotal: jest.fn(), distributeShipping: jest.fn(), recalculateCampaignTotals: jest.fn() },
}));

jest.mock("../../services/socketService", () => ({
  emitOrderCreated: jest.fn(),
  emitOrderUpdated: jest.fn(),
  emitOrderDeleted: jest.fn(),
  emitOrderStatusChanged: jest.fn(),
}));

jest.mock("../../services/email/emailQueue", () => ({ queueOrderCreatedEmail: jest.fn() }));
jest.mock("../../services/campaignStatusService", () => ({ CampaignStatusService: {} }));
jest.mock("../../services/legalAcceptanceService", () => ({ LegalAcceptanceService: {} }));

// B é dono do pedido X: os guards de ownership deixam passar
jest.mock("../../middleware/authMiddleware", () => ({
  optionalAuth: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: "user-b", role: "CUSTOMER" } as Express.User;
    next();
  },
  requireOrderOwnership: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  requireOrderOrCampaignOwnership: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

import orderRouter from "../orders";
import { errorHandler } from "../../middleware/errorHandler";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/orders", orderRouter);
  app.use(errorHandler);
  return app;
}

describe("DELETE /api/orders/:id/items/:itemId", () => {
  const app = createApp();

  beforeEach(() => {
    items = [
      { id: "item-x", orderId: "order-x" },
      { id: "item-i", orderId: "order-y" },
    ];
    mockOrderFindUnique.mockResolvedValue({
      id: "order-x",
      userId: "user-b",
      campaignId: "campaign-1",
      campaign: { id: "campaign-1", status: "ACTIVE" },
    });
    // Simula o banco: delete por id apaga qualquer item; deleteMany respeita o filtro completo
    mockOrderItemDelete.mockImplementation(({ where }: { where: { id: string } }) => {
      items = items.filter((item) => item.id !== where.id);
      return Promise.resolve({});
    });
    mockOrderItemDeleteMany.mockImplementation(({ where }: { where: Partial<StoredItem> }) => {
      const before = items.length;
      items = items.filter(
        (item) => !Object.entries(where).every(([key, value]) => item[key as keyof StoredItem] === value)
      );
      return Promise.resolve({ count: before - items.length });
    });
  });

  it("returns 404 and keeps the item from another order", async () => {
    const res = await request(app).delete("/api/orders/order-x/items/item-i");

    expect(res.status).toBe(404);
    expect(items.find((item) => item.id === "item-i")).toBeDefined();
  });

  it("deletes an item that belongs to the order", async () => {
    const res = await request(app).delete("/api/orders/order-x/items/item-x");

    expect(res.status).toBe(204);
    expect(items.find((item) => item.id === "item-x")).toBeUndefined();
  });
});
