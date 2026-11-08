import express from "express";
import request from "supertest";
import { createPgClient, resetOrderTables, seedCampaign } from "../../__tests__/pgClient";

const db = createPgClient();
jest.mock("../../index", () => ({ prisma: db }));

jest.mock("../../services/imageUploadService", () => ({
  ImageUploadService: { deleteImage: jest.fn() },
}));
jest.mock("../../middleware/authMiddleware", () => ({
  requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { id: "admin-1", role: "ADMIN" } as Express.User;
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

afterAll(() => db.$disconnect());
beforeEach(() => resetOrderTables(db));

describe("DELETE /api/products/:id (Postgres)", () => {
  const app = createApp();

  it("recalculates affected orders when no paid order has the product", async () => {
    // P0: 10.00, peso 1 | P1: 5.00, peso 3; frete 40.00
    const { campaign, products, orders } = await seedCampaign(db, {
      shippingCost: 40,
      products: [
        { price: 10, weight: 1 },
        { price: 5, weight: 3 },
      ],
      orders: [
        { items: [{ productIndex: 0, quantity: 1 }, { productIndex: 1, quantity: 1 }] }, // perde P1
        { items: [{ productIndex: 1, quantity: 2 }] }, // fica vazio
        { items: [{ productIndex: 0, quantity: 3 }] }, // sem P1
      ],
    });

    const res = await request(app).delete(`/api/products/${products[1].id}`);

    expect(res.status).toBe(204);
    expect(await db.product.findUnique({ where: { id: products[1].id } })).toBeNull();
    expect(await db.orderItem.count({ where: { productId: products[1].id } })).toBe(0);

    const byId = new Map(
      (await db.order.findMany({ where: { campaignId: campaign.id } })).map((o) => [o.id, o])
    );
    // Restam pesos 1 (pedido 0) e 3 (pedido 2): frete 10 + 30
    expect(byId.get(orders[0].id)).toMatchObject({ subtotal: 10, shippingFee: 10, total: 20 });
    expect(byId.get(orders[1].id)).toMatchObject({ subtotal: 0, shippingFee: 0, total: 0 });
    expect(byId.get(orders[2].id)).toMatchObject({ subtotal: 30, shippingFee: 30, total: 60 });
  });

  it("product in paid order keeps product and items (Postgres)", async () => {
    const { products } = await seedCampaign(db, {
      products: [{ price: 10, weight: 1 }],
      orders: [{ isPaid: true, items: [{ productIndex: 0, quantity: 1 }] }],
    });

    const res = await request(app).delete(`/api/products/${products[0].id}`);

    expect(res.status).toBe(400);
    expect(await db.product.findUnique({ where: { id: products[0].id } })).not.toBeNull();
    expect(await db.orderItem.count({ where: { productId: products[0].id } })).toBe(1);
  });
});
