import { Money } from "../utils/money";

interface CampaignOrderSummaryItem {
  quantity: number;
  productName: string;
}

interface CampaignOrderSummaryOrder {
  customerName: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  isPaid: boolean;
  items: CampaignOrderSummaryItem[];
}

interface CampaignOrderSummaryInput {
  campaignId: string;
  campaignName: string;
  campaignSlug: string | null;
  orders: CampaignOrderSummaryOrder[];
}

export interface CampaignOrderSummaryResult {
  campaignId: string;
  campaignName: string;
  campaignSlug: string | null;
  generatedAt: string;
  ordersCount: number;
  totalAmount: number;
  summaryText: string;
}

export class OrderSummaryGenerator {
  private static sanitizeText(value: string | null | undefined): string {
    if (!value) return "Sem informação";

    const sanitized = value
      .replace(/[\r\n\t]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[<>]/g, "")
      .trim();

    return sanitized || "Sem informação";
  }

  static generate(campaign: CampaignOrderSummaryInput): CampaignOrderSummaryResult {
    const generatedAt = new Date();
    const campaignName = this.sanitizeText(campaign.campaignName);

    const orders = [...campaign.orders]
      .map((order) => ({
        ...order,
        customerName: this.sanitizeText(order.customerName),
        items: [...order.items]
          .map((item) => ({
            quantity: item.quantity,
            productName: this.sanitizeText(item.productName),
          }))
          .sort((a, b) => a.productName.localeCompare(b.productName, "pt-BR")),
      }))
      .sort((a, b) => a.customerName.localeCompare(b.customerName, "pt-BR"));

    const totalAmount = Money.sum(orders.map((order) => order.total));

    const lines: string[] = [
      `Galera, segue o resumao dos pedidos da campanha ${campaignName}:`,
    ];

    if (orders.length === 0) {
      lines.push("Ainda nao entrou nenhum pedido por enquanto.");
    } else {
      orders.forEach((order, index) => {
        const itemsText =
          order.items.length === 0
            ? "sem produtos no pedido"
            : order.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ");

        lines.push(`${index + 1}. ${order.customerName}: ${itemsText}.`);
      });
    }

    lines.push("Se tiver algo diferente do seu pedido, me avisa.");

    return {
      campaignId: campaign.campaignId,
      campaignName,
      campaignSlug: campaign.campaignSlug,
      generatedAt: generatedAt.toISOString(),
      ordersCount: orders.length,
      totalAmount,
      summaryText: lines.join("\n").trim(),
    };
  }
}
