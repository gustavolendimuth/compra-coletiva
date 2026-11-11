import { PaymentReleaseService } from "./paymentReleaseService";
import { prisma } from "../index";
import { NotificationService } from "./notificationService";

jest.mock("../index", () => ({
  prisma: {
    campaign: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("./notificationService", () => ({
  NotificationService: {
    createNotification: jest.fn(),
  },
}));

const mockPrisma = prisma as unknown as {
  campaign: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  notification: {
    findMany: jest.Mock;
  };
};

const mockNotificationService = NotificationService as unknown as {
  createNotification: jest.Mock;
};

describe("PaymentReleaseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should avoid duplicate PAYMENT_RELEASED notifications for buyers already notified", async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: "campaign-1",
      slug: "campaign-1",
      name: "Campanha 1",
      status: "ACTIVE",
      pixKey: "buyer@example.com",
      pixType: "EMAIL",
      pixName: "Titular",
      shippingCost: 20,
      paymentReleaseTrigger: "ON_SHIPPING_UPDATED",
      paymentReleased: false,
      orders: [{ userId: "buyer-1", isPaid: false }],
    });
    mockPrisma.campaign.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.notification.findMany.mockResolvedValue([{ userId: "buyer-1" }]);

    const result = await PaymentReleaseService.checkAndReleaseForCampaign("campaign-1");

    expect(result).toEqual({
      released: true,
      notificationsSent: 0,
    });
    expect(mockNotificationService.createNotification).not.toHaveBeenCalled();
  });

  it("should notify only buyers without prior PAYMENT_RELEASED when campaign is already released", async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: "campaign-2",
      slug: "campaign-2",
      name: "Campanha 2",
      status: "ACTIVE",
      pixKey: "buyer@example.com",
      pixType: "EMAIL",
      pixName: "Titular",
      shippingCost: 20,
      paymentReleaseTrigger: "ON_SHIPPING_UPDATED",
      paymentReleased: true,
      orders: [
        { userId: "buyer-1", isPaid: false },
        { userId: "buyer-2", isPaid: false },
      ],
    });
    mockPrisma.notification.findMany.mockResolvedValue([{ userId: "buyer-1" }]);

    const result = await PaymentReleaseService.checkAndReleaseForCampaign("campaign-2");

    expect(result).toEqual({
      released: false,
      notificationsSent: 1,
      reason: "ALREADY_RELEASED",
    });
    expect(mockPrisma.campaign.updateMany).not.toHaveBeenCalled();
    expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(1);
    expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
      "buyer-2",
      "PAYMENT_RELEASED",
      "Pagamento liberado",
      expect.any(String),
      expect.objectContaining({
        campaignId: "campaign-2",
      })
    );
  });
});
