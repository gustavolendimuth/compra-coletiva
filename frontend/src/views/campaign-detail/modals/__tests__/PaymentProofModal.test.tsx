import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentProofModal } from "../PaymentProofModal";
import { createMockOrder } from "@/__tests__/mock-data";

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
});
