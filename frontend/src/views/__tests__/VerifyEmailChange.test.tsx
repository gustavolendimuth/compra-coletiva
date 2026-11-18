import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const { mockPost, mockRefreshUser, search } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockRefreshUser: vi.fn(),
  search: { value: "token=abc" },
}));

// Só o cliente HTTP é falso: o profileService real monta a chamada e desembrulha a resposta
vi.mock("@/api/client", () => ({
  apiClient: { post: (...args: unknown[]) => mockPost(...args) },
  authClient: {},
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  // Rota sem segmento dinâmico: o token só existe na query
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(search.value),
}));
// Como o AuthContext real, refreshUser é uma função nova a cada render
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ refreshUser: () => mockRefreshUser() }),
}));

import { VerifyEmailChange } from "../VerifyEmailChange";

describe("VerifyEmailChange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search.value = "token=abc";
    mockPost.mockReturnValue(new Promise(() => {}));
  });

  it("lê o token de ?token= e confirma a troca com ele", async () => {
    render(<VerifyEmailChange />);

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("/profile/verify-email", { token: "abc" }));
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("sem token na URL mostra erro e não chama a API", async () => {
    search.value = "";

    render(<VerifyEmailChange />);

    expect(await screen.findByText("Token de verificação ausente")).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  // Regressão: a tela lia response.data.email, mas o backend responde { message, newEmail }
  it("troca confirmada pelo backend mostra sucesso com o novo email e atualiza o usuário", async () => {
    mockPost.mockResolvedValue({
      data: { message: "Email atualizado com sucesso", newEmail: "novo@test.com" },
    });

    render(<VerifyEmailChange />);

    expect(await screen.findByText("Email Verificado!")).toBeInTheDocument();
    expect(screen.getByText("novo@test.com")).toBeInTheDocument();
    expect(mockRefreshUser).toHaveBeenCalled();
    // Re-renders depois do sucesso não confirmam de novo (o link é de uso único)
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it("link inválido ou expirado mostra a tela de link expirado com o pedido de nova troca", async () => {
    mockPost.mockRejectedValue(
      Object.assign(new Error("Request failed"), {
        isAxiosError: true,
        response: { status: 400, data: { error: "INVALID_TOKEN", message: "Link de confirmação inválido ou expirado." } },
      })
    );

    render(<VerifyEmailChange />);

    expect(await screen.findByText("Link Inválido ou Expirado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Solicitar Novamente" })).toBeInTheDocument();
  });
});
