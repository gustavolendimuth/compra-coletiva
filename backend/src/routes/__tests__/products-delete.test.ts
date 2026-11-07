import express from "express";
import request from "supertest";

// ── Mocks ───────────────────────────────────────────────────────────────────

let ordersWithProduct: Array<{ id: string; isPaid: boolean }> = [];
const mockPrisma: Record<string, any> = {
  product: {
    findUnique: jest.fn(() =>
      Promise.resolve({
        id: "p-1",
        campaignId: "c-1",
        imageKey: null,
        imageStorageType: null,
        campaign: { id: "c-1", creatorId: "creator-1", status: "ACTIVE" },
      })
    ),
    delete: jest.fn(() => Promise.resolve({})),
    deleteMany: jest.fn(() => Promise.resolve({ count: 1 })),
  },
  orderItem: { deleteMany: jest.fn(() => Promise.resolve({ count: 1 })) },
  order: {
    findMany: jest.fn(() => Promise.resolve(ordersWithProduct)),
    count: jest.fn(() => Promise.resolve(ordersWithProduct.filter((o) => o.isPaid).length)),
  },
  $queryRaw: jest.fn((strings: TemplateStringsArray) => {
    const sql = strings.join("?");
    if (/FROM campaigns/i.test(sql)) return Promise.resolve([{ status: "ACTIVE" }]);
    return Promise.resolve(ordersWithProduct);
  }),
  $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma)),
};
jest.mock("../../index", () => ({ prisma: mockPrisma }));

jest.mock("../../services/shippingCalculator", () => ({
  ShippingCalculator: { recalculateCampaignTotals: jest.fn(), distributeShipping: jest.fn() },
}));
jest.mock("../../services/imageUploadService", () => ({
  ImageUploadService: { deleteImage: jest.fn() },
}));
jest.mock("../../middleware/authMiddleware", () => ({
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: "creator-1", role: "ADMIN" } as Express.User;
    next();
  },
}));

import productRouter from "../products";
import { errorHandler } from "../../middleware/errorHandler";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/products", productRouter);
  app.use(errorHandler);
  return app;
}

describe("DELETE /api/products/:id", () => {
  const app = createApp();

  it("product in paid order → 400, product and items kept", async () => {
    ordersWithProduct = [
      { id: "o-paid", isPaid: true },
      { id: "o-open", isPaid: false },
    ];

    const res = await request(app).delete("/api/products/p-1");

    expect(res.status).toBe(400);
    expect(mockPrisma.product.delete).not.toHaveBeenCalled();
    expect(mockPrisma.product.deleteMany).not.toHaveBeenCalled();
    expect(mockPrisma.orderItem.deleteMany).not.toHaveBeenCalled();
  });
});
