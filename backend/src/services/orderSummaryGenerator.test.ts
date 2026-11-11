import { OrderSummaryGenerator } from "./orderSummaryGenerator";

describe("OrderSummaryGenerator", () => {
  it("should generate summary ordered by customer and products", () => {
    const summary = OrderSummaryGenerator.generate({
      campaignId: "campaign-1",
      campaignName: "Feira da Semana",
      campaignSlug: "feira-da-semana",
      orders: [
        {
          customerName: "Carlos",
          subtotal: 20,
          shippingFee: 5,
          total: 25,
          isPaid: false,
          items: [
            { quantity: 1, productName: "Banana" },
            { quantity: 2, productName: "Abacate" },
          ],
        },
        {
          customerName: "Ana",
          subtotal: 10,
          shippingFee: 2,
          total: 12,
          isPaid: true,
          items: [{ quantity: 3, productName: "Laranja" }],
        },
      ],
    });

    expect(summary.ordersCount).toBe(2);
    expect(summary.totalAmount).toBe(37);
    expect(summary.summaryText).toContain("Galera, segue o resumao dos pedidos da campanha Feira da Semana:");
    expect(summary.summaryText).toContain("1. Ana: 3x Laranja.");
    expect(summary.summaryText).toContain("2. Carlos: 2x Abacate, 1x Banana.");
    expect(summary.summaryText).toContain("Se tiver algo diferente do seu pedido, me avisa.");
    expect(summary.summaryText).not.toContain("Subtotal:");
    expect(summary.summaryText).not.toContain("Pagamento:");
  });

  it("should sanitize user provided text", () => {
    const summary = OrderSummaryGenerator.generate({
      campaignId: "campaign-1",
      campaignName: "<script>alert(1)</script>",
      campaignSlug: "safe",
      orders: [
        {
          customerName: "Joao\n<script>",
          subtotal: 10,
          shippingFee: 0,
          total: 10,
          isPaid: true,
          items: [{ quantity: 1, productName: "Tomate\t<em>" }],
        },
      ],
    });

    expect(summary.campaignName).not.toContain("<");
    expect(summary.summaryText).not.toContain("<script>");
    expect(summary.summaryText).toContain("1. Joao script: 1x Tomate em.");
  });

  it("should generate empty summary when campaign has no orders", () => {
    const summary = OrderSummaryGenerator.generate({
      campaignId: "campaign-1",
      campaignName: "Campanha vazia",
      campaignSlug: null,
      orders: [],
    });

    expect(summary.ordersCount).toBe(0);
    expect(summary.totalAmount).toBe(0);
    expect(summary.summaryText).toContain("Galera, segue o resumao dos pedidos da campanha Campanha vazia:");
    expect(summary.summaryText).toContain("Ainda nao entrou nenhum pedido por enquanto.");
    expect(summary.summaryText).toContain("Se tiver algo diferente do seu pedido, me avisa.");
  });
});
