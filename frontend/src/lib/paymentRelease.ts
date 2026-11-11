import type { Campaign, PaymentReleaseTrigger } from "@/api";

const legacyPixVisibleStatusToTrigger: Record<
  Campaign["pixVisibleAtStatus"],
  Exclude<PaymentReleaseTrigger, "ON_SHIPPING_UPDATED">
> = {
  ACTIVE: "ON_ACTIVE",
  CLOSED: "ON_CLOSED",
  SENT: "ON_SENT",
  ARCHIVED: "ON_SENT",
};

export interface PaymentReleaseTriggerOption {
  value: PaymentReleaseTrigger;
  label: string;
  shortLabel: string;
  description: string;
}

export const paymentReleaseTriggerOptions: PaymentReleaseTriggerOption[] = [
  {
    value: "ON_ACTIVE",
    label: "Liberar com a campanha ativa",
    shortLabel: "Campanha ativa",
    description: "Os clientes ja veem o PIX e podem pagar assim que entrarem na campanha.",
  },
  {
    value: "ON_CLOSED",
    label: "Liberar quando a campanha fechar",
    shortLabel: "Campanha fechada",
    description: "O PIX so aparece depois que o organizador encerrar novas inscricoes.",
  },
  {
    value: "ON_SENT",
    label: "Liberar quando o pedido for enviado",
    shortLabel: "Pedido enviado",
    description: "O pagamento fica disponivel apenas apos marcar a campanha como enviada.",
  },
  {
    value: "ON_SHIPPING_UPDATED",
    label: "Liberar quando o frete for definido",
    shortLabel: "Frete definido",
    description: "Assim que o frete total for preenchido, os clientes recebem aviso para pagar.",
  },
];

export function getPaymentReleaseTrigger(
  trigger?: PaymentReleaseTrigger,
  pixVisibleAtStatus?: Campaign["pixVisibleAtStatus"]
): PaymentReleaseTrigger {
  if (trigger) {
    return trigger;
  }

  return legacyPixVisibleStatusToTrigger[pixVisibleAtStatus || "ACTIVE"];
}

export function getPixVisibleAtStatusForTrigger(
  trigger: PaymentReleaseTrigger
): Exclude<Campaign["pixVisibleAtStatus"], "ARCHIVED"> | undefined {
  switch (trigger) {
    case "ON_ACTIVE":
      return "ACTIVE";
    case "ON_CLOSED":
      return "CLOSED";
    case "ON_SENT":
      return "SENT";
    default:
      return undefined;
  }
}

export function canShowPixToBuyer(campaign: Campaign, hasOrder: boolean): boolean {
  return Boolean(
    hasOrder &&
      campaign.pixKey &&
      campaign.pixType &&
      campaign.status !== "ARCHIVED" &&
      campaign.paymentReleased
  );
}

export function canShowPaymentPendingNotice(
  campaign: Campaign,
  hasOrder: boolean
): boolean {
  return Boolean(
    hasOrder &&
      campaign.pixKey &&
      campaign.pixType &&
      campaign.status !== "ARCHIVED" &&
      !campaign.paymentReleased
  );
}
