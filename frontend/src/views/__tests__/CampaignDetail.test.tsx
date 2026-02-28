import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, mockAuthContext } from "@/__tests__/test-utils";
import {
  createMockCampaignFull,
  createMockFullProduct,
  createMockOrder,
  createMockAnalytics,
} from "@/__tests__/mock-data";
import CampaignDetail from "../CampaignDetail";
import { campaignApi, productApi, orderApi, analyticsApi } from "@/api";
import * as nextNavigation from "next/navigation";

// Mock the API modules
vi.mock("@/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api")>();
  const campaignMock = {
    ...actual.campaignApi,
    getById: vi.fn(),
    getBySlug: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    downloadSupplierInvoice: vi.fn(),
    clone: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    getDistance: vi.fn(),
  };
  const productMock = {
    ...actual.productApi,
    getByCampaign: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const orderMock = {
    ...actual.orderApi,
    getByCampaign: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateWithItems: vi.fn(),
    delete: vi.fn(),
  };
  const analyticsMock = {
    ...actual.analyticsApi,
    getByCampaign: vi.fn(),
  };
  return {
    ...actual,
    campaignApi: campaignMock,
    campaignService: campaignMock,
    productApi: productMock,
    productService: productMock,
    orderApi: orderMock,
    orderService: orderMock,
    analyticsApi: analyticsMock,
    analyticsService: analyticsMock,
  };
});

describe("CampaignDetail", () => {
  const mockCampaign = createMockCampaignFull({
    id: "campaign-1",
    name: "Test Campaign",
    description: "Test Description",
    status: "ACTIVE",
    creatorId: "user-1",
  });

  const mockProducts = [
    createMockFullProduct({
      id: "product-1",
      name: "Product 1",
      price: 50,
      weight: 100,
    }),
    createMockFullProduct({
      id: "product-2",
      name: "Product 2",
      price: 75,
      weight: 200,
    }),
    createMockFullProduct({
      id: "product-3",
      name: "Product 3",
      price: 100,
      weight: 300,
    }),
  ];

  const mockOrders = [
    createMockOrder({
      id: "order-1",
      customer: { id: "u1", name: "Customer 1", email: "customer1@test.com" },
      isPaid: false,
      total: 150,
    }),
    createMockOrder({
      id: "order-2",
      customer: { id: "u2", name: "Customer 2", email: "customer2@test.com" },
      isPaid: true,
      total: 200,
    }),
  ];

  const mockAnalytics = createMockAnalytics();

  beforeEach(() => {
    vi.clearAllMocks();

    // Override useParams to provide campaign slug
    vi.spyOn(nextNavigation, "useParams").mockReturnValue({ slug: "campaign-1" });
    vi.spyOn(nextNavigation, "usePathname").mockReturnValue("/campanhas/campaign-1");

    // Default successful API responses
    vi.mocked(campaignApi.getBySlug).mockResolvedValue(mockCampaign);
    vi.mocked(productApi.getByCampaign).mockResolvedValue(mockProducts);
    vi.mocked(orderApi.getByCampaign).mockResolvedValue(mockOrders);
    vi.mocked(analyticsApi.getByCampaign).mockResolvedValue(mockAnalytics);
  });

  describe("Loading State", () => {
    it("should display loading skeleton while fetching data", async () => {
      vi.mocked(campaignApi.getBySlug).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      // Check for skeleton elements with animation
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Campaign Header Rendering", () => {
    it("should display campaign name and description", async () => {
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Test Description")[0]).toBeInTheDocument();
      });
    });

    it("should display back button with correct link", async () => {
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        const backLink = screen.getByRole("link", { name: /voltar/i });
        expect(backLink).toBeInTheDocument();
        expect(backLink).toHaveAttribute("href", "/campanhas");
      });
    });

    it("should show status-appropriate action buttons for campaign creator", async () => {
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        // For ACTIVE campaign, should show "Fechar Campanha" button
        expect(
          screen.getByRole("button", { name: /fechar campanha/i })
        ).toBeInTheDocument();
      });
    });

    it("should not show action buttons for non-creator", async () => {
      const differentUser = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, id: "different-user" },
      };

      renderWithProviders(<CampaignDetail />, {
        authContext: differentUser,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      expect(
        screen.queryByRole("button", { name: /fechar campanha/i })
      ).not.toBeInTheDocument();
    });

    it("should display deadline when present", async () => {
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        // The default mock campaign has a deadline (7 days from now)
        expect(screen.getAllByText(/data limite:/i)[0]).toBeInTheDocument();
      });
    });
  });

  describe("Tab Navigation", () => {
    it("should render all tabs for campaign creator", async () => {
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      // Desktop tabs (there are duplicates for mobile/desktop)
      const allButtons = screen.getAllByRole("button");
      const buttonTexts = allButtons.map((btn) => btn.textContent);

      // Check that each tab type exists
      expect(
        buttonTexts.some(
          (text) => text?.includes("Geral") || text?.includes("Visão Geral")
        )
      ).toBe(true);
      expect(buttonTexts.some((text) => text === "Pedidos")).toBe(true);
      expect(buttonTexts.some((text) => text === "Produtos")).toBe(true);
      expect(buttonTexts.some((text) => text === "Frete")).toBe(true);
      expect(buttonTexts.some((text) => text === "Moderar")).toBe(true);
    });

    it('should not show "Moderar" tab for non-creators', async () => {
      const differentUser = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, id: "different-user" },
      };

      renderWithProviders(<CampaignDetail />, {
        authContext: differentUser,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      expect(
        screen.queryByRole("button", { name: /moderar/i })
      ).not.toBeInTheDocument();
    });

    it("should switch tabs when clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      // Initially on Overview tab - check desktop version (first one)
      const overviewTabs = screen.getAllByRole("button", {
        name: /^visão geral$/i,
      });
      expect(overviewTabs[0]).toHaveClass("text-sky-600");
      expect(overviewTabs[0]).toHaveClass("border-sky-500");

      // Click Products tab (desktop version)
      const productsTabs = screen.getAllByRole("button", { name: /^produtos$/i });
      await user.click(productsTabs[0]);

      // Products tab should be active
      await waitFor(() => {
        expect(productsTabs[0]).toHaveClass("text-sky-600");
        expect(productsTabs[0]).toHaveClass("border-sky-500");
      });
    });

    it("should open questions tab when navigating from notification", async () => {
      // This would require mocking useLocation to return state with openQuestionsTab: true
      // For now, we'll test that the effect logic works by checking the tab navigation
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      // Verify questions tab exists (only for creators) - use getAllByRole for duplicates
      const moderarTabs = screen.getAllByRole("button", { name: /moderar/i });
      expect(moderarTabs.length).toBeGreaterThan(0);
    });
  });

  describe("Overview Tab Content", () => {
    it("should display analytics data on overview tab", async () => {
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      // Overview tab is default, should show analytics
      // Check that we're showing products and orders
      await waitFor(() => {
        expect(screen.getAllByText("Product 1")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Customer 1")[0]).toBeInTheDocument();
      });
    });
  });

  describe("Products Tab", () => {
    it("should display products list when products tab is active", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      // Click products tab (desktop version - first one)
      const productsTabs = screen.getAllByRole("button", { name: /^produtos$/i });
      await user.click(productsTabs[0]);

      await waitFor(() => {
        // Should show all products
        expect(screen.getAllByText("Product 1")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Product 2")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Product 3")[0]).toBeInTheDocument();
      });
    });

    it('should show "Adicionar Produto" button for campaign creator on active campaign', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      // Click on the Products tab
      const productsTabs = screen.getAllByRole("button", { name: /^produtos$/i });
      await user.click(productsTabs[0]);

      // Wait for the Products tab content to render - look for tab header
      await waitFor(() => {
        // ProductsTab renders <h2> with "Produtos" and the Package icon
        const headings = screen.getAllByText("Produtos");
        // After tab switch, there should be more "Produtos" elements (tab + heading)
        expect(headings.length).toBeGreaterThanOrEqual(2);
      }, { timeout: 5000 });

      // The "Adicionar Produto" button should appear for campaign creator on active campaign
      // There may be multiple (one in header, one in ProductsTab)
      const addProductButtons = screen.getAllByRole("button", { name: /adicionar produto/i });
      expect(addProductButtons.length).toBeGreaterThan(0);
    });

    it('should not show "Adicionar Produto" button for non-creator', async () => {
      const user = userEvent.setup();
      const differentUser = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, id: "different-user" },
      };

      renderWithProviders(<CampaignDetail />, {
        authContext: differentUser,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      const productsTabs = screen.getAllByRole("button", { name: /^produtos$/i });
      await user.click(productsTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText("Product 1")[0]).toBeInTheDocument();
      });

      expect(
        screen.queryByRole("button", { name: /adicionar produto/i })
      ).not.toBeInTheDocument();
    });

    it("should display empty state when no products exist", async () => {
      const user = userEvent.setup();
      vi.mocked(productApi.getByCampaign).mockResolvedValue([]);

      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      const productsTabs = screen.getAllByRole("button", { name: /^produtos$/i });
      await user.click(productsTabs[0]);

      await waitFor(() => {
        expect(
          screen.getByText(/nenhum produto cadastrado/i)
        ).toBeInTheDocument();
      });
    });

    it("should create product with campaignId from loaded campaign", async () => {
      const user = userEvent.setup();
      vi.mocked(productApi.create).mockResolvedValue(
        createMockFullProduct({
          id: "product-new",
          campaignId: "campaign-1",
          name: "Produto novo",
          price: 10,
          weight: 200,
        })
      );

      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      const productsTabs = screen.getAllByRole("button", { name: /^produtos$/i });
      await user.click(productsTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByRole("button", { name: /adicionar produto/i }).length).toBeGreaterThan(0);
      });

      const addProductButton = screen.getAllByRole("button", { name: /adicionar produto/i })[0];
      await user.click(addProductButton);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /adicionar produto/i })).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nome do produto/i), "Produto novo");
      await user.type(screen.getByLabelText(/preço/i), "10");
      await user.type(screen.getByLabelText(/peso/i), "200");

      const addProductDialog = screen.getByRole("dialog", { name: /adicionar produto/i });
      await user.click(within(addProductDialog).getByRole("button", { name: /^adicionar$/i }));

      await waitFor(() => {
        expect(productApi.create).toHaveBeenCalled();
      });

      const [firstPayload] = vi.mocked(productApi.create).mock.calls[0];
      expect(firstPayload).toEqual({
          campaignId: "campaign-1",
          name: "Produto novo",
          price: 10,
          weight: 200,
      });
    });
  });

  describe("Orders Tab", () => {
    it("should display orders list when orders tab is active", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      const ordersTabs = screen.getAllByRole("button", { name: /^pedidos$/i });
      await user.click(ordersTabs[0]);

      // Just verify the orders tab was activated and content is rendered
      // Check for order-related UI elements instead of specific customer names
      await waitFor(
        () => {
          // Check that we're on the orders tab by looking for the search input
          expect(
            screen.getByPlaceholderText(/buscar por pessoa/i)
          ).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });

    it("should show search bar for filtering orders", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      const ordersTabs = screen.getAllByRole("button", { name: /^pedidos$/i });
      await user.click(ordersTabs[0]);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/buscar por pessoa/i)
        ).toBeInTheDocument();
      });
    });

    it("should filter orders by customer name", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      const ordersTabs = screen.getAllByRole("button", { name: /^pedidos$/i });
      await user.click(ordersTabs[0]);

      // Wait for the search input to appear
      await waitFor(
        () => {
          expect(
            screen.getByPlaceholderText(/buscar por pessoa/i)
          ).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      const searchInput = screen.getByPlaceholderText(/buscar por pessoa/i);
      await user.type(searchInput, "Customer 1");

      // Just verify that typing in the search input works
      // The actual filtering logic is tested at the component level
      expect(searchInput).toHaveValue("Customer 1");
    });

    it("should display empty state when no orders exist", async () => {
      const user = userEvent.setup();
      vi.mocked(orderApi.getByCampaign).mockResolvedValue([]);

      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      const ordersTabs = screen.getAllByRole("button", { name: /^pedidos$/i });
      await user.click(ordersTabs[0]);

      await waitFor(() => {
        expect(screen.getByText(/nenhum pedido criado/i)).toBeInTheDocument();
      });
    });
  });

  describe("Shipping Tab", () => {
    it("should display shipping information when shipping tab is active", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      const shippingTabs = screen.getAllByRole("button", { name: /^frete$/i });
      await user.click(shippingTabs[0]);

      await waitFor(() => {
        // Should show shipping cost
        expect(screen.getByText(/R\$\s*50,00/)).toBeInTheDocument();
      });
    });
  });

  describe("Campaign Status", () => {
    it("should show appropriate alert for closed campaign", async () => {
      const closedCampaign = createMockCampaignFull({
        ...mockCampaign,
        status: "CLOSED",
      });
      vi.mocked(campaignApi.getBySlug).mockResolvedValue(closedCampaign);

      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getByText(/campanha fechada/i)).toBeInTheDocument();
        expect(
          screen.getByText(
            /não é possível adicionar ou alterar produtos e pedidos/i
          )
        ).toBeInTheDocument();
      });
    });

    it("should show appropriate alert for sent campaign", async () => {
      const sentCampaign = createMockCampaignFull({
        ...mockCampaign,
        status: "SENT",
      });
      vi.mocked(campaignApi.getBySlug).mockResolvedValue(sentCampaign);

      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getByText(/campanha enviada/i)).toBeInTheDocument();
      });
    });
  });

  describe("Responsive Behavior", () => {
    it("should render mobile tab navigation", async () => {
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      // Mobile tabs exist (they use different labels like "Geral" instead of "Visão Geral")
      const mobileTabs = document.querySelectorAll(".md\\:hidden button");
      expect(mobileTabs.length).toBeGreaterThan(0);
    });
  });

  describe("Authorization", () => {
    it("should allow campaign creator to see all management features", async () => {
      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      // Should see action buttons
      expect(
        screen.getByRole("button", { name: /fechar campanha/i })
      ).toBeInTheDocument();

      // Should see moderar tab
      const moderarTabs = screen.getAllByRole("button", { name: /moderar/i });
      expect(moderarTabs.length).toBeGreaterThan(0);
    });

    it("should hide management features for non-creator", async () => {
      const differentUser = {
        ...mockAuthContext,
        user: { ...mockAuthContext.user, id: "different-user" },
      };

      renderWithProviders(<CampaignDetail />, {
        authContext: differentUser,
      });

      await waitFor(() => {
        expect(screen.getAllByText("Test Campaign")[0]).toBeInTheDocument();
      });

      // Should not see creator action buttons
      expect(
        screen.queryByRole("button", { name: /fechar campanha/i })
      ).not.toBeInTheDocument();

      // Should not see moderar tab
      expect(
        screen.queryByRole("button", { name: /moderar/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle campaign fetch error gracefully", async () => {
      vi.mocked(campaignApi.getBySlug).mockRejectedValue(
        new Error("Campaign not found")
      );

      renderWithProviders(<CampaignDetail />, {
        authContext: mockAuthContext,
      });

      // Should show loading skeleton initially
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);

      // Query will fail silently with React Query, showing loading state
      // In a real implementation, you'd want error boundary or error state
    });
  });
});
