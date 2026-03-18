import crypto from "crypto";

const PUBLIC_ALIAS_SECRET =
  process.env.PUBLIC_ALIAS_SECRET ||
  process.env.JWT_ACCESS_SECRET ||
  "dev-public-alias-secret-change-in-production";

export function generatePublicAlias(userId: string, campaignId: string): string {
  const digest = crypto
    .createHmac("sha256", PUBLIC_ALIAS_SECRET)
    .update(`${campaignId}:${userId}`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();

  return `Comprador ${digest}`;
}
