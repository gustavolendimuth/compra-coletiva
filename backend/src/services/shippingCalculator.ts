import { prisma } from '../index';

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
    let totalWeight = 0;

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
        totalWeight += orderWeight;
      }
    }

    // Distribui o frete proporcionalmente
    let distributedShipping = 0;

    for (let i = 0; i < orderWeights.length; i++) {
      const orderData = orderWeights[i];
      let shippingFee: number;

      // Última linha recebe o resto para evitar erros de arredondamento
      if (i === orderWeights.length - 1) {
        shippingFee = totalShipping - distributedShipping;
      } else {
        shippingFee = totalWeight > 0
          ? (orderData.totalWeight / totalWeight) * totalShipping
          : 0;
      }

      const total = orderData.subtotal + shippingFee;

      await prisma.order.update({
        where: { id: orderData.orderId },
        data: {
          shippingFee: Math.round(shippingFee * 100) / 100,
          total: Math.round(total * 100) / 100
        }
      });

      distributedShipping += shippingFee;
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

    const subtotal = order.items.reduce((sum, item) => sum + item.subtotal, 0);

    await prisma.order.update({
      where: { id: orderId },
      data: { subtotal }
    });

    // Redistribui frete da campanha
    await this.distributeShipping(order.campaignId);
  }
}
