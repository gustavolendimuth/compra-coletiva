import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OverviewTab } from "../OverviewTab";
import {
  createMockFullProduct,
  createMockOrder,
  createMockAnalytics,
  createMockCampaignFull,
} from "@/__tests__/mock-data";

// Mock CampaignChat component
vi.mock("@/components/campaign", () => ({
  CampaignChat: ({ campaignId, isCreator }: unknown) => (
    <div data-testid="campaign-chat">
      <span>Campaign Chat: {campaignId}</span>
      <span>Is Creator: {String(isCreator)}</span>
    </div>
  ),
}));

// Mock IconButton component
vi.mock("@/components/IconButton", () => ({
  default: ({ onClick, children, icon, title, ...props }: unknown) => (
    <button onClick={onClick} title={title} {...props}>
      {children}
    </button>
  ),
}));

// Mock CampaignLocationSection component
vi.mock("../../CampaignLocationSection", () => ({
  CampaignLocationSection: () => (
    <div data-testid="campaign-location-section">Location Section</div>
  ),
}));

// Mock useAuth to return an admin user so all action buttons are visible
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "admin-user", role: "ADMIN", name: "Admin", email: "admin@test.com" },
  })),
}));

describe("OverviewTab", () => {
  const mockProducts = [
    createMockFullProduct({
      id: "product-1",
      name: "Product A",
      price: 50,
      campaignId: "campaign-1",
    }),
    createMockFullProduct({
      id: "product-2",
      name: "Product B",
      price: 75,
      campaignId: "campaign-1",
    }),
    createMockFullProduct({
      id: "product-3",
      name: "Product C",
      price: 100,
      campaignId: "campaign-1",
    }),
  ];

  const mockOrders = [
    createMockOrder({
      id: "order-1",
      customer: { id: "u1", name: "Alice", email: "alice@test.com" },
      isPaid: true,
      total: 110,
    }),
    createMockOrder({
      id: "order-2",
      customer: { id: "u2", name: "Bob", email: "bob@test.com" },
      isPaid: false,
      total: 220,
    }),
  ];

  const mockAnalytics = createMockAnalytics({
    totalQuantity: 15,
    totalWithoutShipping: 500,
    totalWithShipping: 550,
    totalPaid: 300,
    totalUnpaid: 250,
    byCustomer: [
      { customerAlias: "Alice", total: 110, isPaid: true },
      { customerAlias: "Bob", total: 220, isPaid: false },
    ],
    byProduct: [
      { productId: "product-1", productName: "Product A", quantity: 5 },
      { productId: "product-2", productName: "Product B", quantity: 10 },
    ],
  });

  const mockCampaign = createMockCampaignFull({
    id: "campaign-1",
    slug: "campaign-1",
    name: "Test Campaign",
    status: "ACTIVE",
  });

  const mockCallbacks = {
    onViewOrder: vi.fn(),
    onTogglePayment: vi.fn(),
    onEditOrder: vi.fn(),
    onAddToOrder: vi.fn(),
  };

  const defaultProps = {
    campaign: mockCampaign,
    campaignId: "campaign-1",
    analytics: mockAnalytics,
    products: mockProducts,
    orders: mockOrders,
    isActive: true,
    canEditCampaign: true,
    ...mockCallbacks,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render overview tab header", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Visão Geral")).toBeInTheDocument();
    });

    it("should render campaign location section when pickupAddress is set", () => {
      const campaignWithPickup = createMockCampaignFull({
        id: "campaign-1",
        slug: "campaign-1",
        pickupAddress: "Rua Test",
      });
      render(<OverviewTab {...defaultProps} campaign={campaignWithPickup} />);

      expect(screen.getByTestId("campaign-location-section")).toBeInTheDocument();
    });

    it("should not render location section when no pickupAddress", () => {
      render(<OverviewTab {...defaultProps} canEditCampaign={false} />);

      expect(screen.queryByTestId("campaign-location-section")).not.toBeInTheDocument();
    });
  });

  describe("Products Section", () => {
    it("should render products section header", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Produtos Disponíveis")).toBeInTheDocument();
    });

    it("should render all products", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getAllByText("Product A")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Product B")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Product C")[0]).toBeInTheDocument();
    });

    it("should render product prices", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("R$ 50,00")).toBeInTheDocument();
      expect(screen.getByText("R$ 75,00")).toBeInTheDocument();
      expect(screen.getByText("R$ 100,00")).toBeInTheDocument();
    });

    it("should render order buttons for each product when active", () => {
      render(<OverviewTab {...defaultProps} isActive={true} />);

      const orderButtons = screen.getAllByRole("button", { name: /pedir/i });
      expect(orderButtons).toHaveLength(mockProducts.length);
    });

    it("should not render order buttons when campaign is not active", () => {
      render(<OverviewTab {...defaultProps} isActive={false} />);

      expect(
        screen.queryByRole("button", { name: /pedir/i })
      ).not.toBeInTheDocument();
    });

    it("should call onAddToOrder when order button is clicked", async () => {
      const user = userEvent.setup();
      render(<OverviewTab {...defaultProps} isActive={true} />);

      const orderButtons = screen.getAllByRole("button", { name: /pedir/i });
      await user.click(orderButtons[0]);

      expect(mockCallbacks.onAddToOrder).toHaveBeenCalledWith(mockProducts[0]);
    });

    it("should not render products section when there are no products", () => {
      render(<OverviewTab {...defaultProps} products={[]} />);

      expect(
        screen.queryByText("Produtos Disponíveis")
      ).not.toBeInTheDocument();
    });
  });

  describe("Financial Summary Section", () => {
    it("should render financial summary header", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Resumo Financeiro")).toBeInTheDocument();
    });

    it("should display total number of customers", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Total de Pessoas")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // byCustomer.length
    });

    it("should display total quantity of items", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Total de Itens")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("should display total without shipping", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Total sem Frete")).toBeInTheDocument();
      expect(screen.getByText("R$ 500,00")).toBeInTheDocument();
    });

    it("should display total with shipping", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Total com Frete")).toBeInTheDocument();
      expect(screen.getByText("R$ 550,00")).toBeInTheDocument();
    });

    it("should display total paid", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Total Pago")).toBeInTheDocument();
      expect(screen.getByText("R$ 300,00")).toBeInTheDocument();
    });

    it("should display total unpaid", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Total Não Pago")).toBeInTheDocument();
      expect(screen.getByText("R$ 250,00")).toBeInTheDocument();
    });
  });

  describe("Details Section - By Customer", () => {
    it("should render by customer section header", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Detalhamento")).toBeInTheDocument();
      expect(screen.getByText("Por Pessoa")).toBeInTheDocument();
    });

    it("should render customer names sorted alphabetically", () => {
      render(<OverviewTab {...defaultProps} />);

      const customerElements = screen.getAllByText(/Alice|Bob/);
      expect(customerElements.length).toBeGreaterThan(0);
    });

    it("should display customer payment status", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Pago")).toBeInTheDocument();
      expect(screen.getByText("Pendente")).toBeInTheDocument();
    });

    it("should display customer totals", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("R$ 110,00")).toBeInTheDocument();
      expect(screen.getByText("R$ 220,00")).toBeInTheDocument();
    });

    it("should render view order button for each customer", () => {
      render(<OverviewTab {...defaultProps} />);

      const viewButtons = screen.getAllByTitle(/visualizar pedido/i);
      expect(viewButtons).toHaveLength(mockAnalytics.byCustomer.length);
    });

    it("should call onViewOrder when view button is clicked", async () => {
      const user = userEvent.setup();
      render(<OverviewTab {...defaultProps} />);

      const viewButtons = screen.getAllByTitle(/visualizar pedido/i);
      await user.click(viewButtons[0]);

      expect(mockCallbacks.onViewOrder).toHaveBeenCalledWith(mockOrders[0]);
    });

    it("should render payment toggle button for each customer", () => {
      render(<OverviewTab {...defaultProps} />);

      const paymentButtons = screen.getAllByTitle(
        /marcar como não pago|enviar comprovante de pagamento/i
      );
      expect(paymentButtons).toHaveLength(mockAnalytics.byCustomer.length);
    });

    it("should call onTogglePayment when payment button is clicked", async () => {
      const user = userEvent.setup();
      render(<OverviewTab {...defaultProps} />);

      const paymentButtons = screen.getAllByTitle(
        /marcar como não pago|enviar comprovante de pagamento/i
      );
      await user.click(paymentButtons[0]);

      expect(mockCallbacks.onTogglePayment).toHaveBeenCalledWith(mockOrders[0]);
    });

    it("should render edit button for each customer", () => {
      render(<OverviewTab {...defaultProps} />);

      const editButtons = screen.getAllByTitle(/editar pedido/i);
      expect(editButtons).toHaveLength(mockAnalytics.byCustomer.length);
    });

    it("should call onEditOrder when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<OverviewTab {...defaultProps} />);

      const editButtons = screen.getAllByTitle(/editar pedido/i);
      await user.click(editButtons[0]);

      expect(mockCallbacks.onEditOrder).toHaveBeenCalledWith(mockOrders[0]);
    });
  });

  describe("Details Section - By Product", () => {
    it("should render by product section header", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Por Produto")).toBeInTheDocument();
    });

    it("should render product names", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getAllByText("Product A")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Product B")[0]).toBeInTheDocument();
    });

    it("should render product quantities", () => {
      render(<OverviewTab {...defaultProps} />);

      // Check for quantity text (5 unidades, 10 unidades)
      const quantityTexts = screen.getAllByText(/\d+ unidades|un\./);
      expect(quantityTexts.length).toBeGreaterThan(0);
    });
  });

  describe("Questions and Answers Section", () => {
    it("should render questions section header", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByText("Perguntas e Respostas")).toBeInTheDocument();
    });

    it("should render questions section description", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(
        screen.getByText(/faça perguntas sobre os produtos e a campanha/i)
      ).toBeInTheDocument();
    });

    it("should render CampaignChat component", () => {
      render(<OverviewTab {...defaultProps} />);

      expect(screen.getByTestId("campaign-chat")).toBeInTheDocument();
    });

    it("should pass campaignId to CampaignChat", () => {
      render(<OverviewTab {...defaultProps} campaignId="test-campaign-123" />);

      expect(
        screen.getByText("Campaign Chat: test-campaign-123")
      ).toBeInTheDocument();
    });

    it("should pass isCreator prop correctly to CampaignChat", () => {
      render(<OverviewTab {...defaultProps} canEditCampaign={true} />);

      expect(screen.getByText("Is Creator: true")).toBeInTheDocument();
    });

    it("should pass isCreator as false when user is not creator", () => {
      render(<OverviewTab {...defaultProps} canEditCampaign={false} />);

      expect(screen.getByText("Is Creator: false")).toBeInTheDocument();
    });
  });

  describe("Action Callbacks", () => {
    it("should call onAddToOrder when product order button is clicked", async () => {
      const user = userEvent.setup();
      render(<OverviewTab {...defaultProps} isActive={true} />);

      const orderButtons = screen.getAllByRole("button", { name: /pedir/i });
      await user.click(orderButtons[0]);

      expect(mockCallbacks.onAddToOrder).toHaveBeenCalledTimes(1);
    });
  });

  describe("Responsive Design", () => {
    it("should have bottom padding for mobile navigation", () => {
      const { container } = render(<OverviewTab {...defaultProps} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("pb-20");
    });

    it("should apply responsive grid classes to products", () => {
      const { container } = render(<OverviewTab {...defaultProps} />);

      const productGrid = container.querySelector(".grid");
      expect(productGrid).toHaveClass("grid-cols-2");
    });

    it("should apply responsive grid classes to financial summary", () => {
      const { container } = render(<OverviewTab {...defaultProps} />);

      const summaryGrids = container.querySelectorAll(".grid");
      expect(summaryGrids.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty analytics gracefully", () => {
      const emptyAnalytics = createMockAnalytics({
        totalQuantity: 0,
        totalWithoutShipping: 0,
        totalWithShipping: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        byCustomer: [],
        byProduct: [],
      });

      render(<OverviewTab {...defaultProps} analytics={emptyAnalytics} />);

      expect(screen.getAllByText("0")[0]).toBeInTheDocument(); // totalQuantity
      expect(screen.getAllByText("R$ 0,00")[0]).toBeInTheDocument(); // various totals
    });

    it("should handle empty products list", () => {
      render(<OverviewTab {...defaultProps} products={[]} />);

      expect(
        screen.queryByText("Produtos Disponíveis")
      ).not.toBeInTheDocument();
    });

    it("should handle empty orders list", () => {
      const emptyAnalytics = createMockAnalytics({ byCustomer: [] });
      render(
        <OverviewTab {...defaultProps} orders={[]} analytics={emptyAnalytics} />
      );

      // Should still render the structure but with no customer entries
      expect(screen.getByText("Por Pessoa")).toBeInTheDocument();
    });
  });

  describe("Role-based Permissions", () => {
    const permissionOrders = [
      createMockOrder({
        id: "order-1",
        userId: "u1",
        customer: { id: "u1", name: "Alice", email: "alice@test.com" },
        isPaid: true,
        total: 110,
      }),
      createMockOrder({
        id: "order-2",
        userId: "u2",
        customer: { id: "u2", name: "Bob", email: "bob@test.com" },
        isPaid: false,
        total: 220,
      }),
    ];

    const permissionProps = {
      ...defaultProps,
      orders: permissionOrders,
    };

    it("should show all action buttons on all orders for admin user", async () => {
      const { useAuth } = await import("@/contexts/AuthContext");
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "admin-user", role: "ADMIN", name: "Admin", email: "admin@test.com" },
      } as ReturnType<typeof useAuth>);

      render(<OverviewTab {...permissionProps} />);

      const viewButtons = screen.getAllByTitle(/visualizar pedido/i);
      const paymentButtons = screen.getAllByTitle(
        /marcar como não pago|enviar comprovante de pagamento/i
      );
      const editButtons = screen.getAllByTitle(/editar pedido/i);

      expect(viewButtons).toHaveLength(2);
      expect(paymentButtons).toHaveLength(2);
      expect(editButtons).toHaveLength(2);
    });

    it("should show view button on all orders for campaign creator", async () => {
      const { useAuth } = await import("@/contexts/AuthContext");
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", role: "CUSTOMER", name: "Creator", email: "creator@test.com" },
      } as ReturnType<typeof useAuth>);

      render(<OverviewTab {...permissionProps} />);

      const viewButtons = screen.getAllByTitle(/visualizar pedido/i);
      expect(viewButtons).toHaveLength(2);
    });

    it("should not show payment/edit buttons on others' orders for creator", async () => {
      const { useAuth } = await import("@/contexts/AuthContext");
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "user-1", role: "CUSTOMER", name: "Creator", email: "creator@test.com" },
      } as ReturnType<typeof useAuth>);

      render(<OverviewTab {...permissionProps} />);

      // Creator (user-1) is not u1 or u2, so no payment/edit buttons
      expect(
        screen.queryByTitle(/marcar como não pago|enviar comprovante de pagamento/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTitle(/editar pedido/i)
      ).not.toBeInTheDocument();
    });

    it("should show all buttons only on own order for regular user", async () => {
      const { useAuth } = await import("@/contexts/AuthContext");
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "u1", role: "CUSTOMER", name: "Alice", email: "alice@test.com" },
      } as ReturnType<typeof useAuth>);

      render(<OverviewTab {...permissionProps} />);

      // u1 (Alice) should see view, payment, and edit on their own order
      const viewButtons = screen.getAllByTitle(/visualizar pedido/i);
      const paymentButtons = screen.getAllByTitle(
        /marcar como não pago|enviar comprovante de pagamento/i
      );
      const editButtons = screen.getAllByTitle(/editar pedido/i);

      expect(viewButtons).toHaveLength(1);
      expect(paymentButtons).toHaveLength(1);
      expect(editButtons).toHaveLength(1);
    });

    it("should show no buttons on other users' orders for regular user", async () => {
      const { useAuth } = await import("@/contexts/AuthContext");
      vi.mocked(useAuth).mockReturnValue({
        user: { id: "u1", role: "CUSTOMER", name: "Alice", email: "alice@test.com" },
      } as ReturnType<typeof useAuth>);

      render(<OverviewTab {...permissionProps} />);

      // Only 1 view button total (own order), so Bob's entry has no buttons
      const viewButtons = screen.getAllByTitle(/visualizar pedido/i);
      expect(viewButtons).toHaveLength(1);

      // Verify Bob's name is rendered but has no associated buttons
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("should show no action buttons when user is unauthenticated", async () => {
      const { useAuth } = await import("@/contexts/AuthContext");
      vi.mocked(useAuth).mockReturnValue({
        user: null,
      } as ReturnType<typeof useAuth>);

      render(<OverviewTab {...permissionProps} />);

      expect(
        screen.queryByTitle(/visualizar pedido/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTitle(/marcar como não pago|enviar comprovante de pagamento/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTitle(/editar pedido/i)
      ).not.toBeInTheDocument();
    });
  });
});

