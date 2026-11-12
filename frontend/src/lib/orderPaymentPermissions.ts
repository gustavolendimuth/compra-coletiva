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

type OrderPaymentState = { isPaid: boolean };

export const PAID_ORDER_LOCKED_MESSAGE = "Pedido já pago não pode ser alterado";

/**
 * Pedido pago fica travado para edição e remoção, para qualquer ator (o backend recusa).
 * Para mexer nele, o criador ou ADMIN desmarca o pagamento antes.
 */
export function isOrderLocked(order: OrderPaymentState): boolean {
  return order.isPaid;
}

/**
 * Pedido pendente: quem gerencia o pedido envia o comprovante.
 * Pedido pago: só quem marca pago sem comprovante (criador ou ADMIN) desmarca.
 */
export function canTogglePayment(order: OrderPaymentState, canMarkWithoutProof: boolean): boolean {
  return !order.isPaid || canMarkWithoutProof;
}
