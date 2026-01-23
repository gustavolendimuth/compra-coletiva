import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShippingTab } from '../ShippingTab';
import { createMockCampaign } from '@/__tests__/mock-data';

// Mock IconButton component
vi.mock('@/components/IconButton', () => ({
  default: ({ onClick, children, icon, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe('ShippingTab', () => {
  const mockCampaign = createMockCampaign({
    id: 'campaign-1',
    shippingCost: 50.0,
  });

  const mockOnEditShipping = vi.fn();

  const defaultProps = {
    campaign: mockCampaign,
    isActive: true,
    canEditCampaign: true,
    onEditShipping: mockOnEditShipping,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render shipping tab header', () => {
      render(<ShippingTab {...defaultProps} />);

      expect(screen.getByText('Frete Total da Campanha')).toBeInTheDocument();
    });

    it('should render truck icon', () => {
      const { container } = render(<ShippingTab {...defaultProps} />);

      // Check for SVG icon
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should render description text', () => {
      render(<ShippingTab {...defaultProps} />);

      expect(
        screen.getByText(/o frete será distribuído proporcionalmente ao peso de cada pedido/i)
      ).toBeInTheDocument();
    });

    it('should render shipping cost label', () => {
      render(<ShippingTab {...defaultProps} />);

      expect(screen.getByText('Valor Total do Frete')).toBeInTheDocument();
    });
  });

  describe('Shipping Cost Display', () => {
    it('should display shipping cost value', () => {
      render(<ShippingTab {...defaultProps} />);

      expect(screen.getByText('R$ 50,00')).toBeInTheDocument();
    });

    it('should display zero shipping cost', () => {
      render(
        <ShippingTab
          {...defaultProps}
          campaign={createMockCampaign({ shippingCost: 0 })}
        />
      );

      expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
    });

    it('should display large shipping cost', () => {
      render(
        <ShippingTab
          {...defaultProps}
          campaign={createMockCampaign({ shippingCost: 999.99 })}
        />
      );

      expect(screen.getByText('R$ 999,99')).toBeInTheDocument();
    });

    it('should display shipping cost with decimal places', () => {
      render(
        <ShippingTab
          {...defaultProps}
          campaign={createMockCampaign({ shippingCost: 123.45 })}
        />
      );

      expect(screen.getByText('R$ 123,45')).toBeInTheDocument();
    });
  });

  describe('Edit Button', () => {
    it('should render edit button when campaign is active and user can edit', () => {
      render(<ShippingTab {...defaultProps} isActive={true} canEditCampaign={true} />);

      expect(screen.getByRole('button', { name: /editar frete/i })).toBeInTheDocument();
    });

    it('should not render edit button when campaign is not active', () => {
      render(<ShippingTab {...defaultProps} isActive={false} canEditCampaign={true} />);

      expect(screen.queryByRole('button', { name: /editar frete/i })).not.toBeInTheDocument();
    });

    it('should not render edit button when user cannot edit campaign', () => {
      render(<ShippingTab {...defaultProps} isActive={true} canEditCampaign={false} />);

      expect(screen.queryByRole('button', { name: /editar frete/i })).not.toBeInTheDocument();
    });

    it('should not render edit button when campaign is inactive and user cannot edit', () => {
      render(<ShippingTab {...defaultProps} isActive={false} canEditCampaign={false} />);

      expect(screen.queryByRole('button', { name: /editar frete/i })).not.toBeInTheDocument();
    });

    it('should call onEditShipping when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ShippingTab {...defaultProps} isActive={true} canEditCampaign={true} />);

      const editButton = screen.getByRole('button', { name: /editar frete/i });
      await user.click(editButton);

      expect(mockOnEditShipping).toHaveBeenCalledTimes(1);
    });
  });

  describe('How It Works Section', () => {
    it('should render how it works header', () => {
      render(<ShippingTab {...defaultProps} />);

      expect(screen.getByText('Como funciona a distribuição?')).toBeInTheDocument();
    });

    it('should render weight-based calculation explanation', () => {
      render(<ShippingTab {...defaultProps} />);

      expect(
        screen.getByText(/o frete é calculado com base no peso total de cada pedido/i)
      ).toBeInTheDocument();
    });

    it('should render proportional distribution explanation', () => {
      render(<ShippingTab {...defaultProps} />);

      expect(
        screen.getByText(/pedidos mais pesados pagam proporcionalmente mais frete/i)
      ).toBeInTheDocument();
    });

    it('should render auto-recalculation explanation', () => {
      render(<ShippingTab {...defaultProps} />);

      expect(
        screen.getByText(/a distribuição é recalculada automaticamente quando há mudanças nos pedidos/i)
      ).toBeInTheDocument();
    });

    it('should render all three explanation bullet points', () => {
      const { container } = render(<ShippingTab {...defaultProps} />);

      const bulletPoints = container.querySelectorAll('li');
      expect(bulletPoints).toHaveLength(3);
    });
  });

  describe('Layout and Styling', () => {
    it('should have centered max-width container', () => {
      const { container } = render(<ShippingTab {...defaultProps} />);

      const maxWidthContainer = container.querySelector('.max-w-2xl');
      expect(maxWidthContainer).toBeInTheDocument();
      expect(maxWidthContainer).toHaveClass('mx-auto');
    });

    it('should have bottom padding for mobile navigation', () => {
      const { container } = render(<ShippingTab {...defaultProps} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('pb-20');
    });

    it('should apply card styling', () => {
      const { container } = render(<ShippingTab {...defaultProps} />);

      const cardElements = container.querySelectorAll('[class*="bg-white"]');
      expect(cardElements.length).toBeGreaterThan(0);
    });

    it('should have highlighted shipping cost display', () => {
      const { container } = render(<ShippingTab {...defaultProps} />);

      const highlightedSection = container.querySelector('.bg-gray-50');
      expect(highlightedSection).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ShippingTab {...defaultProps} />);

      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      const h3Elements = screen.getAllByRole('heading', { level: 3 });

      expect(h2Elements.length).toBeGreaterThan(0);
      expect(h3Elements.length).toBeGreaterThan(0);
    });

    it('should have accessible edit button', () => {
      render(<ShippingTab {...defaultProps} isActive={true} canEditCampaign={true} />);

      const editButton = screen.getByRole('button', { name: /editar frete/i });
      expect(editButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined shipping cost gracefully', () => {
      const campaignWithUndefinedShipping = { ...mockCampaign, shippingCost: undefined as any };
      render(<ShippingTab {...defaultProps} campaign={campaignWithUndefinedShipping} />);

      // Should render NaN as R$ NaN (or handle it gracefully)
      // This test ensures the component doesn't crash
      expect(screen.getByText('Valor Total do Frete')).toBeInTheDocument();
    });

    it('should handle null campaign gracefully', () => {
      // This would be a programming error, but let's ensure it doesn't crash
      const { container } = render(<ShippingTab {...defaultProps} campaign={null as any} />);
      expect(container).toBeInTheDocument();
    });

    it('should handle very small shipping costs', () => {
      render(
        <ShippingTab
          {...defaultProps}
          campaign={createMockCampaign({ shippingCost: 0.01 })}
        />
      );

      expect(screen.getByText('R$ 0,01')).toBeInTheDocument();
    });

    it('should handle very large shipping costs', () => {
      render(
        <ShippingTab
          {...defaultProps}
          campaign={createMockCampaign({ shippingCost: 99999.99 })}
        />
      );

      expect(screen.getByText('R$ 99.999,99')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have mobile-responsive padding', () => {
      const { container } = render(<ShippingTab {...defaultProps} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('pb-20', 'md:pb-0');
    });

    it('should center content on larger screens', () => {
      const { container } = render(<ShippingTab {...defaultProps} />);

      const centeredContainer = container.querySelector('.max-w-2xl.mx-auto');
      expect(centeredContainer).toBeInTheDocument();
    });
  });
});
