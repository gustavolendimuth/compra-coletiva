jest.mock("../../index", () => ({ prisma: {} }));

import { Prisma } from "@prisma/client";
import { ShippingCalculator } from "../shippingCalculator";

type FakeItem = { quantity: number; subtotal: number; weight: number };
type FakeOrder = { id: string; items: FakeItem[] };

function fakeTx(shippingCost: number, orders: FakeOrder[]) {
  const updates = new Map<string, { subtotal: number; shippingFee: number; total: number }>();
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue([{ status: "ACTIVE" }]),
    campaign: {
      findUnique: jest.fn().mockResolvedValue({
        shippingCost,
        orders: orders.map((order) => ({
          id: order.id,
          items: order.items.map((item) => ({
            quantity: item.quantity,
            subtotal: item.subtotal,
            product: { weight: item.weight },
          })),
        })),
      }),
    },
    order: {
      update: jest.fn(({ where, data }: { where: { id: string }; data: { subtotal: number; shippingFee: number; total: number } }) => {
        updates.set(where.id, data);
        return Promise.resolve({});
      }),
    },
  };
  return { tx: tx as unknown as Prisma.TransactionClient, updates };
}

describe("ShippingCalculator.recalculateCampaignTotals", () => {
  it("zero weight order: shippingFee 0 and total equals subtotal", async () => {
    const { tx, updates } = fakeTx(30, [
      { id: "o-zero", items: [{ quantity: 2, subtotal: 50, weight: 0 }] },
      { id: "o-heavy", items: [{ quantity: 2, subtotal: 20, weight: 1 }] },
      { id: "o-light", items: [{ quantity: 1, subtotal: 10, weight: 1 }] },
    ]);

    await ShippingCalculator.recalculateCampaignTotals(tx, "c-1");

    expect(updates.get("o-zero")).toEqual({ subtotal: 50, shippingFee: 0, total: 50 });
    expect(updates.get("o-heavy")).toEqual({ subtotal: 20, shippingFee: 20, total: 40 });
    expect(updates.get("o-light")).toEqual({ subtotal: 10, shippingFee: 10, total: 20 });
  });

  it("emptied order: subtotal, shippingFee and total are 0", async () => {
    const { tx, updates } = fakeTx(30, [
      { id: "o-empty", items: [] },
      { id: "o-other", items: [{ quantity: 1, subtotal: 10, weight: 1 }] },
    ]);

    await ShippingCalculator.recalculateCampaignTotals(tx, "c-1");

    expect(updates.get("o-empty")).toEqual({ subtotal: 0, shippingFee: 0, total: 0 });
  });

  it("fees sum to shipping cost and none is negative", async () => {
    const weights = [1, 1, 1, 0.0001];
    const { tx, updates } = fakeTx(
      0.05,
      weights.map((weight, i) => ({ id: `o-${i}`, items: [{ quantity: 1, subtotal: 5, weight }] }))
    );

    await ShippingCalculator.recalculateCampaignTotals(tx, "c-1");

    const fees = [...updates.values()].map((u) => u.shippingFee);
    expect(fees).toHaveLength(4);
    fees.forEach((fee) => expect(fee).toBeGreaterThanOrEqual(0));
    expect(fees.reduce((sum, fee) => sum + Math.round(fee * 100), 0)).toBe(5);
  });
});
