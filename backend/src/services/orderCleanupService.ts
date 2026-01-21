import { prisma } from '../index';

/**
 * Service for cleaning up orphaned orders (empty orders created but never filled)
 */
export class OrderCleanupService {
  /**
   * Deletes empty orders older than the specified age
   * @param ageInHours - Age threshold in hours (default: 24 hours)
   * @returns Number of orders deleted
   */
  static async cleanupEmptyOrders(ageInHours: number = 24): Promise<number> {
    const cutoffDate = new Date(Date.now() - ageInHours * 60 * 60 * 1000);

    try {
      // Find and delete orders that:
      // 1. Have no items
      // 2. Are older than the cutoff date
      // 3. Are from ACTIVE campaigns only (don't touch historical data)
      const result = await prisma.order.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          items: { none: {} },
          campaign: {
            status: 'ACTIVE',
          },
        },
      });

      console.log(`[OrderCleanup] Deleted ${result.count} empty orders older than ${ageInHours} hours`);
      return result.count;
    } catch (error) {
      console.error('[OrderCleanup] Error cleaning up empty orders:', error);
      throw error;
    }
  }

  /**
   * Gets statistics about empty orders
   * @returns Object with count and age information
   */
  static async getEmptyOrdersStats(): Promise<{
    total: number;
    olderThan24h: number;
    olderThan1h: number;
  }> {
    const now = Date.now();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    try {
      const [total, olderThan24h, olderThan1h] = await Promise.all([
        prisma.order.count({
          where: {
            items: { none: {} },
            campaign: { status: 'ACTIVE' },
          },
        }),
        prisma.order.count({
          where: {
            items: { none: {} },
            campaign: { status: 'ACTIVE' },
            createdAt: { lt: twentyFourHoursAgo },
          },
        }),
        prisma.order.count({
          where: {
            items: { none: {} },
            campaign: { status: 'ACTIVE' },
            createdAt: { lt: oneHourAgo },
          },
        }),
      ]);

      return { total, olderThan24h, olderThan1h };
    } catch (error) {
      console.error('[OrderCleanup] Error getting empty orders stats:', error);
      throw error;
    }
  }
}
