import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PasswordSection } from "../PasswordSection";

const { mockRequestReset } = vi.hoisted(() => ({ mockRequestReset: vi.fn() }));

vi.mock("@/lib/authApi", () => ({
  authApi: { requestPasswordReset: (...args: unknown[]) => mockRequestReset(...args) },
}));
vi.mock("@/api", () => ({ profileService: { update: vi.fn() } }));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("PasswordSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("conta só com Google: Criar senha envia o link para o email da conta", async () => {
    mockRequestReset.mockResolvedValue({ message: "ok" });
    renderWithQuery(<PasswordSection email="google@test.com" hasPassword={false} />);

    await userEvent.click(screen.getByRole("button", { name: "Criar senha" }));

    expect(mockRequestReset).toHaveBeenCalledWith("google@test.com");
    expect(await screen.findByTestId("create-password-sent")).toHaveTextContent("google@test.com");
  });

  it("conta com senha não oferece Criar senha", () => {
    renderWithQuery(<PasswordSection email="senha@test.com" hasPassword />);

    expect(screen.queryByRole("button", { name: "Criar senha" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alterar" })).toBeInTheDocument();
  });
});
