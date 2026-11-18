import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { StoredUser } from "@/api/types";

const { auth } = vi.hoisted(() => ({
  auth: { user: null as StoredUser | null },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: auth.user, refreshUser: vi.fn() }),
}));
vi.mock("@/lib/env", () => ({ API_URL: "http://api.test" }));
vi.mock("@/lib/authApi", () => ({ authApi: { requestPasswordReset: vi.fn() } }));
vi.mock("@/api", () => ({ profileService: { update: vi.fn() } }));
vi.mock("react-hot-toast", () => ({ default: { success: vi.fn(), error: vi.fn() } }));

// Seções fora do assunto viram vazias; as que recebem hasPassword expõem a prop
vi.mock("../profile/ProfileHeader", () => ({ ProfileHeader: () => null }));
vi.mock("../profile/ProfileForm", () => ({ ProfileForm: () => null }));
vi.mock("../profile/EmailPreferencesSection", () => ({ EmailPreferencesSection: () => null }));
vi.mock("@/components/profile/ProfileAddressSection", () => ({ ProfileAddressSection: () => null }));
vi.mock("../profile/EmailSection", () => ({
  EmailSection: ({ hasPassword }: { hasPassword: boolean }) => (
    <div data-testid="email-section">{String(hasPassword)}</div>
  ),
}));
vi.mock("../profile/DeleteAccountSection", () => ({
  DeleteAccountSection: ({ hasPassword }: { hasPassword: boolean }) => (
    <div data-testid="delete-account-section">{String(hasPassword)}</div>
  ),
}));

import { Profile } from "../Profile";

const baseUser = { id: "user-1", name: "Maria Silva", email: "maria@test.com", role: "CUSTOMER" } as StoredUser;

function renderProfile(user: Partial<StoredUser>) {
  auth.user = { ...baseUser, ...user };
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <Profile />
    </QueryClientProvider>
  );
}

describe("Profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("conta só com Google: oferece Criar senha, mostra o vínculo e repassa hasPassword=false", () => {
    renderProfile({ hasPassword: false, hasGoogle: true });

    expect(screen.getByRole("button", { name: "Criar senha" })).toBeInTheDocument();
    expect(screen.queryByText("Alterar Senha")).not.toBeInTheDocument();
    expect(screen.getByTestId("google-linked")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Vincular conta Google" })).not.toBeInTheDocument();
    expect(screen.getByTestId("email-section")).toHaveTextContent("false");
    expect(screen.getByTestId("delete-account-section")).toHaveTextContent("false");
  });

  it("conta só com senha: mostra Alterar Senha, oferece vincular o Google e repassa hasPassword=true", () => {
    renderProfile({ hasPassword: true, hasGoogle: false });

    expect(screen.getByText("Alterar Senha")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Criar senha" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vincular conta Google" })).toBeInTheDocument();
    expect(screen.queryByTestId("google-linked")).not.toBeInTheDocument();
    expect(screen.getByTestId("email-section")).toHaveTextContent("true");
    expect(screen.getByTestId("delete-account-section")).toHaveTextContent("true");
  });

  it("conta com senha e Google: mostra Alterar Senha e o vínculo", () => {
    renderProfile({ hasPassword: true, hasGoogle: true });

    expect(screen.getByText("Alterar Senha")).toBeInTheDocument();
    expect(screen.getByTestId("google-linked")).toBeInTheDocument();
  });
});
