import { createPgClient, resetOrderTables, seedCampaign } from "../../__tests__/pgClient";

const db = createPgClient();
jest.mock("../../index", () => ({ prisma: db }));

import { OrderCleanupService } from "../orderCleanupService";

afterAll(() => db.$disconnect());
beforeEach(() => resetOrderTables(db));

describe("OrderCleanupService.cleanupEmptyOrders (Postgres)", () => {
  it("keeps paid orders and removes old empty unpaid ones", async () => {
    const { orders } = await seedCampaign(db, {
      orders: [
        { isPaid: true, items: [] },
        { isPaid: false, items: [] },
      ],
    });
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000);
    await db.order.updateMany({ data: { createdAt: old } });

    const deleted = await OrderCleanupService.cleanupEmptyOrders(24);

    expect(deleted).toBe(1);
    expect(await db.order.findUnique({ where: { id: orders[0].id } })).not.toBeNull();
    expect(await db.order.findUnique({ where: { id: orders[1].id } })).toBeNull();
  });
});
