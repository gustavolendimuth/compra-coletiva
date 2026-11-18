import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../LoginForm";

describe("LoginForm", () => {
  it("'Esqueci minha senha' avisa com o email já digitado, sem enviar o login", async () => {
    const onSubmit = vi.fn();
    const onForgotPassword = vi.fn();
    render(
      <LoginForm
        onSubmit={onSubmit}
        onGoogleLogin={vi.fn()}
        onForgotPassword={onForgotPassword}
        isLoading={false}
      />
    );

    await userEvent.type(screen.getByLabelText("Email"), " maria@test.com ");
    await userEvent.click(screen.getByRole("button", { name: "Esqueci minha senha" }));

    expect(onForgotPassword).toHaveBeenCalledWith("maria@test.com");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
