import { CampaignWithProducts } from "@/api";

type CampaignStatus = CampaignWithProducts["status"];

const campaignStatusConfig: Record<
  CampaignStatus,
  { label: string; classes: string }
> = {
  ACTIVE: {
    label: "Ativa",
    classes: "bg-emerald-100 text-emerald-700",
  },
  CLOSED: {
    label: "Fechada",
    classes: "bg-amber-100 text-amber-700",
  },
  SENT: {
    label: "Enviada",
    classes: "bg-sky-100 text-sky-700",
  },
  ARCHIVED: {
    label: "Arquivada",
    classes: "bg-sky-50 text-sky-500",
  },
};

export function getCampaignStatusBadge(status: CampaignStatus) {
  return campaignStatusConfig[status];
}
