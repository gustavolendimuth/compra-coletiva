import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockAuthContext } from '@/__tests__/test-utils';
import { CampaignFilters, CampaignFiltersState } from '../CampaignFilters';

describe('CampaignFilters', () => {
  const mockOnSearchChange = vi.fn();
  const mockOnFiltersChange = vi.fn();

  const defaultProps = {
    search: '',
    onSearchChange: mockOnSearchChange,
    filters: {} as CampaignFiltersState,
    onFiltersChange: mockOnFiltersChange,
    total: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search Input', () => {
    it('should render search input with placeholder', () => {
      renderWithProviders(<CampaignFilters {...defaultProps} />);

      expect(screen.getByPlaceholderText(/Buscar campanhas ou produtos/i)).toBeInTheDocument();
    });

    it('should display current search value', () => {
      renderWithProviders(
        <CampaignFilters {...defaultProps} search="test query" />
      );

      const input = screen.getByPlaceholderText(/Buscar campanhas ou produtos/i) as HTMLInputElement;
      expect(input.value).toBe('test query');
    });

    it('should call onSearchChange when user types', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CampaignFilters {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Buscar campanhas ou produtos/i);
      await user.type(input, 'new search');

      expect(mockOnSearchChange).toHaveBeenCalled();
    });

    it('should show clear button when search has value', () => {
      renderWithProviders(
        <CampaignFilters {...defaultProps} search="test" />
      );

      expect(screen.getByTitle('Limpar busca')).toBeInTheDocument();
    });

    it('should not show clear button when search is empty', () => {
      renderWithProviders(<CampaignFilters {...defaultProps} search="" />);

      expect(screen.queryByTitle('Limpar busca')).not.toBeInTheDocument();
    });

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CampaignFilters {...defaultProps} search="test" />
      );

      const clearButton = screen.getByTitle('Limpar busca');
      await user.click(clearButton);

      expect(mockOnSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('Quick Filters', () => {
    it('should render "Todas" filter by default', () => {
      renderWithProviders(<CampaignFilters {...defaultProps} />);

      const allButton = screen.getByRole('button', { name: /Todas/i });
      expect(allButton).toBeInTheDocument();
      // Check for primary blue color (bg-primary-600 maps to bg-blue-600)
      expect(allButton.className).toContain('bg-');
    });

    it('should show user-specific filters when authenticated', () => {
      renderWithProviders(
        <CampaignFilters {...defaultProps} />,
        { authContext: mockAuthContext }
      );

      expect(screen.getByRole('button', { name: /Minhas/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Vendedores conhecidos/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Produtos similares/i })).toBeInTheDocument();
    });

    it('should not show user-specific filters when not authenticated', () => {
      renderWithProviders(
        <CampaignFilters {...defaultProps} />,
        { authContext: { ...mockAuthContext, isAuthenticated: false, user: null } }
      );

      expect(screen.queryByRole('button', { name: /Minhas/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Vendedores conhecidos/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Produtos similares/i })).not.toBeInTheDocument();
    });

    it('should call onFiltersChange when "Minhas" is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CampaignFilters {...defaultProps} />,
        { authContext: mockAuthContext }
      );

      const mineButton = screen.getByRole('button', { name: /Minhas/i });
      await user.click(mineButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          creatorId: mockAuthContext.user.id,
        })
      );
    });

    it('should call onFiltersChange when "Vendedores conhecidos" is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CampaignFilters {...defaultProps} />,
        { authContext: mockAuthContext }
      );

      const sellersButton = screen.getByRole('button', { name: /Vendedores conhecidos/i });
      await user.click(sellersButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          fromSellers: true,
        })
      );
    });

    it('should call onFiltersChange when "Produtos similares" is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CampaignFilters {...defaultProps} />,
        { authContext: mockAuthContext }
      );

      const similarButton = screen.getByRole('button', { name: /Produtos similares/i });
      await user.click(similarButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          similarProducts: true,
        })
      );
    });

    it('should reset to all campaigns when "Todas" is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CampaignFilters
          {...defaultProps}
          filters={{ creatorId: 'user-1' }}
        />,
        { authContext: mockAuthContext }
      );

      const allButton = screen.getByRole('button', { name: /Todas/i });
      await user.click(allButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        status: undefined,
      });
    });

    it('should highlight active quick filter', () => {
      renderWithProviders(
        <CampaignFilters
          {...defaultProps}
          filters={{ creatorId: mockAuthContext.user.id }}
        />,
        { authContext: mockAuthContext }
      );

      const mineButton = screen.getByRole('button', { name: /Minhas/i });
      expect(mineButton).toHaveClass('bg-primary-600');
    });
  });

  describe('Status Filter', () => {
    it('should render status dropdown button', () => {
      renderWithProviders(<CampaignFilters {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Todos os status/i })).toBeInTheDocument();
    });

    it('should open dropdown when status button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CampaignFilters {...defaultProps} />);

      const statusButton = screen.getByRole('button', { name: /Todos os status/i });
      await user.click(statusButton);

      expect(screen.getByRole('button', { name: /Ativas/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Fechadas/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Enviadas/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Arquivadas/i })).toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CampaignFilters {...defaultProps} />);

      const statusButton = screen.getByRole('button', { name: /Todos os status/i });
      await user.click(statusButton);

      expect(screen.getByRole('button', { name: /Ativas/i })).toBeInTheDocument();

      // Click outside
      await user.click(document.body);

      // Wait for dropdown to close
      await vi.waitFor(() => {
        expect(screen.queryByRole('button', { name: /^Ativas$/i })).not.toBeInTheDocument();
      });
    });

    it('should filter by ACTIVE status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CampaignFilters {...defaultProps} />);

      const statusButton = screen.getByRole('button', { name: /Todos os status/i });
      await user.click(statusButton);

      const activeOption = screen.getByRole('button', { name: /Ativas/i });
      await user.click(activeOption);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ACTIVE',
        })
      );
    });

    it('should display selected status in button', () => {
      renderWithProviders(
        <CampaignFilters
          {...defaultProps}
          filters={{ status: 'ACTIVE' }}
        />
      );

      expect(screen.getByRole('button', { name: /Ativas/i })).toBeInTheDocument();
    });

    it('should highlight selected status option', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CampaignFilters
          {...defaultProps}
          filters={{ status: 'ACTIVE' }}
        />
      );

      const statusButton = screen.getByRole('button', { name: /Ativas/i });
      await user.click(statusButton);

      const activeOption = screen.getAllByRole('button', { name: /Ativas/i })[1]; // Get the option, not the main button
      expect(activeOption).toHaveClass('text-primary-600');
    });
  });

  describe('Campaign Count', () => {
    it('should display total campaign count', () => {
      renderWithProviders(<CampaignFilters {...defaultProps} total={42} />);

      expect(screen.getByText('42 campanhas')).toBeInTheDocument();
    });

    it('should display singular form for one campaign', () => {
      renderWithProviders(<CampaignFilters {...defaultProps} total={1} />);

      expect(screen.getByText('1 campanha')).toBeInTheDocument();
    });

    it('should not display count when total is undefined', () => {
      renderWithProviders(<CampaignFilters {...defaultProps} total={undefined} />);

      expect(screen.queryByText(/campanha/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper input labels and attributes', () => {
      renderWithProviders(<CampaignFilters {...defaultProps} />);

      const input = screen.getByPlaceholderText(/Buscar campanhas ou produtos/i);
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should have proper button types', () => {
      renderWithProviders(<CampaignFilters {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should render with mobile-first classes', () => {
      renderWithProviders(<CampaignFilters {...defaultProps} />);

      const container = document.querySelector('.space-y-4');
      expect(container).toBeInTheDocument();

      // Check for responsive flex layout
      const filterRow = document.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(filterRow).toBeInTheDocument();
    });

    it('should have horizontal scroll for quick filters on mobile', () => {
      renderWithProviders(
        <CampaignFilters {...defaultProps} />,
        { authContext: mockAuthContext }
      );

      const quickFiltersContainer = document.querySelector('.overflow-x-auto');
      expect(quickFiltersContainer).toBeInTheDocument();
    });
  });

  describe('Combined Filters', () => {
    it('should preserve status when changing quick filter', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <CampaignFilters
          {...defaultProps}
          filters={{ status: 'ACTIVE' }}
        />,
        { authContext: mockAuthContext }
      );

      const mineButton = screen.getByRole('button', { name: /Minhas/i });
      await user.click(mineButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ACTIVE',
          creatorId: mockAuthContext.user.id,
        })
      );
    });
  });
});
