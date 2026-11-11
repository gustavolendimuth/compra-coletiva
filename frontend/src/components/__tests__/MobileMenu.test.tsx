import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { MobileMenu } from "../MobileMenu";

vi.mock("next/navigation", () => ({ usePathname: () => "/campanhas" }));
vi.mock("../UserMenu", () => ({ UserMenu: () => <div>user menu</div> }));
vi.mock("../NotificationIcon", () => ({ NotificationIcon: () => null }));
vi.mock("../NewCampaignButton", () => ({ NewCampaignButton: () => null }));

const openAuthModal = () =>
  act(() => {
    window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }));
  });

describe("MobileMenu", () => {
  // O menu ficava aberto por cima da página depois do login feito pelo "Entrar" dele
  it("fecha quando o modal de login/cadastro é aberto", () => {
    const onClose = vi.fn();
    render(<MobileMenu isOpen onClose={onClose} />);

    openAuthModal();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("menu fechado não reage ao modal de login", () => {
    const onClose = vi.fn();
    const { rerender } = render(<MobileMenu isOpen onClose={onClose} />);
    rerender(<MobileMenu isOpen={false} onClose={onClose} />);

    openAuthModal();

    expect(onClose).not.toHaveBeenCalled();
  });
});
