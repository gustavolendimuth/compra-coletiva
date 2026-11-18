import type { Job } from "bullmq";
import type { EmailJobData } from "../emailQueue";

const mockPrisma = {
  user: { findUnique: jest.fn() },
  emailPreference: { findUnique: jest.fn(), create: jest.fn() },
};
jest.mock("../../../index", () => ({ prisma: mockPrisma }));

// O worker não exporta o processador: captura o que ele entrega ao BullMQ
let mockProcessor: ((job: Job<EmailJobData>) => Promise<void>) | undefined;
jest.mock("bullmq", () => ({
  Worker: jest.fn((_name: string, processor: (job: Job<EmailJobData>) => Promise<void>) => {
    mockProcessor = processor;
    return { on: jest.fn(), close: jest.fn() };
  }),
}));

jest.mock("../../../config/email", () => ({
  getEmailConfig: () => ({
    enabled: true,
    frontendUrl: "https://front.test",
    redis: { url: "redis://localhost:6379" },
    queue: { rateLimit: 100 },
  }),
}));

const mockSend = jest.fn();
jest.mock("../emailService", () => ({
  EmailService: { send: (...args: unknown[]) => mockSend(...args) },
}));

// O render do React Email usa import() dinâmico, que o Jest em CommonJS não executa:
// renderiza a mesma árvore com o react-dom/server síncrono
jest.mock("@react-email/components", () => {
  const actual = jest.requireActual("@react-email/components");
  const { renderToStaticMarkup } = jest.requireActual("react-dom/server");
  return { ...actual, render: async (node: unknown) => renderToStaticMarkup(node) };
});

import { startEmailWorker } from "../emailWorker";

startEmailWorker();

const runJob = (data: EmailJobData) => mockProcessor!({ id: "job-1", data } as Job<EmailJobData>);

const sentEmail = () => mockSend.mock.calls[0][0] as { to: string; subject: string; html: string; templateName: string };

beforeEach(() => {
  mockSend.mockResolvedValue({ success: true });
  // Usuário com todos os emails desligados nas preferências
  mockPrisma.emailPreference.findUnique.mockResolvedValue({ userId: "user-1", emailEnabled: false });
});

describe("emailWorker: emails de confirmação", () => {
  it("troca de email: busca o nome no banco, usa o template da troca e envia para o novo email", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ name: "Maria Silva" });

    await runJob({
      type: "email-verification",
      userId: "user-1",
      userName: "",
      userEmail: "novo@test.com",
      newEmail: "novo@test.com",
      verificationToken: "tok-troca",
    });

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { name: true },
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
    const email = sentEmail();
    expect(email.to).toBe("novo@test.com");
    expect(email.templateName).toBe("email-change-verification");
    expect(email.html).toContain("Maria Silva");
    expect(email.html).toContain("https://front.test/perfil/verificar-email?token=tok-troca");
  });

  it("cadastro: usa o template do cadastro com o nome do job e envia para o email do cadastro", async () => {
    await runJob({
      type: "signup-verification",
      userId: "user-1",
      userName: "João Souza",
      userEmail: "joao@test.com",
      verificationToken: "tok-cadastro",
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const email = sentEmail();
    expect(email.to).toBe("joao@test.com");
    expect(email.templateName).toBe("signup-verification");
    expect(email.html).toContain("João Souza");
    expect(email.html).toContain("https://front.test/verify-email?token=tok-cadastro");
  });
});

describe("emailWorker: preferências de email", () => {
  it.each([
    { type: "password-reset" as const, extra: { resetToken: "tok" } },
    { type: "email-verification" as const, extra: { verificationToken: "tok" } },
    { type: "signup-verification" as const, extra: { verificationToken: "tok" } },
  ])("$type é transacional: sai mesmo com os emails desligados", async ({ type, extra }) => {
    mockPrisma.user.findUnique.mockResolvedValue({ name: "Maria Silva" });

    await runJob({ type, userId: "user-1", userName: "Maria Silva", userEmail: "maria@test.com", ...extra });

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("tipo não transacional respeita os emails desligados", async () => {
    await runJob({ type: "welcome", userId: "user-1", userName: "Maria Silva", userEmail: "maria@test.com" });

    expect(mockPrisma.emailPreference.findUnique).toHaveBeenCalledWith({ where: { userId: "user-1" } });
    expect(mockSend).not.toHaveBeenCalled();
  });
});
