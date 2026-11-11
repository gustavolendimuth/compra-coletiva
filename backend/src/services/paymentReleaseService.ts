import { CampaignStatus, PaymentReleaseTrigger } from "@prisma/client";
import { prisma } from "../index";
import { NotificationService } from "./notificationService";

type PaymentReleaseCheckReason =
  | "CAMPAIGN_NOT_FOUND"
  | "PIX_NOT_CONFIGURED"
  | "ALREADY_RELEASED"
  | "TRIGGER_NOT_REACHED"
  | "ALREADY_RELEASED_CONCURRENT";

interface PaymentReleaseResult {
  released: boolean;
  notificationsSent: number;
  reason?: PaymentReleaseCheckReason;
}

const PIX_VISIBLE_STATUS_TO_TRIGGER: Record<CampaignStatus, PaymentReleaseTrigger> = {
  ACTIVE: "ON_ACTIVE",
  CLOSED: "ON_CLOSED",
  SENT: "ON_SENT",
  ARCHIVED: "ON_SENT",
};

export class PaymentReleaseService {
  private static async notifyUnpaidBuyersOnce(
    campaign: {
      id: string;
      slug: string;
      name: string;
      pixKey: string;
      pixType: string;
      pixName: string | null;
    },
    buyerIds: string[]
  ): Promise<number> {
    if (buyerIds.length === 0) {
      return 0;
    }

    const existingNotifications = await prisma.notification.findMany({
      where: {
        userId: {
          in: buyerIds,
        },
        type: "PAYMENT_RELEASED",
        metadata: {
          path: ["campaignId"],
          equals: campaign.id,
        },
      },
      select: {
        userId: true,
      },
    });

    const alreadyNotifiedBuyerIds = new Set(existingNotifications.map((notification) => notification.userId));
    let notificationsSent = 0;

    for (const buyerId of buyerIds) {
      if (alreadyNotifiedBuyerIds.has(buyerId)) {
        continue;
      }

      try {
        await NotificationService.createNotification(
          buyerId,
          "PAYMENT_RELEASED",
          "Pagamento liberado",
          `O pagamento do grupo "${campaign.name}" foi liberado. Acesse a campanha para ver a chave PIX e enviar o comprovante.`,
          {
            campaignId: campaign.id,
            campaignSlug: campaign.slug,
            campaignName: campaign.name,
            pixKey: campaign.pixKey,
            pixType: campaign.pixType,
            pixName: campaign.pixName || undefined,
          }
        );
        notificationsSent += 1;
      } catch (error) {
        console.error(
          `[PaymentReleaseService] Failed to notify buyer ${buyerId} for campaign ${campaign.id}:`,
          error
        );
      }
    }

    return notificationsSent;
  }

  static mapPixVisibleAtStatusToTrigger(status: CampaignStatus): PaymentReleaseTrigger {
    return PIX_VISIBLE_STATUS_TO_TRIGGER[status];
  }

  static isTriggerReached(
    status: CampaignStatus,
    trigger: PaymentReleaseTrigger,
    shippingCost: number
  ): boolean {
    switch (trigger) {
      case "ON_ACTIVE":
        return true;
      case "ON_CLOSED":
        return ["CLOSED", "SENT", "ARCHIVED"].includes(status);
      case "ON_SENT":
        return ["SENT", "ARCHIVED"].includes(status);
      case "ON_SHIPPING_UPDATED":
        return shippingCost > 0;
      default:
        return false;
    }
  }

  static async checkAndReleaseForCampaign(campaignId: string): Promise<PaymentReleaseResult> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        pixKey: true,
        pixType: true,
        pixName: true,
        shippingCost: true,
        paymentReleaseTrigger: true,
        paymentReleased: true,
        orders: {
          select: {
            userId: true,
            isPaid: true,
          },
        },
      },
    });

    if (!campaign) {
      return { released: false, notificationsSent: 0, reason: "CAMPAIGN_NOT_FOUND" };
    }

    const shouldRelease = Boolean(campaign.pixKey && campaign.pixType) && this.isTriggerReached(
      campaign.status,
      campaign.paymentReleaseTrigger,
      campaign.shippingCost
    );

    if (campaign.paymentReleased && !shouldRelease) {
      await prisma.campaign.updateMany({
        where: {
          id: campaign.id,
          paymentReleased: true,
        },
        data: {
          paymentReleased: false,
          paymentReleasedAt: null,
        },
      });

      return {
        released: false,
        notificationsSent: 0,
        reason: campaign.pixKey && campaign.pixType ? "TRIGGER_NOT_REACHED" : "PIX_NOT_CONFIGURED",
      };
    }

    if (!campaign.pixKey || !campaign.pixType) {
      return { released: false, notificationsSent: 0, reason: "PIX_NOT_CONFIGURED" };
    }

    const buyerIds = Array.from(
      new Set(
        campaign.orders
          .filter((order) => !order.isPaid)
          .map((order) => order.userId)
      )
    );

    if (campaign.paymentReleased) {
      const notificationsSent = await this.notifyUnpaidBuyersOnce(
        {
          id: campaign.id,
          slug: campaign.slug,
          name: campaign.name,
          pixKey: campaign.pixKey,
          pixType: campaign.pixType,
          pixName: campaign.pixName,
        },
        buyerIds
      );

      return { released: false, notificationsSent, reason: "ALREADY_RELEASED" };
    }

    if (!shouldRelease) {
      return { released: false, notificationsSent: 0, reason: "TRIGGER_NOT_REACHED" };
    }

    const now = new Date();
    const updateResult = await prisma.campaign.updateMany({
      where: {
        id: campaign.id,
        paymentReleased: false,
      },
      data: {
        paymentReleased: true,
        paymentReleasedAt: now,
      },
    });

    if (updateResult.count === 0) {
      return { released: false, notificationsSent: 0, reason: "ALREADY_RELEASED_CONCURRENT" };
    }

    const notificationsSent = await this.notifyUnpaidBuyersOnce(
      {
        id: campaign.id,
        slug: campaign.slug,
        name: campaign.name,
        pixKey: campaign.pixKey,
        pixType: campaign.pixType,
        pixName: campaign.pixName,
      },
      buyerIds
    );

    console.log(
      `[PaymentReleaseService] Payment released for campaign ${campaign.id} ` +
        `(trigger=${campaign.paymentReleaseTrigger}, notified=${notificationsSent})`
    );

    return {
      released: true,
      notificationsSent,
    };
  }
}
