/**
 * Visibilidade dos dados PIX da campanha para o requisitante.
 * Mesma regra de canShowPixToBuyer (frontend/src/lib/paymentRelease.ts):
 * criador e ADMIN sempre veem; comprador só com pedido, paymentReleased=true e status != ARCHIVED.
 */

interface PixViewer {
  id: string;
  role: string;
}

interface PixCampaignFields {
  creatorId?: string | null;
  status?: string | null;
  paymentReleased?: boolean | null;
  pixKey?: string | null;
  pixType?: string | null;
  pixName?: string | null;
}

export function canViewerSeePix(
  campaign: PixCampaignFields,
  viewer: PixViewer | undefined,
  viewerHasOrder: boolean
): boolean {
  if (!viewer) return false;
  if (viewer.role === "ADMIN" || campaign.creatorId === viewer.id) return true;
  return Boolean(viewerHasOrder && campaign.paymentReleased && campaign.status !== "ARCHIVED");
}

/**
 * Remove pixKey/pixName/pixType quando o requisitante não pode vê-los e acrescenta hasPixConfigured
 */
export function applyPixVisibility<T extends PixCampaignFields>(
  campaign: T,
  canSeePix: boolean
): Omit<T, "pixKey" | "pixName" | "pixType"> & Partial<Pick<T, "pixKey" | "pixName" | "pixType">> & { hasPixConfigured: boolean } {
  const hasPixConfigured = Boolean(campaign.pixKey && campaign.pixType);
  if (canSeePix) {
    return { ...campaign, hasPixConfigured };
  }
  const { pixKey: _pixKey, pixName: _pixName, pixType: _pixType, ...rest } = campaign;
  return { ...rest, hasPixConfigured };
}
