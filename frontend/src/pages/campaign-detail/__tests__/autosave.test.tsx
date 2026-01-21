import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCampaignDetail } from '../useCampaignDetail';
import * as api from '@/api';
import { AuthProvider } from '@/contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock the API
vi.mock('@/api', () => ({
  campaignApi: {
    getBySlug: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    clone: vi.fn(),
  },
  productApi: {
    getByCampaign: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  orderApi: {
    getByCampaign: vi.fn(),
    create: vi.fn(),
    updateWithItems: vi.fn(),
    delete: vi.fn(),
    updatePayment: vi.fn(),
  },
  analyticsApi: {
    getByCampaign: vi.fn(),
  },
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: 'test-campaign' }),
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null, pathname: '/campaigns/test-campaign' }),
  };
});

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'CUSTOMER',
    },
    requireAuth: (callback: () => void) => callback(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe.skip('Order Autosave', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup default mock responses
    vi.mocked(api.campaignApi.getBySlug).mockResolvedValue({
      id: 'campaign-1',
      slug: 'test-campaign',
      name: 'Test Campaign',
      description: 'Test description',
      status: 'ACTIVE',
      creatorId: 'creator-1',
      shippingCost: 10,
      deadline: null,
      imageUrl: null,
      imageKey: null,
      storageType: null,
      pixKey: null,
      pixType: null,
      pixName: null,
      pixVisibleAtStatus: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(api.productApi.getByCampaign).mockResolvedValue([
      {
        id: 'product-1',
        campaignId: 'campaign-1',
        name: 'Product 1',
        price: 10,
        weight: 1,
        imageUrl: null,
        imageKey: null,
        storageType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    vi.mocked(api.orderApi.getByCampaign).mockResolvedValue([]);
    vi.mocked(api.analyticsApi.getByCampaign).mockResolvedValue({
      totalRevenue: 0,
      totalOrders: 0,
      paidOrders: 0,
      unpaidOrders: 0,
      topProducts: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );

  it('should create empty order when clicking "Adicionar Pedido"', async () => {
    const createOrderMock = vi.mocked(api.orderApi.create).mockResolvedValue({
      id: 'order-1',
      campaignId: 'campaign-1',
      userId: 'user-1',
      customerName: 'Test User',
      subtotal: 0,
      shippingFee: 0,
      total: 0,
      isPaid: false,
      isSeparated: false,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofStorageType: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      customer: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    const { result } = renderHook(() => useCampaignDetail(), { wrapper });

    // Wait for queries to load
    await waitFor(() => {
      expect(result.current.campaign).toBeDefined();
    });

    // Click "Adicionar Pedido"
    await act(async () => {
      result.current.handleAddOrder();
    });

    // Should create empty order
    await waitFor(() => {
      expect(createOrderMock).toHaveBeenCalledWith({
        campaignId: 'campaign-1',
        customerName: 'Test User',
        items: [],
      });
    });

    // Should open edit modal
    await waitFor(() => {
      expect(result.current.isEditOrderModalOpen).toBe(true);
    });
  });

  it('should trigger autosave when adding product to order', async () => {
    vi.useFakeTimers();

    // Setup: User already has an order
    vi.mocked(api.orderApi.getByCampaign).mockResolvedValue([
      {
        id: 'order-1',
        campaignId: 'campaign-1',
        userId: 'user-1',
        customerName: 'Test User',
        subtotal: 10,
        shippingFee: 5,
        total: 15,
        isPaid: false,
        isSeparated: false,
        paymentProofUrl: null,
        paymentProofKey: null,
        paymentProofStorageType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'item-1',
            orderId: 'order-1',
            productId: 'product-1',
            quantity: 1,
            unitPrice: 10,
            subtotal: 10,
            product: {
              id: 'product-1',
              campaignId: 'campaign-1',
              name: 'Product 1',
              price: 10,
              weight: 1,
              imageUrl: null,
              imageKey: null,
              storageType: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        customer: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
    ]);

    const updateOrderMock = vi.mocked(api.orderApi.updateWithItems).mockResolvedValue({
      id: 'order-1',
      campaignId: 'campaign-1',
      userId: 'user-1',
      customerName: 'Test User',
      subtotal: 20,
      shippingFee: 5,
      total: 25,
      isPaid: false,
      isSeparated: false,
      paymentProofUrl: null,
      paymentProofKey: null,
      paymentProofStorageType: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'item-1',
          orderId: 'order-1',
          productId: 'product-1',
          quantity: 2,
          unitPrice: 10,
          subtotal: 20,
          product: {
            id: 'product-1',
            campaignId: 'campaign-1',
            name: 'Product 1',
            price: 10,
            weight: 1,
            imageUrl: null,
            imageKey: null,
            storageType: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ],
      customer: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    const { result } = renderHook(() => useCampaignDetail(), { wrapper });

    // Wait for queries to load
    await waitFor(() => {
      expect(result.current.campaign).toBeDefined();
      expect(result.current.orders?.length).toBe(1);
    });

    // Open edit modal
    await act(async () => {
      result.current.openEditOrderModal(result.current.orders![0]);
    });

    // Change quantity
    await act(async () => {
      result.current.setEditOrderForm({
        ...result.current.editOrderForm,
        items: [{ productId: 'product-1', quantity: 2 }],
      });
    });

    // Fast-forward time to trigger debounced autosave
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should trigger autosave
    await waitFor(() => {
      expect(updateOrderMock).toHaveBeenCalledWith({
        orderId: 'order-1',
        data: {
          items: [{ productId: 'product-1', quantity: 2 }],
        },
      });
    });

    vi.useRealTimers();
  });

  it('should show autosave indicator during save', async () => {
    vi.useFakeTimers();

    // Setup: User already has an order
    vi.mocked(api.orderApi.getByCampaign).mockResolvedValue([
      {
        id: 'order-1',
        campaignId: 'campaign-1',
        userId: 'user-1',
        customerName: 'Test User',
        subtotal: 10,
        shippingFee: 5,
        total: 15,
        isPaid: false,
        isSeparated: false,
        paymentProofUrl: null,
        paymentProofKey: null,
        paymentProofStorageType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'item-1',
            orderId: 'order-1',
            productId: 'product-1',
            quantity: 1,
            unitPrice: 10,
            subtotal: 10,
            product: {
              id: 'product-1',
              campaignId: 'campaign-1',
              name: 'Product 1',
              price: 10,
              weight: 1,
              imageUrl: null,
              imageKey: null,
              storageType: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        customer: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
    ]);

    vi.mocked(api.orderApi.updateWithItems).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({} as any), 1000))
    );

    const { result } = renderHook(() => useCampaignDetail(), { wrapper });

    // Wait for queries to load
    await waitFor(() => {
      expect(result.current.orders?.length).toBe(1);
    });

    // Open edit modal
    await act(async () => {
      result.current.openEditOrderModal(result.current.orders![0]);
    });

    // Change quantity
    await act(async () => {
      result.current.setEditOrderForm({
        ...result.current.editOrderForm,
        items: [{ productId: 'product-1', quantity: 2 }],
      });
    });

    // Fast-forward to trigger autosave
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should show autosaving indicator
    await waitFor(() => {
      expect(result.current.isAutosaving).toBe(true);
    });

    // Complete the save
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should show saved state
    await waitFor(() => {
      expect(result.current.isAutosaving).toBe(false);
      expect(result.current.lastSaved).toBeDefined();
    });

    vi.useRealTimers();
  });

  it('should debounce rapid changes', async () => {
    vi.useFakeTimers();

    // Setup: User already has an order
    vi.mocked(api.orderApi.getByCampaign).mockResolvedValue([
      {
        id: 'order-1',
        campaignId: 'campaign-1',
        userId: 'user-1',
        customerName: 'Test User',
        subtotal: 10,
        shippingFee: 5,
        total: 15,
        isPaid: false,
        isSeparated: false,
        paymentProofUrl: null,
        paymentProofKey: null,
        paymentProofStorageType: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            id: 'item-1',
            orderId: 'order-1',
            productId: 'product-1',
            quantity: 1,
            unitPrice: 10,
            subtotal: 10,
            product: {
              id: 'product-1',
              campaignId: 'campaign-1',
              name: 'Product 1',
              price: 10,
              weight: 1,
              imageUrl: null,
              imageKey: null,
              storageType: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        ],
        customer: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
    ]);

    const updateOrderMock = vi.mocked(api.orderApi.updateWithItems).mockResolvedValue({} as any);

    const { result } = renderHook(() => useCampaignDetail(), { wrapper });

    // Wait for queries to load
    await waitFor(() => {
      expect(result.current.orders?.length).toBe(1);
    });

    // Open edit modal
    await act(async () => {
      result.current.openEditOrderModal(result.current.orders![0]);
    });

    // Make rapid changes
    await act(async () => {
      result.current.setEditOrderForm({
        ...result.current.editOrderForm,
        items: [{ productId: 'product-1', quantity: 2 }],
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    await act(async () => {
      result.current.setEditOrderForm({
        ...result.current.editOrderForm,
        items: [{ productId: 'product-1', quantity: 3 }],
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    await act(async () => {
      result.current.setEditOrderForm({
        ...result.current.editOrderForm,
        items: [{ productId: 'product-1', quantity: 4 }],
      });
    });

    // Fast-forward past debounce
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should only call update once with the final value
    await waitFor(() => {
      expect(updateOrderMock).toHaveBeenCalledTimes(1);
      expect(updateOrderMock).toHaveBeenCalledWith({
        orderId: 'order-1',
        data: {
          items: [{ productId: 'product-1', quantity: 4 }],
        },
      });
    });

    vi.useRealTimers();
  });
});
