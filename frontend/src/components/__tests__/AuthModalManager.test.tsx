import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthModalManager } from "../AuthModal";
import { authStorage } from "@/lib/authStorage";

const { mockReplace, mockPush, mockLogin, router } = vi.hoisted(() => {
  const mockReplace = vi.fn();
  const mockPush = vi.fn();
  // Como no Next: o router é o mesmo objeto entre renders
  const router = { replace: mockReplace, push: mockPush };
  return { mockReplace, mockPush, mockLogin: vi.fn(), router };
});

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/campanhas",
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin, register: vi.fn(), hasPendingAction: () => false }),
}));

vi.mock("../ui", () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div role="dialog">{children}</div> : null,
}));

vi.mock("../auth", () => ({
  AuthTabs: () => null,
  RegisterForm: () => null,
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

  // O proxy manda para ?requireLogin=true&redirectTo=/perfil, mas nada abria o login
  it("?requireLogin=true abre o modal de login e limpa os parâmetros da URL", async () => {
    visit("/campanhas?requireLogin=true&redirectTo=%2Fperfil");
    render(<AuthModalManager />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(mockReplace).toHaveBeenCalledWith("/campanhas");
  });

  it("mantém os outros parâmetros ao limpar a URL", async () => {
    visit("/campanhas?requireLogin=true&redirectTo=%2Fperfil&status=ACTIVE");
    render(<AuthModalManager />);

    await screen.findByRole("dialog");
    expect(mockReplace).toHaveBeenCalledWith("/campanhas?status=ACTIVE");
  });

  it("depois do login leva para o redirectTo", async () => {
    visit("/campanhas?requireLogin=true&redirectTo=%2Fperfil");
    render(<AuthModalManager />);

    await userEvent.click(await screen.findByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/perfil"));
    expect(authStorage.getReturnUrl()).toBeNull();
  });

  it("guarda o redirectTo como returnUrl para o login com Google e o cadastro", async () => {
    visit("/campanhas?requireLogin=true&redirectTo=%2Fadmin");
    render(<AuthModalManager />);

    await screen.findByRole("dialog");
    expect(authStorage.getReturnUrl()).toBe("/admin");
  });

  it.each(["//evil.com", "https://evil.com", "/\\evil.com"])(
    "ignora redirectTo para fora do site (%s)",
    async (redirectTo) => {
      visit(`/campanhas?requireLogin=true&redirectTo=${encodeURIComponent(redirectTo)}`);
      render(<AuthModalManager />);

      await userEvent.click(await screen.findByRole("button", { name: "Entrar" }));

      await waitFor(() => expect(mockLogin).toHaveBeenCalled());
      expect(mockPush).not.toHaveBeenCalled();
      expect(authStorage.getReturnUrl()).toBeNull();
    }
  );

  it("sem requireLogin o modal fica fechado", () => {
    visit("/campanhas");
    render(<AuthModalManager />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
