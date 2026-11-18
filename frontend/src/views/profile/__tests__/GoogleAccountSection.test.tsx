import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { GoogleAccountSection } from "../GoogleAccountSection";

vi.mock("@/lib/env", () => ({ API_URL: "http://api.test" }));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const originalLocation = window.location;

// jsdom não navega: troca window.location por um objeto observável
const setLocation = (search: string) => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { href: `http://front.test/perfil${search}`, pathname: "/perfil", search },
  });
};

describe("GoogleAccountSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLocation("");
    vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
    vi.restoreAllMocks();
  });

  it("conta sem Google: botão leva ao backend com intent=link", async () => {
    render(<GoogleAccountSection email="maria@test.com" hasGoogle={false} onLinked={vi.fn()} />);

    expect(screen.getByText("maria@test.com")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Vincular conta Google" }));

    expect(window.location.href).toBe("http://api.test/api/auth/google?intent=link");
  });

  it("conta já vinculada mostra o vínculo e não oferece o botão", () => {
    render(<GoogleAccountSection email="maria@test.com" hasGoogle onLinked={vi.fn()} />);

    expect(screen.getByTestId("google-linked")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Vincular conta Google" })).not.toBeInTheDocument();
  });

  it("volta com google=linked: avisa, recarrega o usuário e limpa a URL", () => {
    setLocation("?google=linked");
    const onLinked = vi.fn();

    render(<GoogleAccountSection email="maria@test.com" hasGoogle={false} onLinked={onLinked} />);

    expect(toast.success).toHaveBeenCalledWith("Conta Google vinculada!");
    expect(onLinked).toHaveBeenCalledTimes(1);
    expect(window.history.replaceState).toHaveBeenCalledWith(null, "", "/perfil");
  });

  it.each([
    ["email_mismatch", "Use a conta Google com o mesmo email do seu cadastro."],
    ["google_in_use", "Esta conta Google já está vinculada a outro cadastro."],
    ["motivo_desconhecido", "Não foi possível vincular a conta Google. Tente de novo."],
  ])("volta com google=%s: mostra o erro sem recarregar o usuário", (result, message) => {
    setLocation(`?google=${result}`);
    const onLinked = vi.fn();

    render(<GoogleAccountSection email="maria@test.com" hasGoogle={false} onLinked={onLinked} />);

    expect(toast.error).toHaveBeenCalledWith(message);
    expect(onLinked).not.toHaveBeenCalled();
  });
});
