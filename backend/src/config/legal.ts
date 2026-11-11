export const LEGAL_TERMS_VERSION = process.env.LEGAL_TERMS_VERSION || "2026-03-12";
export const LEGAL_PRIVACY_VERSION = process.env.LEGAL_PRIVACY_VERSION || "2026-03-12";
export const LEGAL_SALES_DISCLAIMER_VERSION =
  process.env.LEGAL_SALES_DISCLAIMER_VERSION || "2026-03-12";

export const LEGAL_ACCEPTANCE_CONTEXT = {
  REGISTER: "register",
  OAUTH_ONBOARDING: "oauth_onboarding",
  ORDER_FLOW: "order_flow",
} as const;

export function getLegalVersions() {
  return {
    termsVersion: LEGAL_TERMS_VERSION,
    privacyVersion: LEGAL_PRIVACY_VERSION,
    salesDisclaimerVersion: LEGAL_SALES_DISCLAIMER_VERSION,
  };
}
