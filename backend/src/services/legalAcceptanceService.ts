import { LegalDocumentType, Prisma, User } from "@prisma/client";
import { Request } from "express";
import { prisma } from "../index";

interface RecordLegalAcceptanceInput {
  userId: string;
  documentType: LegalDocumentType;
  documentVersion: string;
  context?: string;
  req?: Request;
  tx?: Prisma.TransactionClient;
}

export class LegalAcceptanceService {
  static getClientIp(req?: Request): string | undefined {
    if (!req) return undefined;
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
      return forwarded.split(",")[0].trim();
    }
    return req.socket.remoteAddress || undefined;
  }

  static async recordAcceptance({
    userId,
    documentType,
    documentVersion,
    context,
    req,
    tx,
  }: RecordLegalAcceptanceInput) {
    const db = tx || prisma;

    return db.legalAcceptanceLog.create({
      data: {
        userId,
        documentType,
        documentVersion,
        context,
        ipAddress: this.getClientIp(req),
        userAgent: req?.headers["user-agent"],
      },
    });
  }

  static buildLegalUserPatch(
    documentType: LegalDocumentType,
    version: string,
    acceptedAt: Date = new Date()
  ): Prisma.UserUpdateInput {
    switch (documentType) {
      case "TERMS":
        return {
          termsAcceptedAt: acceptedAt,
          termsAcceptedVersion: version,
        };
      case "PRIVACY":
        return {
          privacyAcceptedAt: acceptedAt,
          privacyAcceptedVersion: version,
        };
      case "SALES_DISCLAIMER":
        return {
          salesDisclaimerAcceptedAt: acceptedAt,
          salesDisclaimerAcceptedVersion: version,
        };
      default:
        return {};
    }
  }

  static hasAcceptedCurrentSalesDisclaimer(
    user: Pick<User, "salesDisclaimerAcceptedVersion">,
    currentVersion: string
  ): boolean {
    return user.salesDisclaimerAcceptedVersion === currentVersion;
  }
}
