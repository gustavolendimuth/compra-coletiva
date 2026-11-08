import { Prisma } from "@prisma/client";
import { createPgClient, resetOrderTables, seedCampaign } from "../../__tests__/pgClient";

const db = createPgClient();
jest.mock("../../index", () => ({ prisma: db }));

import { ShippingCalculator } from "../shippingCalculator";

afterAll(() => db.$disconnect());
beforeEach(() => resetOrderTables(db));

describe("ShippingCalculator (Postgres)", () => {
  it("rolls back partial recalculation when an update fails midway", async () => {
    const { campaign, orders } = await seedCampaign(db, {
      shippingCost: 30,
      products: [{ price: 10, weight: 1 }],
      orders: [
        { items: [{ productIndex: 0, quantity: 1 }] },
        { items: [{ productIndex: 0, quantity: 2 }] },
        { items: [{ productIndex: 0, quantity: 3 }] },
      ],
    });

    // A 2ª escrita de pedido dentro da transação falha
    const realTransaction = db.$transaction.bind(db);
    const spy = jest.spyOn(db, "$transaction").mockImplementation(((fn: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
      realTransaction(async (tx) => {
        let calls = 0;
        const failingOrder = new Proxy(tx.order, {
          get(target, prop, receiver) {
            if (prop === "update") {
              return async (args: Prisma.OrderUpdateArgs) => {
                calls += 1;
                if (calls === 2) throw new Error("boom on second update");
                return target.update(args);
              };
            }
            return Reflect.get(target, prop, receiver);
          },
        });
        const failingTx = new Proxy(tx, {
          get(target, prop, receiver) {
            if (prop === "order") return failingOrder;
            return Reflect.get(target, prop, receiver);
          },
        });
        return fn(failingTx);
      })) as typeof db.$transaction);

    await expect(ShippingCalculator.distributeShipping(campaign.id)).rejects.toThrow("boom on second update");
    spy.mockRestore();

    const after = await db.order.findMany({ where: { campaignId: campaign.id }, orderBy: { id: "asc" } });
    expect(after).toHaveLength(orders.length);
    after.forEach((order) => {
      expect(order.shippingFee).toBe(999);
      expect(order.total).toBe(1998);
    });

    // Sem a falha, o recálculo grava tudo
    await ShippingCalculator.distributeShipping(campaign.id);
    const fixed = await db.order.findMany({ where: { campaignId: campaign.id } });
    expect(fixed.reduce((sum, o) => sum + Math.round(o.shippingFee * 100), 0)).toBe(3000);
  });
});
