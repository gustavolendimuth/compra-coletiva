import express from "express";
import request from "supertest";

// ── Mocks ───────────────────────────────────────────────────────────────────

let ordersWithProduct: Array<{ id: string; isPaid: boolean }> = [];
let lockedStatus = "ACTIVE";
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
  },
  $queryRaw: jest.fn((strings: TemplateStringsArray) => {
    const sql = strings.join("?");
    if (/FROM campaigns/i.test(sql)) return Promise.resolve([{ status: lockedStatus }]);
    return Promise.resolve(ordersWithProduct);
  }),
  $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(mockPrisma)),
};
jest.mock("../../index", () => ({ prisma: mockPrisma }));

const mockRecalculate = jest.fn();
jest.mock("../../services/shippingCalculator", () => ({
  ShippingCalculator: { recalculateCampaignTotals: (...args: unknown[]) => mockRecalculate(...args) },
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

  it.each([
    ["product in paid order", "ACTIVE", "Não é possível remover um produto que está em pedido já pago"],
    ["campaign closed between the first read and the lock", "CLOSED", "Cannot delete products from a closed or sent group"],
  ])("%s → 400, product and items kept", async (_name, status, message) => {
    ordersWithProduct = [
      { id: "o-paid", isPaid: true },
      { id: "o-open", isPaid: false },
    ];
    lockedStatus = status;

    const res = await request(app).delete("/api/products/p-1");
    lockedStatus = "ACTIVE";

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
    expect(mockPrisma.product.delete).not.toHaveBeenCalled();
    expect(mockRecalculate).not.toHaveBeenCalled();
  });

  it("product only in unpaid orders is deleted and totals recalculated (control)", async () => {
    ordersWithProduct = [{ id: "o-open", isPaid: false }];

    const res = await request(app).delete("/api/products/p-1");

    expect(res.status).toBe(204);
    expect(mockPrisma.product.delete).toHaveBeenCalledWith({ where: { id: "p-1" } });
    expect(mockRecalculate).toHaveBeenCalledWith(mockPrisma, "c-1");
  });
});
