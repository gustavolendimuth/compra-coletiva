import { Prisma } from '@prisma/client';
import { prisma } from '../index';
import { Money } from '../utils/money';
import { lockCampaignRow } from './orderLocks';

export class ShippingCalculator {
  /**
   * Recalcula subtotal, frete e total de todos os pedidos da campanha a partir dos itens.
   * Roda dentro da transação recebida, com a linha da campanha travada: ou todos os
   * pedidos recebem os novos valores, ou nenhum.
   */
  static async recalculateCampaignTotals(
    tx: Prisma.TransactionClient,
    campaignId: string
  ): Promise<void> {
    await lockCampaignRow(tx, campaignId);

    const campaign = await tx.campaign.findUnique({
      where: { id: campaignId },
      select: {
        shippingCost: true,
        orders: {
          select: {
            id: true,
            items: {
              select: {
                quantity: true,
                subtotal: true,
                product: { select: { weight: true } },
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const orders = campaign.orders.map((order) => ({
      id: order.id,
      subtotal: Money.sum(order.items.map((item) => item.subtotal)),
      weight: order.items.reduce((sum, item) => sum + item.product.weight * item.quantity, 0),
    }));

    const weighted = orders.filter((order) => order.weight > 0);
    const fees = Money.distributeProportionally(
      campaign.shippingCost,
      weighted.map((order) => order.weight)
    );
    const feeByOrder = new Map(weighted.map((order, i) => [order.id, fees[i]]));

    for (const order of orders) {
      const shippingFee = feeByOrder.get(order.id) ?? 0;
      await tx.order.update({
        where: { id: order.id },
        data: {
          subtotal: order.subtotal,
          shippingFee,
          total: Money.add(order.subtotal, shippingFee),
        },
      });
    }
  }

  /**
   * Distribui o frete total proporcionalmente ao peso de cada pedido (transação própria)
   */
  static async distributeShipping(campaignId: string): Promise<void> {
    await prisma.$transaction((tx) => this.recalculateCampaignTotals(tx, campaignId));
  }

  /**
   * Recalcula os totais da campanha do pedido (transação própria)
   */
  static async recalculateOrderSubtotal(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { campaignId: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    await this.distributeShipping(order.campaignId);
  }
}
