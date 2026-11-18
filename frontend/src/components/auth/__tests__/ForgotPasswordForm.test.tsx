import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";

const { mockRequestReset } = vi.hoisted(() => ({ mockRequestReset: vi.fn() }));

vi.mock("../../../lib/authApi", () => ({
  authApi: { requestPasswordReset: (...args: unknown[]) => mockRequestReset(...args) },
}));

import { ForgotPasswordForm } from "../ForgotPasswordForm";

const UNIFORM_MESSAGE =
  "Se o email existir em nossa base, você receberá instruções para resetar sua senha";

const apiError = (status: number, data: Record<string, unknown>) =>
  new AxiosError("Request failed", String(status), undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

const typeEmail = async (value: string) => {
  const input = screen.getByLabelText("Email");
  await userEvent.clear(input);
  if (value) await userEvent.type(input, value);
};

const submit = () => userEvent.click(screen.getByRole("button", { name: "Enviar link" }));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("começa com o email recebido do login", () => {
    render(<ForgotPasswordForm initialEmail="maria@test.com" onBackToLogin={vi.fn()} />);

    expect(screen.getByLabelText("Email")).toHaveValue("maria@test.com");
  });

  it("envia o email sem espaços uma vez e mostra só a mensagem do backend", async () => {
    // Texto que o componente não conhece: prova que vem da resposta
    const SERVER_MESSAGE = "Mensagem vinda do servidor 7f3a";
    mockRequestReset.mockResolvedValue({ message: SERVER_MESSAGE });
    render(<ForgotPasswordForm onBackToLogin={vi.fn()} />);

    await typeEmail(" maria@test.com ");
    await submit();

    expect(mockRequestReset).toHaveBeenCalledTimes(1);
    expect(mockRequestReset).toHaveBeenCalledWith("maria@test.com");
    expect(await screen.findByText(SERVER_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  // "maria@test.c", "a..b@test.com" e "maria@test.com." o zod do backend recusa (viraria 500)
  it.each(["", "maria", "maria@test", "maria@test.c", "a..b@test.com", "maria@test.com."])("email inválido %j mostra o erro e não chama o backend", async (value) => {
    render(<ForgotPasswordForm onBackToLogin={vi.fn()} />);

    await typeEmail(value);
    await submit();

    expect(screen.getByText("Informe um email válido")).toBeInTheDocument();
    expect(mockRequestReset).not.toHaveBeenCalled();
  });

  it("aceita email com + e domínio de vários níveis (formato do backend)", async () => {
    mockRequestReset.mockResolvedValue({ message: UNIFORM_MESSAGE });
    render(<ForgotPasswordForm onBackToLogin={vi.fn()} />);

    await typeEmail("a+b@x.co.uk");
    await submit();

    expect(mockRequestReset).toHaveBeenCalledWith("a+b@x.co.uk");
  });

  it.each([
    [400, { error: "NO_PASSWORD", message: "Mensagem 400 do servidor 91c2" }],
    [429, { status: "error", message: "Mensagem 429 do servidor 5d0e" }],
  ])("erro %i mostra a mensagem do backend e deixa tentar de novo", async (status, data) => {
    mockRequestReset.mockRejectedValueOnce(apiError(status, data)).mockResolvedValueOnce({ message: UNIFORM_MESSAGE });
    render(<ForgotPasswordForm initialEmail="maria@test.com" onBackToLogin={vi.fn()} />);

    await submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(data.message as string);
    expect(screen.getByLabelText("Email")).toBeEnabled();

    await submit();
    expect(await screen.findByText(UNIFORM_MESSAGE)).toBeInTheDocument();
    expect(mockRequestReset).toHaveBeenCalledTimes(2);
  });

  it("falha sem mensagem do backend mostra o texto padrão", async () => {
    mockRequestReset.mockRejectedValue(new AxiosError("Network Error", "ERR_NETWORK"));
    render(<ForgotPasswordForm initialEmail="maria@test.com" onBackToLogin={vi.fn()} />);

    await submit();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível enviar o link. Tente novamente."
    );
  });

  it("durante o envio desabilita o botão com 'Enviando...'", async () => {
    let resolve: (value: { message: string }) => void = () => {};
    mockRequestReset.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<ForgotPasswordForm initialEmail="maria@test.com" onBackToLogin={vi.fn()} />);

    await submit();

    expect(screen.getByRole("button", { name: "Enviando..." })).toBeDisabled();
    resolve({ message: UNIFORM_MESSAGE });
    expect(await screen.findByText(UNIFORM_MESSAGE)).toBeInTheDocument();
  });

  it("'Voltar para o login' chama o callback, no formulário e depois do envio", async () => {
    mockRequestReset.mockResolvedValue({ message: UNIFORM_MESSAGE });
    const onBack = vi.fn();
    render(<ForgotPasswordForm initialEmail="maria@test.com" onBackToLogin={onBack} />);

    await userEvent.click(screen.getByRole("button", { name: "Voltar para o login" }));
    await submit();
    await screen.findByText(UNIFORM_MESSAGE);
    await userEvent.click(screen.getByRole("button", { name: "Voltar para o login" }));

    expect(onBack).toHaveBeenCalledTimes(2);
  });
});
