import { prisma } from '../index';
import { Money } from '../utils/money';

interface OrderItemWithWeight {
  orderId: string;
  totalWeight: number;
  subtotal: number;
}

export class ShippingCalculator {
  /**
   * Distribui o frete total proporcionalmente ao peso de cada pedido
   */
  static async distributeShipping(campaignId: string): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        orders: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const totalShipping = campaign.shippingCost;
    const orderWeights: OrderItemWithWeight[] = [];

    // Calcula peso total de cada pedido
    for (const order of campaign.orders) {
      let orderWeight = 0;
      let subtotal = 0;

      for (const item of order.items) {
        const itemWeight = item.product.weight * item.quantity;
        orderWeight += itemWeight;
        subtotal += item.subtotal;
      }

      if (orderWeight > 0) {
        orderWeights.push({
          orderId: order.id,
          totalWeight: orderWeight,
          subtotal
        });
      }
    }

    // Distribui o frete proporcionalmente usando Money utility
    const weights = orderWeights.map(o => o.totalWeight);
    const shippingFees = Money.distributeProportionally(totalShipping, weights);

    // Atualiza cada pedido com o frete distribuído
    for (let i = 0; i < orderWeights.length; i++) {
      const orderData = orderWeights[i];
      const shippingFee = shippingFees[i];
      const total = Money.add(orderData.subtotal, shippingFee);

      await prisma.order.update({
        where: { id: orderData.orderId },
        data: {
          shippingFee,
          total
        }
      });
    }
  }

  /**
   * Recalcula subtotal de um pedido baseado nos itens
   */
  static async recalculateOrderSubtotal(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Sum item subtotals with Money utility
    const subtotal = Money.sum(order.items.map(item => item.subtotal));

    await prisma.order.update({
      where: { id: orderId },
      data: { subtotal }
    });

    // Redistribui frete da campanha
    await this.distributeShipping(order.campaignId);
  }
}
