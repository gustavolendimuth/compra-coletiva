jest.mock("../../../config/email", () => ({
  getEmailConfig: () => ({ frontendUrl: "https://front.test" }),
}));

// O render do React Email usa import() dinâmico, que o Jest em CommonJS não executa:
// renderiza a mesma árvore com o react-dom/server síncrono
jest.mock("@react-email/components", () => {
  const actual = jest.requireActual("@react-email/components");
  const { renderToStaticMarkup } = jest.requireActual("react-dom/server");
  return { ...actual, render: async (node: unknown) => renderToStaticMarkup(node) };
});

import { renderSignupVerificationEmail, renderEmailChangeVerificationEmail } from "../templates";

describe("templates de confirmação de email", () => {
  it("cadastro: link para /verify-email com o token, assunto e textos do cadastro", async () => {
    const email = await renderSignupVerificationEmail("Maria Silva", "user-1", "tok-123");

    expect(email.subject).toBe("✉️ Confirme seu email");
    expect(email.templateName).toBe("signup-verification");
    expect(email.html).toContain('href="https://front.test/verify-email?token=tok-123"');
    expect(email.html).not.toContain("/perfil/verificar-email");
    expect(email.html).toContain("Maria Silva");
    expect(email.html).toContain("Confirmar email");
    expect(email.html).toContain("24 horas");
  });

  it("troca de email: link para /perfil/verificar-email com o token, assunto e textos da troca", async () => {
    const email = await renderEmailChangeVerificationEmail("Maria Silva", "user-1", "tok-456");

    expect(email.subject).toBe("✉️ Confirme seu novo email");
    expect(email.templateName).toBe("email-change-verification");
    expect(email.html).toContain('href="https://front.test/perfil/verificar-email?token=tok-456"');
    expect(email.html).toContain("Maria Silva");
    expect(email.html).toContain("Confirmar novo email");
    expect(email.html).toContain("24 horas");
  });
});
