import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useCampaignDetail } from '../useCampaignDetail';
import { campaignApi, productApi, orderApi, analyticsApi } from '@/api';
import { createMockCampaign, createMockProduct, createMockOrder, createMockAnalytics } from '@/__tests__/mock-data';

// Mock modules
vi.mock('@/api');
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useCampaignDetail', () => {
  let queryClient: QueryClient;

  const mockCampaign = createMockCampaign({ id: 'campaign-1', creatorId: 'user-1', status: 'ACTIVE' });
  const mockProducts = [createMockProduct({ id: 'product-1' })];
  const mockOrders = [createMockOrder({ id: 'order-1' })];
  const mockAnalytics = createMockAnalytics();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup default mocks
    vi.mocked(campaignApi.getById).mockResolvedValue(mockCampaign);
    vi.mocked(productApi.getByCampaign).mockResolvedValue(mockProducts);
    vi.mocked(orderApi.getByCampaign).mockResolvedValue(mockOrders);
    vi.mocked(analyticsApi.getByCampaign).mockResolvedValue(mockAnalytics);
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/campaign/campaign-1']}>
        <Routes>
          <Route path="/campaign/:id" element={<div>{children}</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  describe('Data Fetching', () => {
    it('should fetch campaign data on mount', async () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.campaign).toEqual(mockCampaign);
      });

      expect(campaignApi.getById).toHaveBeenCalledWith('campaign-1');
    });

    it('should fetch products data on mount', async () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.products).toEqual(mockProducts);
      });

      expect(productApi.getByCampaign).toHaveBeenCalledWith('campaign-1');
    });

    it('should fetch orders data on mount', async () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.orders).toEqual(mockOrders);
      });

      expect(orderApi.getByCampaign).toHaveBeenCalledWith('campaign-1');
    });

    it('should fetch analytics data on mount', async () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.analytics).toEqual(mockAnalytics);
      });

      expect(analyticsApi.getByCampaign).toHaveBeenCalledWith('campaign-1');
    });
  });

  describe('Computed States', () => {
    it('should correctly compute isActive when campaign is ACTIVE', async () => {
      vi.mocked(campaignApi.getById).mockResolvedValue({ ...mockCampaign, status: 'ACTIVE' });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.isActive).toBe(true);
      });
    });

    it('should correctly compute isActive when campaign is CLOSED', async () => {
      vi.mocked(campaignApi.getById).mockResolvedValue({ ...mockCampaign, status: 'CLOSED' });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.isActive).toBe(false);
      });
    });

    it('should correctly compute isClosed', async () => {
      vi.mocked(campaignApi.getById).mockResolvedValue({ ...mockCampaign, status: 'CLOSED' });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.isClosed).toBe(true);
      });
    });

    it('should correctly compute isSent', async () => {
      vi.mocked(campaignApi.getById).mockResolvedValue({ ...mockCampaign, status: 'SENT' });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSent).toBe(true);
      });
    });

    it('should correctly compute canEditCampaign when user is creator', async () => {
      vi.mocked(campaignApi.getById).mockResolvedValue({ ...mockCampaign, creatorId: 'user-1' });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.canEditCampaign).toBe(true);
      });
    });

    it('should correctly compute canEditCampaign when user is not creator', async () => {
      vi.mocked(campaignApi.getById).mockResolvedValue({ ...mockCampaign, creatorId: 'other-user' });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.canEditCampaign).toBe(false);
      });
    });
  });

  describe('Modal States', () => {
    it('should initialize all modal states as closed', () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      expect(result.current.isProductModalOpen).toBe(false);
      expect(result.current.isEditProductModalOpen).toBe(false);
      expect(result.current.isOrderModalOpen).toBe(false);
      expect(result.current.isEditOrderModalOpen).toBe(false);
      expect(result.current.isViewOrderModalOpen).toBe(false);
      expect(result.current.isShippingModalOpen).toBe(false);
      expect(result.current.isEditDeadlineModalOpen).toBe(false);
      expect(result.current.isCloseConfirmOpen).toBe(false);
      expect(result.current.isReopenConfirmOpen).toBe(false);
      expect(result.current.isSentConfirmOpen).toBe(false);
    });

    it('should open product modal when setIsProductModalOpen is called', () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      act(() => {
        result.current.setIsProductModalOpen(true);
      });

      expect(result.current.isProductModalOpen).toBe(true);
    });

    it('should open shipping modal when setIsShippingModalOpen is called', () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      act(() => {
        result.current.setIsShippingModalOpen(true);
      });

      expect(result.current.isShippingModalOpen).toBe(true);
    });
  });

  describe('Form States', () => {
    it('should initialize product form with empty values', () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      expect(result.current.productForm).toEqual({
        campaignId: 'campaign-1',
        name: '',
        price: 0,
        weight: 0,
        imageUrl: '',
      });
    });

    it('should initialize order form with empty values', () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      expect(result.current.orderForm).toEqual({
        campaignId: 'campaign-1',
        customerName: '',
        items: [],
      });
    });

    it('should update product form when setProductForm is called', () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      act(() => {
        result.current.setProductForm({
          campaignId: 'campaign-1',
          name: 'New Product',
          price: 99.99,
          weight: 500,
          imageUrl: '',
        });
      });

      expect(result.current.productForm.name).toBe('New Product');
      expect(result.current.productForm.price).toBe(99.99);
      expect(result.current.productForm.weight).toBe(500);
    });
  });

  describe('Sorted and Filtered Data', () => {
    it('should sort products alphabetically', async () => {
      const products = [
        createMockProduct({ id: 'p1', name: 'Zebra' }),
        createMockProduct({ id: 'p2', name: 'Apple' }),
        createMockProduct({ id: 'p3', name: 'Banana' }),
      ];
      vi.mocked(productApi.getByCampaign).mockResolvedValue(products);

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.alphabeticalProducts).toBeDefined();
        expect(result.current.alphabeticalProducts?.[0].name).toBe('Apple');
        expect(result.current.alphabeticalProducts?.[1].name).toBe('Banana');
        expect(result.current.alphabeticalProducts?.[2].name).toBe('Zebra');
      });
    });

    it('should filter orders by search term', async () => {
      const orders = [
        createMockOrder({ id: 'o1', customerName: 'Alice' }),
        createMockOrder({ id: 'o2', customerName: 'Bob' }),
        createMockOrder({ id: 'o3', customerName: 'Charlie' }),
      ];
      vi.mocked(orderApi.getByCampaign).mockResolvedValue(orders);

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.orders).toHaveLength(3);
      });

      act(() => {
        result.current.setOrderSearch('ali');
      });

      await waitFor(() => {
        expect(result.current.filteredOrders).toHaveLength(1);
        expect(result.current.filteredOrders[0].customerName).toBe('Alice');
      });
    });

    it('should sort orders by customerName ascending', async () => {
      const orders = [
        createMockOrder({ id: 'o1', customerName: 'Charlie' }),
        createMockOrder({ id: 'o2', customerName: 'Alice' }),
        createMockOrder({ id: 'o3', customerName: 'Bob' }),
      ];
      vi.mocked(orderApi.getByCampaign).mockResolvedValue(orders);

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.filteredOrders).toBeDefined();
        expect(result.current.filteredOrders[0].customerName).toBe('Alice');
        expect(result.current.filteredOrders[1].customerName).toBe('Bob');
        expect(result.current.filteredOrders[2].customerName).toBe('Charlie');
      });
    });

    it('should change sort direction when handleSort is called with same field', async () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.orderSortDirection).toBe('asc');
      });

      act(() => {
        result.current.handleSort('customerName');
      });

      expect(result.current.orderSortDirection).toBe('desc');

      act(() => {
        result.current.handleSort('customerName');
      });

      expect(result.current.orderSortDirection).toBe('asc');
    });
  });

  describe('Product Handlers', () => {
    it('should open edit product modal with product data', async () => {
      const product = createMockProduct({ id: 'p1', name: 'Test Product', price: 50, weight: 200 });
      vi.mocked(productApi.getByCampaign).mockResolvedValue([product]);

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.products).toHaveLength(1);
      });

      act(() => {
        result.current.openEditProductModal(product);
      });

      expect(result.current.isEditProductModalOpen).toBe(true);
      expect(result.current.editingProduct).toEqual(product);
      expect(result.current.editProductForm).toEqual({
        name: 'Test Product',
        price: 50,
        weight: 200,
        imageUrl: '',
      });
    });

    it('should call handleDeleteProduct with confirmation', async () => {
      global.confirm = vi.fn(() => true);
      vi.mocked(productApi.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      act(() => {
        result.current.handleDeleteProduct('product-1');
      });

      expect(global.confirm).toHaveBeenCalled();

      // Wait for the async delete to be called
      await waitFor(() => {
        expect(productApi.delete).toHaveBeenCalledWith('product-1');
      });
    });

    it('should not delete product when user cancels confirmation', () => {
      global.confirm = vi.fn(() => false);

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      act(() => {
        result.current.handleDeleteProduct('product-1');
      });

      expect(global.confirm).toHaveBeenCalled();
      expect(productApi.delete).not.toHaveBeenCalled();
    });
  });

  describe('Order Handlers', () => {
    it('should open edit order modal with order data', async () => {
      const order = createMockOrder({
        id: 'o1',
        customerName: 'Test Customer',
        items: [
          { id: 'item-1', productId: 'p1', quantity: 2, unitPrice: 50, subtotal: 100, orderId: 'o1', product: createMockProduct({ id: 'p1' }) },
        ],
      });
      vi.mocked(orderApi.getByCampaign).mockResolvedValue([order]);

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.orders).toHaveLength(1);
      });

      act(() => {
        result.current.openEditOrderModal(order);
      });

      expect(result.current.isEditOrderModalOpen).toBe(true);
      expect(result.current.editingOrder).toEqual(order);
      expect(result.current.editOrderForm.customerName).toBe('Test Customer');
      expect(result.current.editOrderForm.items).toEqual([
        { productId: 'p1', quantity: 2 },
      ]);
    });

    it('should toggle payment status', async () => {
      const order = createMockOrder({ id: 'o1', isPaid: false });
      vi.mocked(orderApi.getByCampaign).mockResolvedValue([order]);
      vi.mocked(orderApi.update).mockResolvedValue({ ...order, isPaid: true });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.orders).toHaveLength(1);
      });

      act(() => {
        result.current.handleTogglePayment(order);
      });

      await waitFor(() => {
        expect(orderApi.update).toHaveBeenCalledWith('o1', { isPaid: true });
      });
    });

    it('should handle close order modal and reset form', () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      act(() => {
        result.current.setOrderForm({
          campaignId: 'campaign-1',
          customerName: 'Test',
          items: [{ productId: 'p1', quantity: 1 }],
        });
        result.current.setIsOrderModalOpen(true);
      });

      expect(result.current.isOrderModalOpen).toBe(true);

      act(() => {
        result.current.handleCloseOrderModal();
      });

      expect(result.current.isOrderModalOpen).toBe(false);
      expect(result.current.orderForm).toEqual({
        campaignId: 'campaign-1',
        customerName: '',
        items: [],
      });
    });
  });

  describe('Campaign Update Handlers', () => {
    it('should handle name save', async () => {
      vi.mocked(campaignApi.update).mockResolvedValue({ ...mockCampaign, name: 'Updated Name' });
      vi.mocked(campaignApi.getById).mockResolvedValue({ ...mockCampaign, name: 'Updated Name' });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.campaign).toBeDefined();
      });

      act(() => {
        result.current.setEditedName('Updated Name');
        result.current.setIsEditingName(true);
      });

      act(() => {
        result.current.handleNameSave();
      });

      await waitFor(() => {
        expect(campaignApi.update).toHaveBeenCalledWith('campaign-1', { name: 'Updated Name' });
      });
    });

    it('should not save name if unchanged', async () => {
      vi.mocked(campaignApi.getById).mockResolvedValue({ ...mockCampaign, name: 'Test Campaign' });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.campaign).toBeDefined();
      });

      act(() => {
        result.current.setEditedName('Test Campaign');
        result.current.setIsEditingName(true);
      });

      act(() => {
        result.current.handleNameSave();
      });

      expect(campaignApi.update).not.toHaveBeenCalled();
    });

    it('should handle name cancel', () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      act(() => {
        result.current.setEditedName('New Name');
        result.current.setIsEditingName(true);
      });

      act(() => {
        result.current.handleNameCancel();
      });

      expect(result.current.isEditingName).toBe(false);
      expect(result.current.editedName).toBe('');
    });

    it('should handle description save', async () => {
      vi.mocked(campaignApi.update).mockResolvedValue({ ...mockCampaign, description: 'New Description' });
      vi.mocked(campaignApi.getById).mockResolvedValue({ ...mockCampaign, description: 'Old Description' });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.campaign).toBeDefined();
      });

      act(() => {
        result.current.setEditedDescription('New Description');
        result.current.setIsEditingDescription(true);
      });

      act(() => {
        result.current.handleDescriptionSave();
      });

      await waitFor(() => {
        expect(campaignApi.update).toHaveBeenCalledWith('campaign-1', { description: 'New Description' });
      });
    });
  });

  describe('Keyboard Handlers', () => {
    it('should save name on Enter key', async () => {
      vi.mocked(campaignApi.update).mockResolvedValue({ ...mockCampaign, name: 'Updated' });
      vi.mocked(campaignApi.getById).mockResolvedValue({ ...mockCampaign, name: 'Test' });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.campaign).toBeDefined();
      });

      act(() => {
        result.current.setEditedName('Updated');
        result.current.setIsEditingName(true);
      });

      act(() => {
        result.current.handleNameKeyDown({ key: 'Enter' } as React.KeyboardEvent);
      });

      await waitFor(() => {
        expect(campaignApi.update).toHaveBeenCalledWith('campaign-1', { name: 'Updated' });
      });
    });

    it('should cancel name editing on Escape key', () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      act(() => {
        result.current.setEditedName('New Name');
        result.current.setIsEditingName(true);
      });

      act(() => {
        result.current.handleNameKeyDown({ key: 'Escape' } as React.KeyboardEvent);
      });

      expect(result.current.isEditingName).toBe(false);
      expect(result.current.editedName).toBe('');
    });

    it('should cancel description editing on Escape key', () => {
      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      act(() => {
        result.current.setEditedDescription('New Description');
        result.current.setIsEditingDescription(true);
      });

      act(() => {
        result.current.handleDescriptionKeyDown({ key: 'Escape' } as React.KeyboardEvent);
      });

      expect(result.current.isEditingDescription).toBe(false);
      expect(result.current.editedDescription).toBe('');
    });
  });

  describe('Status Handlers', () => {
    it('should handle reopen campaign with orders', async () => {
      const orders = [createMockOrder({ id: 'o1' })];
      vi.mocked(orderApi.getByCampaign).mockResolvedValue(orders);
      vi.mocked(campaignApi.updateStatus).mockResolvedValue({ ...mockCampaign, status: 'CLOSED' });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.orders).toHaveLength(1);
      });

      act(() => {
        result.current.handleReopenCampaign();
      });

      await waitFor(() => {
        expect(campaignApi.updateStatus).toHaveBeenCalledWith('campaign-1', 'CLOSED');
      });
    });

    it('should handle reopen campaign without orders', async () => {
      vi.mocked(orderApi.getByCampaign).mockResolvedValue([]);
      vi.mocked(campaignApi.updateStatus).mockResolvedValue({ ...mockCampaign, status: 'ACTIVE' });

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.orders).toEqual([]);
      });

      act(() => {
        result.current.handleReopenCampaign();
      });

      await waitFor(() => {
        expect(campaignApi.updateStatus).toHaveBeenCalledWith('campaign-1', 'ACTIVE');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing campaignId', () => {
      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={['/campaign/']}>
            <Routes>
              <Route path="/campaign/" element={<div>{children}</div>} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useCampaignDetail(), { wrapper: customWrapper });

      expect(result.current.campaign).toBeUndefined();
    });

    it('should handle empty products list', async () => {
      vi.mocked(productApi.getByCampaign).mockResolvedValue([]);

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.products).toEqual([]);
        expect(result.current.sortedProducts).toEqual([]);
        expect(result.current.alphabeticalProducts).toEqual([]);
      });
    });

    it('should handle empty orders list', async () => {
      vi.mocked(orderApi.getByCampaign).mockResolvedValue([]);

      const { result } = renderHook(() => useCampaignDetail(), { wrapper });

      await waitFor(() => {
        expect(result.current.orders).toEqual([]);
        expect(result.current.filteredOrders).toEqual([]);
      });
    });
  });
});
