jest.mock("../../../index", () => ({
  prisma: {
    emailLog: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: "log-1" }),
      update: jest.fn().mockResolvedValue({}),
    },
  },
}));

const mockSendMail = jest.fn();
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail, verify: jest.fn() })),
}));

const mockResendSend = jest.fn();
jest.mock("resend", () => ({
  Resend: jest.fn(() => ({ emails: { send: mockResendSend } })),
}));

jest.mock("../../../config/email", () => ({
  getEmailConfig: () => ({
    enabled: true,
    provider: "resend",
    frontendUrl: "http://localhost:5173",
    resend: { apiKey: "re_test", fromEmail: "noreply@app.test", fromName: "App" },
    gmail: { user: "sender@gmail.test", appPassword: "pw", fromName: "App" },
  }),
}));

import { EmailService } from "../emailService";
import { GmailProvider } from "../providers/gmailProvider";
import { ResendProvider } from "../providers/resendProvider";
import { captureConsole } from "../../../__tests__/captureConsole";

const RECIPIENT = "comprador.sigiloso@example.com";

describe("email sending logs", () => {
  let logs: ReturnType<typeof captureConsole>;

  beforeEach(() => {
    logs = captureConsole();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const params = { to: RECIPIENT, subject: "Pedido criado", html: "<p>ok</p>", templateName: "order-created" };

  it.each([
    ["success", () => Promise.resolve({ success: true, provider: "resend", messageId: "m-1" })],
    ["provider failure quoting the address", () => Promise.resolve({ success: false, provider: "resend", error: `rejected ${RECIPIENT}` })],
    ["exception quoting the address", () => Promise.reject(new Error(`SMTP 550 mailbox ${RECIPIENT} unavailable`))],
  ])("no recipient in logs: EmailService.send %s", async (_outcome, send) => {
    jest.spyOn(EmailService as unknown as { getProvider: () => unknown }, "getProvider").mockReturnValue({ send });

    await EmailService.send(params);

    expect(logs.text()).not.toContain(RECIPIENT);
  });

  it("no recipient in logs: Gmail provider error quoting the address", async () => {
    const error = Object.assign(new Error(`Can't send mail - all recipients were rejected: 550 ${RECIPIENT}`), {
      rejected: [RECIPIENT],
      response: `550 5.1.1 <${RECIPIENT}> user unknown`,
    });
    mockSendMail.mockRejectedValue(error);

    const provider = new GmailProvider();
    const result = await provider.send(params);

    expect(result.success).toBe(false);
    expect(logs.text()).not.toContain(RECIPIENT);
  });

  it("no recipient in logs: Resend provider API error and exception quoting the address", async () => {
    const provider = new ResendProvider();

    mockResendSend.mockResolvedValueOnce({ data: null, error: { name: "validation_error", message: `Invalid to: ${RECIPIENT}` } });
    await provider.send(params);

    mockResendSend.mockRejectedValueOnce(new Error(`network error sending to ${RECIPIENT}`));
    await provider.send(params);

    expect(mockResendSend).toHaveBeenCalledTimes(2);
    expect(logs.text()).not.toContain(RECIPIENT);
  });
});
