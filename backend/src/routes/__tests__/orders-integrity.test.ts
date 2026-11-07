import express from "express";
import request from "supertest";
import { Prisma } from "@prisma/client";

// ── Mocks ───────────────────────────────────────────────────────────────────

type Product = { id: string; campaignId: string; price: number };
const PRODUCTS: Product[] = [
  { id: "p-own", campaignId: "c-1", price: 10 },
  { id: "p-foreign", campaignId: "c-2", price: 0 },
];

// Filtro simples sobre a "tabela" de produtos: respeita id/id.in/campaignId
const matchProduct = (where: { id?: string | { in: string[] }; campaignId?: string }) => (p: Product) => {
  if (typeof where.id === "string" && p.id !== where.id) return false;
  if (where.id && typeof where.id === "object" && !where.id.in.includes(p.id)) return false;
  if (where.campaignId !== undefined && p.campaignId !== where.campaignId) return false;
  return true;
};

let lockState = { campaignStatus: "ACTIVE", isPaid: false };

const mockPrisma: Record<string, any> = {
  campaign: { findUnique: jest.fn() },
  product: {
    findMany: jest.fn(({ where }) => Promise.resolve(PRODUCTS.filter(matchProduct(where)))),
    findFirst: jest.fn(({ where }) => Promise.resolve(PRODUCTS.find(matchProduct(where)) ?? null)),
    findUnique: jest.fn(({ where }) => Promise.resolve(PRODUCTS.find((p) => p.id === where.id) ?? null)),
  },
  order: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  orderItem: {
    create: jest.fn(),
    createMany: jest.fn(),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
  $queryRaw: jest.fn((strings: TemplateStringsArray) => {
    const sql = strings.join("?");
    if (/FROM campaigns/i.test(sql)) return Promise.resolve([{ status: lockState.campaignStatus }]);
    if (/FROM orders/i.test(sql)) return Promise.resolve([{ isPaid: lockState.isPaid }]);
    return Promise.resolve([]);
  }),
  $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma)),
};

jest.mock("../../index", () => ({ prisma: mockPrisma }));

const mockRecalculate = jest.fn();
jest.mock("../../services/shippingCalculator", () => ({
  ShippingCalculator: {
    recalculateCampaignTotals: (...args: unknown[]) => mockRecalculate(...args),
    recalculateOrderSubtotal: (...args: unknown[]) => mockRecalculate(...args),
    distributeShipping: (...args: unknown[]) => mockRecalculate(...args),
  },
}));

jest.mock("../../services/socketService", () => ({
  emitOrderCreated: jest.fn(),
  emitOrderUpdated: jest.fn(),
  emitOrderDeleted: jest.fn(),
  emitOrderStatusChanged: jest.fn(),
}));
jest.mock("../../services/email/emailQueue", () => ({ queueOrderCreatedEmail: jest.fn() }));
jest.mock("../../services/campaignStatusService", () => ({ CampaignStatusService: {} }));
jest.mock("../../services/legalAcceptanceService", () => ({
  LegalAcceptanceService: { hasAcceptedCurrentSalesDisclaimer: () => true },
}));

let currentUser: Express.User;
const passThrough = (_req: express.Request, _res: express.Response, next: express.NextFunction) => next();
jest.mock("../../middleware/authMiddleware", () => ({
  optionalAuth: passThrough,
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = currentUser;
    next();
  },
  requireOrderOwnership: passThrough,
  requireOrderOrCampaignOwnership: passThrough,
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

// ── Dados ───────────────────────────────────────────────────────────────────

const OWNER = { id: "owner-1", role: "CUSTOMER" } as Express.User;
const CREATOR = { id: "creator-1", role: "CAMPAIGN_CREATOR" } as Express.User;
const ADMIN = { id: "admin-1", role: "ADMIN" } as Express.User;

const ORDER = {
  id: "o-1",
  userId: OWNER.id,
  campaignId: "c-1",
  isPaid: false,
  subtotal: 10,
  shippingFee: 0,
  total: 10,
  items: [{ id: "i-1", orderId: "o-1", productId: "p-own", quantity: 1 }],
  campaign: { id: "c-1", creatorId: CREATOR.id, status: "ACTIVE" },
};

function expectNoItemWrites() {
  expect(mockPrisma.orderItem.create).not.toHaveBeenCalled();
  expect(mockPrisma.orderItem.createMany).not.toHaveBeenCalled();
  expect(mockPrisma.orderItem.deleteMany).not.toHaveBeenCalled();
  expect(mockPrisma.order.create).not.toHaveBeenCalled();
  expect(mockPrisma.order.update).not.toHaveBeenCalled();
  expect(mockRecalculate).not.toHaveBeenCalled();
}

function setPaid(isPaid: boolean) {
  lockState = { campaignStatus: "ACTIVE", isPaid };
  mockPrisma.order.findUnique.mockResolvedValue({ ...ORDER, isPaid });
  mockPrisma.order.findFirst.mockResolvedValue({ ...ORDER, isPaid });
}

beforeEach(() => {
  currentUser = OWNER;
  lockState = { campaignStatus: "ACTIVE", isPaid: false };
  mockPrisma.campaign.findUnique.mockResolvedValue({
    id: "c-1",
    slug: "camp",
    name: "Campanha",
    creatorId: CREATOR.id,
    status: "ACTIVE",
  });
  mockPrisma.order.findUnique.mockResolvedValue(ORDER);
  mockPrisma.order.findFirst.mockResolvedValue(null);
  mockPrisma.order.create.mockResolvedValue({ ...ORDER, items: [] });
  mockPrisma.order.delete.mockResolvedValue({});
  mockPrisma.orderItem.deleteMany.mockResolvedValue({ count: 1 });
});

// ── Testes ──────────────────────────────────────────────────────────────────

describe("orders integrity", () => {
  const app = createApp();

  const foreignItemRoutes: Array<[string, () => request.Test]> = [
    ["POST /api/orders", () => request(app).post("/api/orders").send({ campaignId: "c-1", items: [{ productId: "p-foreign", quantity: 1 }] })],
    ["PUT /api/orders/:id", () => request(app).put("/api/orders/o-1").send({ items: [{ productId: "p-foreign", quantity: 1 }] })],
    ["POST /api/orders/:id/items", () => request(app).post("/api/orders/o-1/items").send({ productId: "p-foreign", quantity: 1 })],
  ];

  it.each(foreignItemRoutes)("product from another campaign: %s → 400 and nothing written", async (_name, send) => {
    const res = await send();

    expect(res.status).toBe(400);
    expectNoItemWrites();
  });

  it.each(foreignItemRoutes)("product from another campaign: existing order on %s keeps its items", async (_name, send) => {
    mockPrisma.order.findFirst.mockResolvedValue(ORDER);

    const res = await send();

    expect(res.status).toBe(400);
    expectNoItemWrites();
  });

  const paidRoutes: Array<[string, () => request.Test]> = [
    ["PUT /api/orders/:id", () => request(app).put("/api/orders/o-1").send({ items: [{ productId: "p-own", quantity: 3 }] })],
    ["POST /api/orders/:id/items", () => request(app).post("/api/orders/o-1/items").send({ productId: "p-own", quantity: 1 })],
    ["DELETE /api/orders/:id/items/:itemId", () => request(app).delete("/api/orders/o-1/items/i-1")],
    ["POST /api/orders (replace items)", () => request(app).post("/api/orders").send({ campaignId: "c-1", items: [{ productId: "p-own", quantity: 3 }] })],
  ];

  const actors: Array<[string, Express.User]> = [["owner", OWNER], ["admin", ADMIN]];
  const paidCases = paidRoutes.flatMap(([route, send]) =>
    actors.map(([actor, user]) => [route, actor, user, send] as const)
  );

  it.each(paidCases)("paid order is locked: %s by %s → 400, items and totals unchanged", async (_route, _actor, user, send) => {
    currentUser = user;
    // admin criando via POST / mira o próprio pedido; o pedido pago encontrado é o do par (campanha, usuário)
    setPaid(true);

    const res = await send();

    expect(res.status).toBe(400);
    expectNoItemWrites();
  });

  it("unpaid order can still replace items via PUT (control)", async () => {
    setPaid(false);

    const res = await request(app).put("/api/orders/o-1").send({ items: [{ productId: "p-own", quantity: 3 }] });

    expect(res.status).toBe(200);
    expect(mockPrisma.orderItem.createMany).toHaveBeenCalled();
    expect(mockRecalculate).toHaveBeenCalled();
  });

  it.each([["owner", OWNER], ["creator", CREATOR]])(
    "paid order cannot be deleted: DELETE /api/orders/:id by %s → 400, order kept",
    async (_name, user) => {
      currentUser = user;
      setPaid(true);

      const res = await request(app).delete("/api/orders/o-1");

      expect(res.status).toBe(400);
      expect(mockPrisma.order.delete).not.toHaveBeenCalled();
      expect(mockPrisma.order.deleteMany).not.toHaveBeenCalled();
    }
  );

  it("admin keeps deleting a paid order (Unresolved 6)", async () => {
    currentUser = ADMIN;
    setPaid(true);

    const res = await request(app).delete("/api/orders/o-1");

    expect(res.status).toBe(204);
  });

  it("creator cannot delete an unpaid order of someone else → 403", async () => {
    currentUser = CREATOR;
    setPaid(false);

    const res = await request(app).delete("/api/orders/o-1");

    expect(res.status).toBe(403);
    expect(mockPrisma.order.delete).not.toHaveBeenCalled();
  });

  it("duplicate order returns 409 when the unique (campaignId, userId) fires", async () => {
    mockPrisma.order.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.22.0",
        meta: { target: ["campaignId", "userId"] },
      })
    );

    const res = await request(app).post("/api/orders").send({ campaignId: "c-1", items: [{ productId: "p-own", quantity: 1 }] });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ status: "error", message: expect.any(String) });
  });
});
