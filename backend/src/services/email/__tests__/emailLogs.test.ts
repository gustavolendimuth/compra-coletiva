import { inspect } from "util";

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

const RECIPIENT = "comprador.sigiloso@example.com";

const methods = ["log", "info", "warn", "error", "debug"] as const;

describe("email sending logs", () => {
  let spies: jest.SpyInstance[];
  const logText = () =>
    spies
      .flatMap((spy) => spy.mock.calls)
      .map((args) => args.map((arg: unknown) => (typeof arg === "string" ? arg : inspect(arg, { depth: 10 }))).join(" "))
      .join("\n");

  beforeEach(() => {
    spies = methods.map((method) => jest.spyOn(console, method).mockImplementation(() => undefined));
  });

  afterEach(() => {
    spies.forEach((spy) => spy.mockRestore());
    jest.restoreAllMocks();
  });

  const params = { to: RECIPIENT, subject: "Pedido criado", html: "<p>ok</p>", templateName: "order-created" };

  it("no recipient in logs: EmailService.send success", async () => {
    jest.spyOn(EmailService as any, "getProvider").mockReturnValue({
      send: jest.fn().mockResolvedValue({ success: true, provider: "resend", messageId: "m-1" }),
    });

    const result = await EmailService.send(params);

    expect(result.success).toBe(true);
    expect(logText()).not.toContain(RECIPIENT);
  });

  it("no recipient in logs: EmailService.send provider failure quoting the address", async () => {
    jest.spyOn(EmailService as any, "getProvider").mockReturnValue({
      send: jest.fn().mockResolvedValue({ success: false, provider: "resend", error: `rejected ${RECIPIENT}` }),
    });

    await EmailService.send(params);

    expect(logText()).not.toContain(RECIPIENT);
  });

  it("no recipient in logs: EmailService.send exception quoting the address", async () => {
    jest.spyOn(EmailService as any, "getProvider").mockReturnValue({
      send: jest.fn().mockRejectedValue(new Error(`SMTP 550 mailbox ${RECIPIENT} unavailable`)),
    });

    await EmailService.send(params);

    expect(logText()).not.toContain(RECIPIENT);
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
    expect(logText()).not.toContain(RECIPIENT);
  });

  it("no recipient in logs: Resend provider API error and exception quoting the address", async () => {
    const provider = new ResendProvider();

    mockResendSend.mockResolvedValueOnce({ data: null, error: { name: "validation_error", message: `Invalid to: ${RECIPIENT}` } });
    await provider.send(params);

    mockResendSend.mockRejectedValueOnce(new Error(`network error sending to ${RECIPIENT}`));
    await provider.send(params);

    expect(mockResendSend).toHaveBeenCalledTimes(2);
    expect(logText()).not.toContain(RECIPIENT);
  });
});
