import { describe, expect, it } from "vitest";
import { createMockCampaignFull } from "@/__tests__/mock-data";
import {
  canShowPaymentPendingNotice,
  canShowPixToBuyer,
  getPaymentReleaseTrigger,
  getPixVisibleAtStatusForTrigger,
} from "../paymentRelease";

describe("paymentRelease helpers", () => {
  it("should preserve explicit payment release trigger", () => {
    expect(getPaymentReleaseTrigger("ON_SHIPPING_UPDATED", "CLOSED")).toBe(
      "ON_SHIPPING_UPDATED"
    );
  });

  it("should map legacy pixVisibleAtStatus when trigger is missing", () => {
    expect(getPaymentReleaseTrigger(undefined, "CLOSED")).toBe("ON_CLOSED");
    expect(getPaymentReleaseTrigger(undefined, "SENT")).toBe("ON_SENT");
  });

  it("should only map status-based triggers back to pixVisibleAtStatus", () => {
    expect(getPixVisibleAtStatusForTrigger("ON_ACTIVE")).toBe("ACTIVE");
    expect(getPixVisibleAtStatusForTrigger("ON_SHIPPING_UPDATED")).toBeUndefined();
  });

  it("should show pix only after payment release", () => {
    const campaign = createMockCampaignFull({
      pixKey: "buyer@example.com",
      pixType: "EMAIL",
      paymentReleased: true,
    });

    expect(canShowPixToBuyer(campaign, true)).toBe(true);
    expect(canShowPaymentPendingNotice(campaign, true)).toBe(false);
  });

  it("should show pending notice while payment is blocked", () => {
    const campaign = createMockCampaignFull({
      pixKey: "buyer@example.com",
      pixType: "EMAIL",
      paymentReleased: false,
      paymentReleaseTrigger: "ON_SHIPPING_UPDATED",
    });

    expect(canShowPixToBuyer(campaign, true)).toBe(false);
    expect(canShowPaymentPendingNotice(campaign, true)).toBe(true);
  });
});
