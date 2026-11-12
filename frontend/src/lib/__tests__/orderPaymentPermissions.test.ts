import { describe, expect, it } from "vitest";
import { canMarkPaidWithoutProof, canTogglePayment } from "../orderPaymentPermissions";

describe("orderPaymentPermissions", () => {
  const campaign = { creatorId: "creator-1" };

  it.each([
    ["participant", { id: "buyer-1", role: "CUSTOMER" }, false],
    ["creator", { id: "creator-1", role: "CAMPAIGN_CREATOR" }, true],
    // O papel CAMPAIGN_CREATOR não basta: precisa ser o criador desta campanha
    ["creator of another campaign", { id: "other", role: "CAMPAIGN_CREATOR" }, false],
    ["admin", { id: "admin-1", role: "ADMIN" }, true],
    ["anonymous", null, false],
  ])("mark paid without proof by role: %s → %s", (_name, user, expected) => {
    expect(canMarkPaidWithoutProof(user, campaign)).toBe(expected);
  });

  it.each([
    ["missing campaign", { id: "admin-1", role: "ADMIN" }, null],
    ["campaign without creator", { id: "", role: "CUSTOMER" }, { creatorId: "" }],
  ])("mark paid without proof by role: %s → false", (_name, user, campaignOrNull) => {
    expect(canMarkPaidWithoutProof(user, campaignOrNull)).toBe(false);
  });

  it.each([
    ["pendente, participante", false, false, true],
    ["pendente, criador/admin", false, true, true],
    ["pago, participante", true, false, false],
    ["pago, criador/admin", true, true, true],
  ])("alternar pagamento: %s → %s", (_name, isPaid, canMarkWithoutProof, expected) => {
    expect(canTogglePayment({ isPaid }, canMarkWithoutProof)).toBe(expected);
  });
});
