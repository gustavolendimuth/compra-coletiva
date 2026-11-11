import { EmailService } from "./emailService";
import { prisma } from "../../index";

jest.mock("../../index", () => ({
  prisma: {
    emailLog: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as unknown as {
  emailLog: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

describe("EmailService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should skip duplicate send when email was already sent for the same notification", async () => {
    mockPrisma.emailLog.findFirst.mockResolvedValueOnce({
      id: "log-sent",
      provider: "resend",
      providerId: "msg-1",
    });

    const getProviderSpy = jest.spyOn(EmailService as any, "getProvider");

    const result = await EmailService.send({
      to: "buyer@example.com",
      subject: "Pagamento liberado",
      html: "<p>ok</p>",
      notificationId: "notif-1",
      templateName: "payment-released",
    });

    expect(result).toEqual({
      success: true,
      provider: "resend",
      messageId: "msg-1",
    });
    expect(mockPrisma.emailLog.create).not.toHaveBeenCalled();
    expect(getProviderSpy).not.toHaveBeenCalled();

    getProviderSpy.mockRestore();
  });

  it("should reuse existing pending log instead of creating a new one on retry", async () => {
    mockPrisma.emailLog.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "log-pending" });
    mockPrisma.emailLog.update
      .mockResolvedValueOnce({ id: "log-pending" })
      .mockResolvedValueOnce({});

    const provider = {
      send: jest.fn().mockResolvedValue({
        success: true,
        provider: "resend",
        messageId: "msg-2",
      }),
    };
    const getProviderSpy = jest
      .spyOn(EmailService as any, "getProvider")
      .mockReturnValue(provider);

    const result = await EmailService.send({
      to: "buyer@example.com",
      subject: "Pagamento liberado",
      html: "<p>ok</p>",
      notificationId: "notif-2",
      templateName: "payment-released",
      userId: "user-1",
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.emailLog.create).not.toHaveBeenCalled();
    expect(provider.send).toHaveBeenCalledTimes(1);
    expect(mockPrisma.emailLog.update).toHaveBeenCalled();

    getProviderSpy.mockRestore();
  });
});
