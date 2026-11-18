import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockResend, mockToastSuccess } = vi.hoisted(() => ({
  mockResend: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock("../../../lib/authApi", () => ({
  authApi: { resendVerification: (...args: unknown[]) => mockResend(...args) },
}));
vi.mock("react-hot-toast", () => ({ default: { success: mockToastSuccess, error: vi.fn() } }));

import { EmailVerificationPending } from "../EmailVerificationPending";

describe("EmailVerificationPending", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra o email e reenvia o link para ele", async () => {
    mockResend.mockResolvedValue({ message: "Novo link enviado" });
    render(<EmailVerificationPending email="maria@test.com" onBackToLogin={vi.fn()} />);

    expect(screen.getByText("maria@test.com")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /reenviar link/i }));

    expect(mockResend).toHaveBeenCalledWith("maria@test.com");
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith("Novo link enviado"));
  });

  it("voltar para o login chama o callback", async () => {
    const onBack = vi.fn();
    render(<EmailVerificationPending email="maria@test.com" onBackToLogin={onBack} />);

    await userEvent.click(screen.getByRole("button", { name: /voltar para o login/i }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
