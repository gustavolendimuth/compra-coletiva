import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "../RegisterForm";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../../../api", () => ({
  authService: {
    checkName: vi.fn().mockResolvedValue({ suggestion: null }),
  },
}));

describe("RegisterForm", () => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onGoogleLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render mask checkbox unchecked by default", () => {
    render(
      <RegisterForm onSubmit={onSubmit} onGoogleLogin={onGoogleLogin} isLoading={false} />
    );

    const maskCheckbox = screen.getByRole("checkbox", {
      name: /quero mascarar meu nome nas campanhas/i,
    });

    expect(maskCheckbox).not.toBeChecked();
  });

  it("should submit hideNameInCampaigns=true when mask checkbox is checked", async () => {
    const user = userEvent.setup();

    render(
      <RegisterForm onSubmit={onSubmit} onGoogleLogin={onGoogleLogin} isLoading={false} />
    );

    await user.type(screen.getByRole("textbox", { name: /^nome$/i }), "A");
    await user.type(screen.getByRole("textbox", { name: /^email$/i }), "qa.teste@example.com");
    await user.type(screen.getByPlaceholderText("11 99999-8888"), "11999998888");
    await user.type(screen.getByLabelText(/senha/i), "Senha123A");

    await user.click(screen.getByRole("checkbox", { name: /li e aceito os termos/i }));
    await user.click(screen.getByRole("checkbox", { name: /li e aceito a política/i }));
    await user.click(
      screen.getByRole("checkbox", { name: /quero mascarar meu nome nas campanhas/i })
    );

    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        "A",
        "qa.teste@example.com",
        "Senha123A",
        "11999998888",
        true,
        true,
        true
      );
    });
  });
});
