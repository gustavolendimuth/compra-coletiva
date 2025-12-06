import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMockCampaign } from '@/__tests__/mock-data';
import { CampaignCardBody } from '../CampaignCardBody';

describe('CampaignCardBody', () => {
  describe('Description Display', () => {
    it('should display campaign description when available', () => {
      const campaign = createMockCampaign({
        description: 'This is a detailed campaign description',
      });
      render(<CampaignCardBody campaign={campaign} />);

      expect(screen.getByText('This is a detailed campaign description')).toBeInTheDocument();
    });

    it('should not display description section when description is missing', () => {
      const campaign = createMockCampaign({ description: undefined });
      render(<CampaignCardBody campaign={campaign} />);

      // Should still render statistics
      expect(screen.getByText(/produtos/i)).toBeInTheDocument();
    });

    it('should truncate long descriptions with line-clamp', () => {
      const longDescription = 'Long description '.repeat(50);
      const campaign = createMockCampaign({ description: longDescription });
      const { container } = render(<CampaignCardBody campaign={campaign} />);

      // Find the paragraph element directly
      const descElement = container.querySelector('.line-clamp-2');
      expect(descElement).toBeInTheDocument();
      expect(descElement).toHaveClass('text-sm', 'text-gray-600');
    });

    it('should style description correctly', () => {
      const campaign = createMockCampaign({
        description: 'Test description',
      });
      render(<CampaignCardBody campaign={campaign} />);

      const desc = screen.getByText('Test description');
      expect(desc).toHaveClass('text-sm', 'text-gray-600');
    });
  });

  describe('Product Count', () => {
    it('should display product count', () => {
      const campaign = createMockCampaign({
        _count: { products: 5, orders: 10 },
      });
      render(<CampaignCardBody campaign={campaign} />);

      expect(screen.getByText('5 produtos')).toBeInTheDocument();
    });

    it('should display zero products', () => {
      const campaign = createMockCampaign({
        _count: { products: 0, orders: 0 },
      });
      render(<CampaignCardBody campaign={campaign} />);

      expect(screen.getByText('0 produtos')).toBeInTheDocument();
    });

    it('should handle missing _count', () => {
      const campaign = createMockCampaign({ _count: undefined });
      render(<CampaignCardBody campaign={campaign} />);

      expect(screen.getByText('0 produtos')).toBeInTheDocument();
    });

    it('should display product icon', () => {
      const campaign = createMockCampaign({
        _count: { products: 5, orders: 10 },
      });
      const { container } = render(<CampaignCardBody campaign={campaign} />);

      // Package icon should be present
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Order Count', () => {
    it('should display order count', () => {
      const campaign = createMockCampaign({
        _count: { products: 5, orders: 10 },
      });
      render(<CampaignCardBody campaign={campaign} />);

      expect(screen.getByText('10 pedidos')).toBeInTheDocument();
    });

    it('should display zero orders', () => {
      const campaign = createMockCampaign({
        _count: { products: 0, orders: 0 },
      });
      render(<CampaignCardBody campaign={campaign} />);

      expect(screen.getByText('0 pedidos')).toBeInTheDocument();
    });

    it('should display users icon', () => {
      const campaign = createMockCampaign({
        _count: { products: 5, orders: 10 },
      });
      const { container } = render(<CampaignCardBody campaign={campaign} />);

      // Users icon should be present
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Statistics Layout', () => {
    it('should display statistics in a flex row', () => {
      const campaign = createMockCampaign({
        _count: { products: 5, orders: 10 },
      });
      const { container } = render(<CampaignCardBody campaign={campaign} />);

      const statsContainer = container.querySelector('.flex.items-center.gap-4');
      expect(statsContainer).toBeInTheDocument();
    });

    it('should have proper spacing between elements', () => {
      const campaign = createMockCampaign({
        description: 'Test',
        _count: { products: 5, orders: 10 },
      });
      const { container } = render(<CampaignCardBody campaign={campaign} />);

      const wrapper = container.querySelector('.space-y-3');
      expect(wrapper).toBeInTheDocument();
    });

    it('should style statistics text correctly', () => {
      const campaign = createMockCampaign({
        _count: { products: 5, orders: 10 },
      });
      const { container } = render(<CampaignCardBody campaign={campaign} />);

      const statsContainer = container.querySelector('.text-sm.text-gray-500');
      expect(statsContainer).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render icons with correct size', () => {
      const campaign = createMockCampaign({
        _count: { products: 5, orders: 10 },
      });
      const { container } = render(<CampaignCardBody campaign={campaign} />);

      const icons = container.querySelectorAll('svg');
      icons.forEach(icon => {
        expect(icon).toHaveClass('w-4', 'h-4');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have readable text contrast', () => {
      const campaign = createMockCampaign({
        description: 'Test description',
        _count: { products: 5, orders: 10 },
      });
      render(<CampaignCardBody campaign={campaign} />);

      const description = screen.getByText('Test description');
      expect(description).toHaveClass('text-gray-600');
    });

    it('should have semantic structure', () => {
      const campaign = createMockCampaign({
        _count: { products: 5, orders: 10 },
      });
      const { container } = render(<CampaignCardBody campaign={campaign} />);

      // Should be wrapped in divs with proper structure
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
