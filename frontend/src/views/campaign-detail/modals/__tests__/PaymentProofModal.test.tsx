import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentProofModal } from "../PaymentProofModal";
import { createMockOrder } from "@/__tests__/mock-data";
import { formatCurrency } from "@/lib/utils";

vi.mock("@/hooks/usePaymentProofFile", () => ({
  usePaymentProofFile: () => ({ kind: "none" }),
}));

describe("PaymentProofModal", () => {
  const baseProps = {
    isOpen: true,
    onClose: vi.fn(),
    order: createMockOrder({ id: "order-1" }),
    onSubmit: vi.fn(),
    isPending: false,
  };

  it("without proof button: hidden when onMarkPaidWithoutProof is absent (participant)", () => {
    render(<PaymentProofModal {...baseProps} />);

    expect(screen.getByRole("button", { name: /^marcar como pago$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sem comprovante/i })).not.toBeInTheDocument();
  });

  it("without proof button: shown when onMarkPaidWithoutProof is given (creator/admin)", () => {
    render(<PaymentProofModal {...baseProps} onMarkPaidWithoutProof={vi.fn()} />);

    expect(screen.getByRole("button", { name: /marcar como pago sem comprovante/i })).toBeInTheDocument();
  });

  // Mostrava "R$ 100.00" (toFixed) em vez do formato brasileiro
  it("shows the order total in BRL format", () => {
    render(<PaymentProofModal {...baseProps} order={createMockOrder({ id: "order-1", total: 1234.5 })} />);

    const normalizer = (text: string) => text.replace(/\u00A0/g, " ");
    const expected = normalizer(formatCurrency(1234.5));
    expect(expected).toBe("R$ 1.234,50");
    expect(screen.getByText((_content, element) =>
      element?.tagName === "P" && normalizer(element.textContent ?? "") === `Total: ${expected}`
    )).toBeInTheDocument();
  });
});
