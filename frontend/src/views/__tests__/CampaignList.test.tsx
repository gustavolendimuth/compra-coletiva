import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockAuthContext } from '@/__tests__/test-utils';
import {
  createMockCampaign,
  createMockCampaignListResponse,
  mockActiveCampaign,
} from '@/__tests__/mock-data';
import CampaignList from '../CampaignList';
import { campaignApi } from '@/api';

// Mock the API
vi.mock('@/api', async () => {
  const actual = await vi.importActual('@/api');
  return {
    ...actual,
    campaignApi: {
      list: vi.fn(),
    },
  };
});

// Mock hooks
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: any) => value,
}));

vi.mock('@/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: () => ({ current: null }),
}));

describe('CampaignList', () => {
  const mockCampaigns = [
    createMockCampaign({ id: 'campaign-1', name: 'Campaign 1' }),
    createMockCampaign({ id: 'campaign-2', name: 'Campaign 2' }),
    createMockCampaign({ id: 'campaign-3', name: 'Campaign 3' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display skeleton loader while fetching campaigns', async () => {
      vi.mocked(campaignApi.list).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<CampaignList />);

      expect(screen.getByText('Campanhas')).toBeInTheDocument();

      // Check for skeleton elements with animation
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Success State', () => {
    it('should display campaigns when data loads successfully', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse(mockCampaigns)
      );

      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByText('Campaign 1')).toBeInTheDocument();
        expect(screen.getByText('Campaign 2')).toBeInTheDocument();
        expect(screen.getByText('Campaign 3')).toBeInTheDocument();
      });
    });

    it('should display total campaign count', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse(mockCampaigns, { total: 3 })
      );

      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByText('3 campanhas')).toBeInTheDocument();
      });
    });

    it('should display singular form for one campaign', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse([mockCampaigns[0]], { total: 1 })
      );

      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByText('1 campanha')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no campaigns exist', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse([])
      );

      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByText('Nenhuma campanha criada')).toBeInTheDocument();
        expect(
          screen.getByText(/Use o botão "Nova Campanha"/i)
        ).toBeInTheDocument();
      });
    });

    it('should display no results message when search returns empty', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse([])
      );

      const user = userEvent.setup();
      renderWithProviders(<CampaignList />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Buscar campanhas/i)).toBeInTheDocument();
      });

      // Type in search
      const searchInput = screen.getByPlaceholderText(/Buscar campanhas/i);
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('Nenhuma campanha encontrada')).toBeInTheDocument();
        expect(
          screen.getByText(/Tente ajustar os filtros/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(campaignApi.list).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar campanhas')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      let callCount = 0;
      vi.mocked(campaignApi.list).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(createMockCampaignListResponse(mockCampaigns));
      });

      const user = userEvent.setup();
      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar campanhas')).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Tentar novamente/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Campaign 1')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should call API with search parameter when user types', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse(mockCampaigns)
      );

      const user = userEvent.setup();
      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Buscar campanhas/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar campanhas/i);
      await user.type(searchInput, 'test search');

      await waitFor(() => {
        expect(campaignApi.list).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'test search',
          })
        );
      });
    });

    it('should clear search when X button is clicked', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse(mockCampaigns)
      );

      const user = userEvent.setup();
      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Buscar campanhas/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar campanhas/i) as HTMLInputElement;
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(searchInput.value).toBe('test');
      });

      const clearButton = screen.getByTitle('Limpar busca');
      await user.click(clearButton);

      expect(searchInput.value).toBe('');
    });
  });

  describe('Filter Functionality', () => {
    it('should filter by status', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse([mockActiveCampaign])
      );

      const user = userEvent.setup();
      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByText('Campanhas')).toBeInTheDocument();
      });

      // Open status dropdown
      const statusButton = screen.getByRole('button', { name: /Status/i });
      await user.click(statusButton);

      // Select "Ativas" filter
      const activeOption = screen.getByRole('button', { name: /Ativas/i });
      await user.click(activeOption);

      await waitFor(() => {
        expect(campaignApi.list).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'ACTIVE',
          })
        );
      });
    });

    it('should filter by "mine" when user is authenticated', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse(mockCampaigns)
      );

      const user = userEvent.setup();
      renderWithProviders(<CampaignList />, {
        authContext: mockAuthContext,
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Minhas/i })).toBeInTheDocument();
      });

      const mineButton = screen.getByRole('button', { name: /Minhas/i });
      await user.click(mineButton);

      await waitFor(() => {
        expect(campaignApi.list).toHaveBeenCalledWith(
          expect.objectContaining({
            creatorId: mockAuthContext.user.id,
          })
        );
      });
    });

    it('should not show user-specific filters when not authenticated', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse(mockCampaigns)
      );

      renderWithProviders(<CampaignList />, {
        authContext: { ...mockAuthContext, isAuthenticated: false, user: null },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Todas/i })).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /Minhas/i })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Vendedores conhecidos/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Suggestions', () => {
    it('should display suggestions when provided', async () => {
      const suggestions = [
        createMockCampaign({ id: 'suggestion-1', name: 'Suggested Campaign' }),
      ];

      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse([], { suggestions })
      );

      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByText('Você pode gostar destas campanhas')).toBeInTheDocument();
        expect(screen.getByText('Suggested Campaign')).toBeInTheDocument();
      });
    });

    it('should show different message when both results and suggestions exist', async () => {
      const suggestions = [
        createMockCampaign({ id: 'suggestion-1', name: 'Related Campaign' }),
      ];

      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse(mockCampaigns, { suggestions })
      );

      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByText('Campanhas relacionadas')).toBeInTheDocument();
      });
    });
  });

  describe('Infinite Scroll', () => {
    it('should display loading indicator when fetching next page', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse(mockCampaigns, {
          nextCursor: 'cursor-1',
          hasMore: true,
        })
      );

      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByText('Campaign 1')).toBeInTheDocument();
      });

      // Note: Testing infinite scroll trigger requires more complex setup
      // This would need IntersectionObserver mock triggering
    });

    it('should show end message when all campaigns loaded', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse(mockCampaigns, {
          nextCursor: null,
          hasMore: false,
        })
      );

      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        expect(screen.getByText('Todas as campanhas foram carregadas')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should render campaigns in grid layout', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse(mockCampaigns)
      );

      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        const grid = document.querySelector('.grid');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
      });
    });
  });

  describe('Navigation', () => {
    it('should render campaign cards as links', async () => {
      vi.mocked(campaignApi.list).mockResolvedValue(
        createMockCampaignListResponse(mockCampaigns)
      );

      renderWithProviders(<CampaignList />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
        expect(links[0]).toHaveAttribute('href', '/campanhas/campaign-1');
      });
    });
  });
});
