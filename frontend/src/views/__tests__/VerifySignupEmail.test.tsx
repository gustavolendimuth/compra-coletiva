import { describe, it, expect, vi, beforeEach } from "vitest";
import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { authStorage } from "@/lib/authStorage";

const { mockReplace, mockPush, mockVerifyEmail, search } = vi.hoisted(() => ({
  mockReplace: vi.fn(),
  mockPush: vi.fn(),
  mockVerifyEmail: vi.fn(),
  search: { value: "token=abc" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => new URLSearchParams(search.value),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ verifyEmail: mockVerifyEmail }),
}));

import { VerifySignupEmail } from "../VerifySignupEmail";

const invalidToken = () =>
  new AxiosError("Request failed", "400", undefined, undefined, {
    status: 400,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { error: "INVALID_TOKEN", message: "Link de confirmação inválido ou expirado" },
  });

describe("VerifySignupEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    search.value = "token=abc";
    authStorage.clearReturnUrl();
  });

  it("confirma o token uma única vez (StrictMode) e volta para o returnUrl", async () => {
    mockVerifyEmail.mockResolvedValue(false);
    authStorage.setReturnUrl("/campanhas/minha");

    render(
      <StrictMode>
        <VerifySignupEmail />
      </StrictMode>
    );

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/campanhas/minha"));
    expect(mockVerifyEmail).toHaveBeenCalledTimes(1);
    expect(mockVerifyEmail).toHaveBeenCalledWith("abc");
    expect(authStorage.getReturnUrl()).toBeNull();
  });

  it("sem returnUrl vai para /campanhas; returnUrl para fora do site é ignorado", async () => {
    mockVerifyEmail.mockResolvedValue(false);
    authStorage.setReturnUrl("//evil.com");

    render(<VerifySignupEmail />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/campanhas"));
  });

  it("quando já redirecionou para completar o perfil, não navega de novo", async () => {
    mockVerifyEmail.mockResolvedValue(true);

    render(<VerifySignupEmail />);

    await waitFor(() => expect(screen.getByText(/email confirmado/i)).toBeInTheDocument());
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("link inválido ou expirado mostra a mensagem do backend e o caminho para o login", async () => {
    mockVerifyEmail.mockRejectedValue(invalidToken());

    render(<VerifySignupEmail />);

    expect(await screen.findByText("Link de confirmação inválido ou expirado")).toBeInTheDocument();
    screen.getByRole("button", { name: /ir para o login/i }).click();
    expect(mockPush).toHaveBeenCalledWith("/campanhas?requireLogin=true");
  });

  it("sem token na URL não chama o backend", async () => {
    search.value = "";

    render(<VerifySignupEmail />);

    expect(await screen.findByTestId("verify-email-error")).toBeInTheDocument();
    expect(mockVerifyEmail).not.toHaveBeenCalled();
  });
});
