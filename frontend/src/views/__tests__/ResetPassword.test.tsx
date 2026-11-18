import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";

const { mockPush, mockResetPassword, mockRequestReset, search } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockResetPassword: vi.fn(),
  mockRequestReset: vi.fn(),
  search: { value: "token=abc123" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search.value),
}));
vi.mock("@/lib/authApi", () => ({
  authApi: {
    resetPassword: (...args: unknown[]) => mockResetPassword(...args),
    requestPasswordReset: (...args: unknown[]) => mockRequestReset(...args),
  },
}));

import { ResetPassword } from "../ResetPassword";

const apiError = (status: number, data: Record<string, unknown>) =>
  new AxiosError("Request failed", String(status), undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

const fill = async (password: string, confirm = password) => {
  await userEvent.type(screen.getByLabelText("Nova senha"), password);
  await userEvent.type(screen.getByLabelText("Confirmar nova senha"), confirm);
};

const submit = () => userEvent.click(screen.getByRole("button", { name: "Redefinir senha" }));

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search.value = "token=abc123";
  });

  it("com token mostra nova senha, confirmação, as regras e o botão", () => {
    render(<ResetPassword />);

    expect(screen.getByLabelText("Nova senha")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Confirmar nova senha")).toHaveAttribute("type", "password");
    expect(
      screen.getByText("Use pelo menos 6 caracteres, com uma letra maiúscula, uma minúscula e um número.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Redefinir senha" })).toBeEnabled();
  });

  it.each([
    ["Abcd1", "A senha deve ter pelo menos 6 caracteres"],
    ["abcde1", "A senha deve conter pelo menos uma letra maiúscula"],
    ["ABCDE1", "A senha deve conter pelo menos uma letra minúscula"],
    ["Abcdef", "A senha deve conter pelo menos um número"],
  ])("senha %j mostra a regra quebrada e não chama o backend", async (password, rule) => {
    render(<ResetPassword />);

    await fill(password);
    await submit();

    expect(screen.getByText(rule)).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("senha sem nada mostra todas as regras quebradas", async () => {
    render(<ResetPassword />);

    await submit();

    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "A senha deve ter pelo menos 6 caracteres",
      "A senha deve conter pelo menos uma letra maiúscula",
      "A senha deve conter pelo menos uma letra minúscula",
      "A senha deve conter pelo menos um número",
    ]);
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("confirmação diferente mostra 'As senhas não coincidem' e não chama o backend", async () => {
    render(<ResetPassword />);

    await fill("Abcde1", "Abcde2");
    await submit();

    expect(screen.getByText("As senhas não coincidem")).toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("senha de 6 caracteres válida e confirmada redefine uma vez e leva ao login", async () => {
    mockResetPassword.mockResolvedValue({ message: "Senha alterada com sucesso" });
    render(<ResetPassword />);

    await fill("Abcde1");
    await submit();

    expect(await screen.findByText("Senha alterada")).toBeInTheDocument();
    expect(mockResetPassword).toHaveBeenCalledTimes(1);
    expect(mockResetPassword).toHaveBeenCalledWith("abc123", "Abcde1");

    await userEvent.click(screen.getByRole("button", { name: "Ir para o login" }));
    expect(mockPush).toHaveBeenCalledWith("/campanhas?requireLogin=true");
  });

  it.each([
    // Textos que o componente não conhece: provam que vêm da resposta
    ["INVALID_TOKEN", "Servidor: link inválido 1a"],
    ["TOKEN_EXPIRED", "Servidor: link expirado 2b"],
    ["TOKEN_ALREADY_USED", "Servidor: link já usado 3c"],
  ])("%s mostra a mensagem do backend e o pedido de novo link", async (error, message) => {
    mockResetPassword.mockRejectedValue(apiError(400, { error, message }));
    mockRequestReset.mockResolvedValue({ message: "Se o email existir em nossa base, você receberá instruções para resetar sua senha" });
    render(<ResetPassword />);

    await fill("Abcde1");
    await submit();

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Email"), "maria@test.com");
    await userEvent.click(screen.getByRole("button", { name: "Enviar link" }));
    expect(mockRequestReset).toHaveBeenCalledWith("maria@test.com");
    expect(
      await screen.findByText("Se o email existir em nossa base, você receberá instruções para resetar sua senha")
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ir para o login" }));
    expect(mockPush).toHaveBeenCalledWith("/campanhas?requireLogin=true");
  });

  it("sem token na URL mostra 'Link de redefinição incompleto.' e o pedido de novo link, sem chamar o backend", () => {
    search.value = "";
    render(<ResetPassword />);

    expect(screen.getByText("Link de redefinição incompleto.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar link" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it("WEAK_PASSWORD mantém o formulário e mostra a mensagem e cada detalhe", async () => {
    mockResetPassword.mockRejectedValue(
      apiError(400, {
        error: "WEAK_PASSWORD",
        message: "Servidor: senha fraca 4d",
        details: ["Servidor: detalhe 5e"],
      })
    );
    render(<ResetPassword />);

    await fill("Abcde1");
    await submit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Servidor: senha fraca 4d");
    expect(alert).toHaveTextContent("Servidor: detalhe 5e");
    expect(screen.getByLabelText("Nova senha")).toBeInTheDocument();
  });

  it.each([
    ["500 com mensagem", apiError(500, { error: "INTERNAL_ERROR", message: "Servidor: erro 6f" }), "Servidor: erro 6f"],
    ["falha de rede", new AxiosError("Network Error", "ERR_NETWORK"), "Não foi possível redefinir a senha. Tente novamente."],
  ])("%s mantém o formulário e mostra o erro", async (_label, error, text) => {
    mockResetPassword.mockRejectedValue(error);
    render(<ResetPassword />);

    await fill("Abcde1");
    await submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(text);
    expect(screen.getByLabelText("Nova senha")).toBeEnabled();
    expect(screen.getByRole("button", { name: "Redefinir senha" })).toBeEnabled();
  });

  it("durante a redefinição desabilita o botão com 'Salvando...'", async () => {
    let resolve: (value: { message: string }) => void = () => {};
    mockResetPassword.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<ResetPassword />);

    await fill("Abcde1");
    await submit();

    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
    resolve({ message: "Senha alterada com sucesso" });
    expect(await screen.findByText("Senha alterada")).toBeInTheDocument();
  });
});
