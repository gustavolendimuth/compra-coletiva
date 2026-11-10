import express from "express";
import request from "supertest";

// ── Mocks ───────────────────────────────────────────────────────────────────

// Pedido de "owner-1" numa campanha criada por "creator-1"
const order = {
  id: "order-1",
  userId: "owner-1",
  campaignId: "campaign-1",
  campaign: { id: "campaign-1", creatorId: "creator-1", status: "ACTIVE" },
  items: [],
};

// Guards reais de authMiddleware usam o próprio PrismaClient
const mockGuardOrderFindUnique = jest.fn();
jest.mock("@prisma/client", () => ({
  ...jest.requireActual("@prisma/client"),
  PrismaClient: jest.fn(() => ({ order: { findUnique: mockGuardOrderFindUnique } })),
}));

const mockOrderFindUnique = jest.fn();
const mockOrderItemCreate = jest.fn();
const mockOrderItemCreateMany = jest.fn();
const mockOrderItemDeleteMany = jest.fn();
jest.mock("../../index", () => {
  const prisma: Record<string, unknown> = {
    order: { findUnique: mockOrderFindUnique },
    product: { findMany: jest.fn().mockResolvedValue([{ id: "product-1", price: 10 }]) },
    orderItem: {
      create: mockOrderItemCreate,
      createMany: mockOrderItemCreateMany,
      deleteMany: mockOrderItemDeleteMany,
    },
    // Locks da escrita de itens: campanha ACTIVE e pedido não pago
    $queryRaw: jest.fn((strings: TemplateStringsArray) =>
      Promise.resolve(/FROM campaigns/i.test(strings.join("?")) ? [{ status: "ACTIVE" }] : [{ isPaid: false }])
    ),
  };
  prisma.$transaction = (fn: (tx: unknown) => Promise<unknown>) => fn(prisma);
  return { prisma };
});

jest.mock("../../services/shippingCalculator", () => ({
  ShippingCalculator: { recalculateCampaignTotals: jest.fn(), distributeShipping: jest.fn() },
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

// requireAuth injeta o usuário do teste; os guards de ownership são os reais
let currentUser: Express.User;
jest.mock("../../middleware/authMiddleware", () => ({
  ...jest.requireActual("../../middleware/authMiddleware"),
  optionalAuth: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = currentUser;
    next();
  },
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

const routes = [
  {
    name: "PUT /api/orders/:id",
    send: (app: express.Express) =>
      request(app).put("/api/orders/order-1").send({ items: [{ productId: "product-1", quantity: 2 }] }),
    successStatus: 200,
    write: () => mockOrderItemCreateMany,
  },
  {
    name: "POST /api/orders/:id/items",
    send: (app: express.Express) =>
      request(app).post("/api/orders/order-1/items").send({ productId: "product-1", quantity: 2 }),
    successStatus: 200,
    write: () => mockOrderItemCreate,
  },
  {
    name: "DELETE /api/orders/:id/items/:itemId",
    send: (app: express.Express) => request(app).delete("/api/orders/order-1/items/item-1"),
    successStatus: 204,
    write: () => mockOrderItemDeleteMany,
  },
];

describe("edição de itens do pedido: quem pode", () => {
  const app = createApp();

  beforeEach(() => {
    mockGuardOrderFindUnique.mockResolvedValue(order);
    mockOrderFindUnique.mockResolvedValue(order);
    mockOrderItemDeleteMany.mockResolvedValue({ count: 1 });
  });

  describe.each(routes)("$name", ({ send, successStatus, write }) => {
    it("criador da campanha edita pedido alheio", async () => {
      currentUser = { id: "creator-1", role: "CAMPAIGN_CREATOR" } as Express.User;

      const res = await send(app);

      expect(res.status).toBe(successStatus);
      expect(write()).toHaveBeenCalledTimes(1);
    });

    it("dono do pedido edita o próprio pedido", async () => {
      currentUser = { id: "owner-1", role: "CUSTOMER" } as Express.User;

      const res = await send(app);

      expect(res.status).toBe(successStatus);
      expect(write()).toHaveBeenCalledTimes(1);
    });

    it("quem não é dono, criador nem ADMIN recebe 403 e nada é gravado", async () => {
      currentUser = { id: "stranger-1", role: "CUSTOMER" } as Express.User;

      const res = await send(app);

      expect(res.status).toBe(403);
      expect(write()).not.toHaveBeenCalled();
    });
  });
});
