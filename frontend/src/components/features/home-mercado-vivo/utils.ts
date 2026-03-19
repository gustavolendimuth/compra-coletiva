import { sanitizeText } from "@/lib/sanitize";
import type { CampaignWithProducts } from "@/api";

const EMOJIS = ["🥬", "🐟", "☕", "🍊", "🧀", "🍅", "🥖", "🥕"];

function formatNumberWithOptions(
  value: number,
  options: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat("pt-BR", options).format(value);
  } catch {
    const { notation, compactDisplay, ...fallbackOptions } = options;
    return new Intl.NumberFormat("pt-BR", fallbackOptions).format(value);
  }
}

export function formatCompactNumber(value: number): string {
  return formatNumberWithOptions(value, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  });
}

export function formatCurrencyCompact(value: number): string {
  return formatNumberWithOptions(value, {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

export function formatCampaignDistance(campaign: CampaignWithProducts): string {
  if (typeof campaign.distance === "number" && campaign.distance > 0) {
    return `${campaign.distance.toFixed(1).replace(".", ",")} km`;
  }

  if (campaign.pickupNeighborhood) {
    return campaign.pickupNeighborhood;
  }

  if (campaign.pickupCity) {
    return campaign.pickupCity;
  }

  return "Retirada local";
}

export function getCampaignEmoji(index: number): string {
  return EMOJIS[index % EMOJIS.length] ?? "🛒";
}

export function getDeadlineLabel(deadline?: string): string {
  if (!deadline) {
    return "Sem prazo definido";
  }

  const now = new Date();
  const date = new Date(deadline);
  const diffMs = date.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Encerrada";
  }

  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffHours < 24) {
    return `Encerra em ${diffHours}h`;
  }

  const diffDays = Math.ceil(diffHours / 24);

  if (diffDays === 1) {
    return "Encerra amanhã";
  }

  return `Encerra em ${diffDays} dias`;
}

export function sanitizeInlineText(value: string | undefined, fallback: string): string {
  const input = value && value.trim().length > 0 ? value : fallback;
  return sanitizeText(input);
}

export function sanitizeDescription(value: string | undefined, fallback: string): string {
  const input = value && value.trim().length > 0 ? value : fallback;
  return sanitizeText(input);
}

export function extractNeighborhoodCount(campaigns: CampaignWithProducts[]): number {
  const neighborhoods = campaigns
    .map((campaign) => `${campaign.pickupNeighborhood ?? ""}-${campaign.pickupCity ?? ""}`)
    .filter((value) => value !== "-");

  return new Set(neighborhoods).size;
}
