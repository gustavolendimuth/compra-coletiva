import { generatePublicAlias } from "./publicAlias";

function getFirstAndLastName(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function getCampaignParticipantDisplayName(params: {
  fullName: string | null | undefined;
  hideNameInCampaigns: boolean;
  userId: string;
  campaignId: string;
}): string {
  const { fullName, hideNameInCampaigns, userId, campaignId } = params;

  if (!hideNameInCampaigns) {
    const normalizedName = fullName ? getFirstAndLastName(fullName) : "";
    if (normalizedName) {
      return normalizedName;
    }
  }

  return generatePublicAlias(userId, campaignId);
}
