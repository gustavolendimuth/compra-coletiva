import { CampaignStatus, Prisma } from '@prisma/client';

/**
 * Row locks used by every write that changes order items or totals.
 * Always lock the campaign first, then the order, to keep a single lock order.
 */

/**
 * Locks the campaign row until the transaction ends and returns its current status.
 * `FOR NO KEY UPDATE` blocks concurrent status changes (scheduler, creator) and other
 * order writes in the same campaign, but not FK checks of inserts that reference it.
 */
export async function lockCampaignRow(
  tx: Prisma.TransactionClient,
  campaignId: string
): Promise<CampaignStatus | null> {
  const rows = await tx.$queryRaw<Array<{ status: CampaignStatus }>>`
    SELECT status FROM campaigns WHERE id = ${campaignId} FOR NO KEY UPDATE
  `;
  return rows[0]?.status ?? null;
}

/**
 * Locks the order row until the transaction ends and returns its payment state.
 */
export async function lockOrderRow(
  tx: Prisma.TransactionClient,
  orderId: string
): Promise<{ isPaid: boolean } | null> {
  const rows = await tx.$queryRaw<Array<{ isPaid: boolean }>>`
    SELECT "isPaid" FROM orders WHERE id = ${orderId} FOR UPDATE
  `;
  return rows[0] ?? null;
}
