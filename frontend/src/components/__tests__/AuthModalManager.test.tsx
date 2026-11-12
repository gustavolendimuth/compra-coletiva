import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div role="dialog">{children}</div> : null,
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
  LoginForm: ({ onSubmit }: { onSubmit: (email: string, password: string) => Promise<void> }) => (
    <button onClick={() => onSubmit("b@example.com", "secret")}>Entrar</button>
  ),
}));

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

  it("depois do cadastro pelo modal leva para o redirectTo", async () => {
    visit("/campanhas?requireLogin=true&redirectTo=%2Fperfil");
    render(<AuthModalManager />);

    await userEvent.click(await screen.findByRole("button", { name: "Criar Conta" }));
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/perfil"));
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

  it("sem requireLogin o modal fica fechado", () => {
    visit("/campanhas");
    render(<AuthModalManager />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
