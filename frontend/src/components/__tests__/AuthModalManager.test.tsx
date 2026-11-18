import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { AuthModalManager } from "../AuthModal";
import { authStorage } from "@/lib/authStorage";

const { mockReplace, mockPush, mockLogin, mockRegister, router } = vi.hoisted(() => {
  const mockReplace = vi.fn();
  const mockPush = vi.fn();
  // Como no Next: o router é o mesmo objeto entre renders
  const router = { replace: mockReplace, push: mockPush };
  return { mockReplace, mockPush, mockLogin: vi.fn(), mockRegister: vi.fn(), router };
});

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/campanhas",
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin, register: mockRegister, hasPendingAction: () => false }),
}));

vi.mock("../ui", () => ({
  Modal: ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) =>
    isOpen ? (
      <div role="dialog">
        <button onClick={onClose}>Fechar</button>
        {children}
      </div>
    ) : null,
}));

vi.mock("../auth", () => ({
  AuthTabs: ({ onTabChange }: { onTabChange: (tab: "register") => void }) => (
    <button onClick={() => onTabChange("register")}>Criar Conta</button>
  ),
  RegisterForm: ({ onSubmit }: { onSubmit: (...args: unknown[]) => Promise<void> }) => (
    <button onClick={() => onSubmit("B", "b@example.com", "secret", "11999999999", true, true, false)}>
      Cadastrar
    </button>
  ),
  LoginForm: ({
    onSubmit,
    onForgotPassword,
  }: {
    onSubmit: (email: string, password: string) => Promise<void>;
    onForgotPassword?: (email: string) => void;
  }) => (
    <>
      <button onClick={() => onSubmit("b@example.com", "secret")}>Entrar</button>
      <button onClick={() => onForgotPassword?.("b@example.com")}>Esqueci minha senha</button>
    </>
  ),
  EmailVerificationPending: ({ email }: { email: string }) => <p>confirme {email}</p>,
  ForgotPasswordForm: ({ initialEmail, onBackToLogin }: { initialEmail?: string; onBackToLogin: () => void }) => (
    <div>
      <p>recuperar senha de {initialEmail}</p>
      <button onClick={onBackToLogin}>Voltar para o login</button>
    </div>
  ),
}));

// Erro do axios como o backend devolve (código no campo `error`)
const apiError = (status: number, error: string) =>
  new AxiosError("Request failed", String(status), undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: { error, message: "msg" },
  });

const visit = (url: string) => window.history.replaceState({}, "", url);

describe("AuthModalManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    // Como no Next: replace troca a URL atual
    mockReplace.mockImplementation((url: string) => window.history.replaceState({}, "", url));
    authStorage.clearReturnUrl();
  });

  // O proxy manda para ?requireLogin=true&redirectTo=/x, mas nada abria o login
  it.each([
    ["/campanhas?requireLogin=true&redirectTo=%2Fperfil", "/campanhas"],
    ["/campanhas?requireLogin=true&redirectTo=%2Fperfil&status=ACTIVE", "/campanhas?status=ACTIVE"],
  ])("?requireLogin=true abre o login e limpa só os parâmetros dele (%s)", async (url, cleaned) => {
    visit(url);
    render(<AuthModalManager />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith(cleaned);
  });

  it("depois do login leva para o redirectTo", async () => {
    visit("/campanhas?requireLogin=true&redirectTo=%2Fperfil");
    render(<AuthModalManager />);

    await userEvent.click(await screen.findByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/perfil"));
    expect(authStorage.getReturnUrl()).toBeNull();
  });

  // Cadastro não abre sessão: o modal pede a confirmação do email, e o redirectTo
  // fica guardado para depois da confirmação (página /verify-email)
  it("depois do cadastro mostra a confirmação de email e guarda o redirectTo", async () => {
    mockRegister.mockResolvedValue({ message: "ok", email: "b@example.com" });
    visit("/campanhas?requireLogin=true&redirectTo=%2Fperfil");
    render(<AuthModalManager />);

    await userEvent.click(await screen.findByRole("button", { name: "Criar Conta" }));
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("confirme b@example.com")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(authStorage.getReturnUrl()).toBe("/perfil");
  });

  it("login com email não confirmado mostra a confirmação de email no lugar do formulário", async () => {
    mockLogin.mockRejectedValue(apiError(403, "EMAIL_NOT_VERIFIED"));
    visit("/campanhas?requireLogin=true");
    render(<AuthModalManager />);

    await userEvent.click(await screen.findByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("confirme b@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Entrar" })).not.toBeInTheDocument();
  });

  it("login com senha errada continua no formulário", async () => {
    mockLogin.mockRejectedValue(apiError(401, "INVALID_CREDENTIALS"));
    visit("/campanhas?requireLogin=true");
    render(<AuthModalManager />);

    await userEvent.click(await screen.findByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByText(/confirme/)).not.toBeInTheDocument();
  });

  it("login que falha não redireciona", async () => {
    mockLogin.mockRejectedValue(new Error("invalid"));
    visit("/campanhas?requireLogin=true&redirectTo=%2Fperfil");
    render(<AuthModalManager />);

    await userEvent.click(await screen.findByRole("button", { name: "Entrar" }));

    expect(mockLogin).toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("guarda o redirectTo como returnUrl para o login com Google e o cadastro", async () => {
    visit("/campanhas?requireLogin=true&redirectTo=%2Fadmin");
    render(<AuthModalManager />);

    await screen.findByRole("dialog");
    expect(authStorage.getReturnUrl()).toBe("/admin");
  });

  // As outras formas de redirect externo estão em safeRedirectPath.test
  it("ignora redirectTo para fora do site", async () => {
    visit(`/campanhas?requireLogin=true&redirectTo=${encodeURIComponent("//evil.com")}`);
    render(<AuthModalManager />);

    await userEvent.click(await screen.findByRole("button", { name: "Entrar" }));

    // O modal fecha logo antes do onAuthenticated
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(mockPush).not.toHaveBeenCalled();
    expect(authStorage.getReturnUrl()).toBeNull();
  });

  it("'Esqueci minha senha' troca o login pela recuperação com o email digitado", async () => {
    visit("/campanhas?requireLogin=true");
    render(<AuthModalManager />);

    await userEvent.click(await screen.findByRole("button", { name: "Esqueci minha senha" }));

    expect(screen.getByText("recuperar senha de b@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Entrar" })).not.toBeInTheDocument();
  });

  it("'Voltar para o login' sai da recuperação e mostra o login", async () => {
    visit("/campanhas?requireLogin=true");
    render(<AuthModalManager />);

    await userEvent.click(await screen.findByRole("button", { name: "Esqueci minha senha" }));
    await userEvent.click(screen.getByRole("button", { name: "Voltar para o login" }));

    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByText(/recuperar senha/)).not.toBeInTheDocument();
  });

  it("fechar e abrir o modal de novo volta para o login, não para a recuperação", async () => {
    visit("/campanhas?requireLogin=true");
    render(<AuthModalManager />);

    await userEvent.click(await screen.findByRole("button", { name: "Esqueci minha senha" }));
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }));
    });

    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByText(/recuperar senha/)).not.toBeInTheDocument();
  });

  it("sem requireLogin o modal fica fechado", () => {
    visit("/campanhas");
    render(<AuthModalManager />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
