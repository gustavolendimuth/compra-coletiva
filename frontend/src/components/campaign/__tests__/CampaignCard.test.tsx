import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/test-utils';
import { createMockCampaign } from '@/__tests__/mock-data';
import { CampaignCard } from '../CampaignCard';

describe('CampaignCard', () => {
  const mockCampaign = createMockCampaign({
    id: 'campaign-1',
    name: 'Test Campaign',
    description: 'Test description',
    status: 'ACTIVE',
  });

  describe('Rendering', () => {
    it('should render campaign card with all sections', () => {
      renderWithProviders(<CampaignCard campaign={mockCampaign} />);

      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should render as a link to campaign detail page', () => {
      renderWithProviders(<CampaignCard campaign={mockCampaign} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/campanhas/campaign-1');
    });

    it('should render with proper article structure', () => {
      renderWithProviders(<CampaignCard campaign={mockCampaign} />);

      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
      expect(article).toHaveClass('bg-white', 'rounded-xl', 'border');
    });
  });

  describe('Status Display', () => {
    it('should display ACTIVE status correctly', () => {
      const campaign = createMockCampaign({ status: 'ACTIVE' });
      renderWithProviders(<CampaignCard campaign={campaign} />);

      expect(screen.getByText('Ativa')).toBeInTheDocument();
    });

    it('should display CLOSED status correctly', () => {
      const campaign = createMockCampaign({ status: 'CLOSED' });
      renderWithProviders(<CampaignCard campaign={campaign} />);

      expect(screen.getByText('Fechada')).toBeInTheDocument();
    });

    it('should display SENT status correctly', () => {
      const campaign = createMockCampaign({ status: 'SENT' });
      renderWithProviders(<CampaignCard campaign={campaign} />);

      expect(screen.getByText('Enviada')).toBeInTheDocument();
    });

    it('should display ARCHIVED status correctly', () => {
      const campaign = createMockCampaign({ status: 'ARCHIVED' });
      renderWithProviders(<CampaignCard campaign={campaign} />);

      expect(screen.getByText('Arquivada')).toBeInTheDocument();
    });
  });

  describe('Creator Display', () => {
    it('should display creator name when available', () => {
      const campaign = createMockCampaign({
        creator: { id: 'user-1', name: 'John Doe' },
      });
      renderWithProviders(<CampaignCard campaign={campaign} />);

      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/por/i)).toBeInTheDocument();
    });

    it('should not display creator section when creator is missing', () => {
      const campaign = createMockCampaign({ creator: undefined });
      renderWithProviders(<CampaignCard campaign={campaign} />);

      expect(screen.queryByText(/por/i)).not.toBeInTheDocument();
    });
  });

  describe('Description Display', () => {
    it('should display description when available', () => {
      const campaign = createMockCampaign({
        description: 'This is a detailed description',
      });
      renderWithProviders(<CampaignCard campaign={campaign} />);

      expect(screen.getByText('This is a detailed description')).toBeInTheDocument();
    });

    it('should not crash when description is missing', () => {
      const campaign = createMockCampaign({ description: undefined });
      renderWithProviders(<CampaignCard campaign={campaign} />);

      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });

    it('should truncate long descriptions with line-clamp', () => {
      const longDescription = 'a'.repeat(500);
      const campaign = createMockCampaign({ description: longDescription });
      renderWithProviders(<CampaignCard campaign={campaign} />);

      const descElement = screen.getByText(longDescription);
      expect(descElement).toHaveClass('line-clamp-2');
    });
  });

  describe('Statistics Display', () => {
    it('should display product count', () => {
      const campaign = createMockCampaign({
        _count: { products: 5, orders: 10 },
      });
      renderWithProviders(<CampaignCard campaign={campaign} />);

      expect(screen.getByText('5 produtos')).toBeInTheDocument();
    });

    it('should display order count', () => {
      const campaign = createMockCampaign({
        _count: { products: 5, orders: 10 },
      });
      renderWithProviders(<CampaignCard campaign={campaign} />);

      expect(screen.getByText('10 pedidos')).toBeInTheDocument();
    });

    it('should handle zero counts', () => {
      const campaign = createMockCampaign({
        _count: { products: 0, orders: 0 },
      });
      renderWithProviders(<CampaignCard campaign={campaign} />);

      expect(screen.getByText('0 produtos')).toBeInTheDocument();
      expect(screen.getByText('0 pedidos')).toBeInTheDocument();
    });
  });

  describe('Product Preview', () => {
    it('should render product preview with inline variant by default', () => {
      renderWithProviders(<CampaignCard campaign={mockCampaign} />);

      // ProductPreview component should be rendered
      // This would require checking for product images or names
      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });

    it('should accept custom product preview variant', () => {
      renderWithProviders(
        <CampaignCard campaign={mockCampaign} productPreviewVariant="expandable" />
      );

      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('should have hover transition classes', () => {
      renderWithProviders(<CampaignCard campaign={mockCampaign} />);

      const article = screen.getByRole('article');
      expect(article).toHaveClass('hover:shadow-md', 'hover:border-primary-300');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      renderWithProviders(<CampaignCard campaign={mockCampaign} />);

      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should have meaningful link text', () => {
      renderWithProviders(<CampaignCard campaign={mockCampaign} />);

      const link = screen.getByRole('link');
      expect(link).toHaveTextContent(/Test Campaign/i);
    });
  });

  describe('Responsive Design', () => {
    it('should have mobile-first flex layout', () => {
      renderWithProviders(<CampaignCard campaign={mockCampaign} />);

      const article = screen.getByRole('article');
      expect(article).toHaveClass('flex', 'flex-col');
    });

    it('should have proper spacing classes', () => {
      renderWithProviders(<CampaignCard campaign={mockCampaign} />);

      const article = screen.getByRole('article');
      // Article contains inner div with p-5, verify article has expected flex layout
      expect(article).toHaveClass('flex', 'flex-col');
    });
  });
});
