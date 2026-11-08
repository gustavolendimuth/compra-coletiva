type PaymentActor = { id: string; role?: string | null } | null | undefined;
type PaymentCampaign = { creatorId?: string | null } | null | undefined;

/**
 * Marcar pedido como pago sem comprovante: só o criador da campanha ou ADMIN.
 * O participante marca pago apenas enviando o comprovante.
 */
export function canMarkPaidWithoutProof(user: PaymentActor, campaign: PaymentCampaign): boolean {
  if (!user || !campaign) return false;
  return user.role === "ADMIN" || (!!campaign.creatorId && campaign.creatorId === user.id);
}
