import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabNavigation } from '../TabNavigation';

describe('TabNavigation', () => {
  const mockOnTabChange = vi.fn();

  const defaultProps = {
    activeTab: 'overview' as const,
    onTabChange: mockOnTabChange,
    canEditCampaign: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all base tabs', () => {
      render(<TabNavigation {...defaultProps} />);

      // Desktop tabs - there are duplicates for mobile/desktop so we use getAllByRole
      const allButtons = screen.getAllByRole('button');
      const buttonTexts = allButtons.map(btn => btn.textContent);

      // Check that each tab type exists (either desktop or mobile version)
      expect(buttonTexts.some(text => text?.includes('Geral') || text?.includes('Visão Geral'))).toBe(true);
      expect(buttonTexts.some(text => text === 'Pedidos')).toBe(true);
      expect(buttonTexts.some(text => text === 'Produtos')).toBe(true);
      expect(buttonTexts.some(text => text === 'Frete')).toBe(true);
    });

    it('should not render moderar tab when user cannot edit campaign', () => {
      render(<TabNavigation {...defaultProps} canEditCampaign={false} />);

      expect(screen.queryByRole('button', { name: /moderar/i })).not.toBeInTheDocument();
    });

    it('should render moderar tab when user can edit campaign', () => {
      render(<TabNavigation {...defaultProps} canEditCampaign={true} />);

      const moderarTabs = screen.getAllByRole('button', { name: /moderar/i });
      expect(moderarTabs.length).toBeGreaterThan(0);
    });

    it('should render icons for each tab', () => {
      render(<TabNavigation {...defaultProps} />);

      // Check that SVG icons are present
      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('Active Tab Styling', () => {
    it('should highlight active tab', () => {
      render(<TabNavigation {...defaultProps} activeTab="products" />);

      const productsTabs = screen.getAllByRole('button', { name: /produtos/i });
      const desktopTab = productsTabs[0]; // Desktop tab is first
      expect(desktopTab).toHaveClass('text-primary-600');
      expect(desktopTab).toHaveClass('border-primary-600');
    });

    it('should not highlight inactive tabs', () => {
      render(<TabNavigation {...defaultProps} activeTab="products" />);

      const overviewTabs = screen.getAllByRole('button', { name: /visão geral/i });
      const desktopTab = overviewTabs[0];
      expect(desktopTab).toHaveClass('text-gray-600');
      expect(desktopTab).not.toHaveClass('text-primary-600');
    });
  });

  describe('Tab Interaction', () => {
    it('should call onTabChange when overview tab is clicked', async () => {
      const user = userEvent.setup();
      render(<TabNavigation {...defaultProps} activeTab="products" />);

      const overviewTabs = screen.getAllByRole('button', { name: /visão geral/i });
      await user.click(overviewTabs[0]); // Click first (desktop) tab

      expect(mockOnTabChange).toHaveBeenCalledWith('overview');
    });

    it('should call onTabChange when products tab is clicked', async () => {
      const user = userEvent.setup();
      render(<TabNavigation {...defaultProps} />);

      const productsTabs = screen.getAllByRole('button', { name: /produtos/i });
      await user.click(productsTabs[0]); // Click first (desktop) tab

      expect(mockOnTabChange).toHaveBeenCalledWith('products');
    });

    it('should call onTabChange when orders tab is clicked', async () => {
      const user = userEvent.setup();
      render(<TabNavigation {...defaultProps} />);

      const ordersTabs = screen.getAllByRole('button', { name: /pedidos/i });
      await user.click(ordersTabs[0]); // Click first (desktop) tab

      expect(mockOnTabChange).toHaveBeenCalledWith('orders');
    });

    it('should call onTabChange when shipping tab is clicked', async () => {
      const user = userEvent.setup();
      render(<TabNavigation {...defaultProps} />);

      const shippingTabs = screen.getAllByRole('button', { name: /frete/i });
      await user.click(shippingTabs[0]); // Click first (desktop) tab

      expect(mockOnTabChange).toHaveBeenCalledWith('shipping');
    });

    it('should call onTabChange when questions tab is clicked (if visible)', async () => {
      const user = userEvent.setup();
      render(<TabNavigation {...defaultProps} canEditCampaign={true} />);

      const questionsTabs = screen.getAllByRole('button', { name: /moderar/i });
      await user.click(questionsTabs[0]); // Click first (desktop) tab

      expect(mockOnTabChange).toHaveBeenCalledWith('questions');
    });
  });

  describe('Responsive Behavior', () => {
    it('should have desktop-specific classes', () => {
      render(<TabNavigation {...defaultProps} />);

      // Desktop tabs container
      const desktopContainer = document.querySelector('.hidden.md\\:flex');
      expect(desktopContainer).toBeInTheDocument();
    });

    it('should have mobile-specific classes', () => {
      render(<TabNavigation {...defaultProps} />);

      // Mobile tabs container (fixed bottom)
      const mobileContainer = document.querySelector('.md\\:hidden.fixed.bottom-0');
      expect(mobileContainer).toBeInTheDocument();
    });

    it('should render short labels for mobile tabs', () => {
      render(<TabNavigation {...defaultProps} />);

      // Mobile uses "Geral" instead of "Visão Geral"
      // Check for both desktop and mobile versions
      const buttons = screen.getAllByRole('button');
      const hasShortLabels = buttons.some(btn => btn.textContent?.includes('Geral'));
      const hasLongLabels = buttons.some(btn => btn.textContent?.includes('Visão Geral'));

      expect(hasShortLabels).toBe(true);
      expect(hasLongLabels).toBe(true);
    });
  });

  describe('Tab Order', () => {
    it('should render tabs in correct order', () => {
      render(<TabNavigation {...defaultProps} canEditCampaign={true} />);

      const buttons = screen.getAllByRole('button');
      const labels = buttons.map(btn => btn.textContent);

      // Desktop tabs are rendered first, then mobile tabs
      // We'll check that the pattern exists in correct order
      const overviewIndex = labels.findIndex(l => l?.includes('Visão Geral'));
      const ordersIndex = labels.findIndex(l => l === 'Pedidos');
      const productsIndex = labels.findIndex(l => l === 'Produtos');
      const shippingIndex = labels.findIndex(l => l === 'Frete');
      const questionsIndex = labels.findIndex(l => l === 'Moderar');

      expect(overviewIndex).toBeLessThan(ordersIndex);
      expect(ordersIndex).toBeLessThan(productsIndex);
      expect(productsIndex).toBeLessThan(shippingIndex);
      expect(shippingIndex).toBeLessThan(questionsIndex);
    });
  });

  describe('Accessibility', () => {
    it('should have button role for all tabs', () => {
      render(<TabNavigation {...defaultProps} canEditCampaign={true} />);

      // All tabs should be buttons (desktop + mobile versions)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(10); // Desktop (5) + Mobile (5)
    });

    it('should have readable tab labels', () => {
      render(<TabNavigation {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const buttonTexts = buttons.map(btn => btn.textContent);

      // Check labels exist (either desktop or mobile version)
      expect(buttonTexts.some(text => text?.includes('Geral') || text?.includes('Visão Geral'))).toBe(true);
      expect(buttonTexts.some(text => text === 'Pedidos')).toBe(true);
      expect(buttonTexts.some(text => text === 'Produtos')).toBe(true);
      expect(buttonTexts.some(text => text === 'Frete')).toBe(true);
    });
  });

  describe('Visual Feedback', () => {
    it('should apply hover styles to inactive tabs', () => {
      render(<TabNavigation {...defaultProps} activeTab="overview" />);

      const productsTabs = screen.getAllByRole('button', { name: /produtos/i });
      const desktopTab = productsTabs[0];
      expect(desktopTab).toHaveClass('hover:text-gray-900');
    });

    it('should have different background for active tab', () => {
      render(<TabNavigation {...defaultProps} activeTab="products" />);

      const productsTabs = screen.getAllByRole('button', { name: /produtos/i });
      const desktopTab = productsTabs[0];
      expect(desktopTab).toHaveClass('bg-primary-50');
    });
  });

  describe('Mobile Tab Styling', () => {
    it('should apply yellow accent for active mobile tabs', () => {
      render(<TabNavigation {...defaultProps} activeTab="products" />);

      // Mobile tabs have different styling with yellow accent
      const mobileContainer = document.querySelector('.md\\:hidden.fixed.bottom-0');
      expect(mobileContainer).toBeInTheDocument();
      expect(mobileContainer).toHaveClass('bg-primary-600');
    });

    it('should have fixed positioning for mobile tabs', () => {
      render(<TabNavigation {...defaultProps} />);

      const mobileContainer = document.querySelector('.md\\:hidden.fixed.bottom-0');
      expect(mobileContainer).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
    });
  });
});
