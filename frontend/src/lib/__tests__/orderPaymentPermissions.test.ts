import { describe, expect, it } from "vitest";
import { canMarkPaidWithoutProof } from "../orderPaymentPermissions";

describe("orderPaymentPermissions", () => {
  const campaign = { creatorId: "creator-1" };

  it.each([
    ["participant", { id: "buyer-1", role: "CUSTOMER" }, false],
    ["creator", { id: "creator-1", role: "CAMPAIGN_CREATOR" }, true],
    ["admin", { id: "admin-1", role: "ADMIN" }, true],
    ["anonymous", null, false],
  ])("mark paid without proof by role: %s → %s", (_name, user, expected) => {
    expect(canMarkPaidWithoutProof(user, campaign)).toBe(expected);
  });
});
