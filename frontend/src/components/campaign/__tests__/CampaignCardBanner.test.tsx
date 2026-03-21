import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/test-utils';
import { createMockCampaign } from '@/__tests__/mock-data';
import { CampaignCardBanner } from '../CampaignCardBanner';

describe('CampaignCardBanner', () => {
  describe('Rendering', () => {
    it('should render campaign name', () => {
      const campaign = createMockCampaign({ name: 'Campanha de Teste' });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByText('Campanha de Teste')).toBeInTheDocument();
    });

    it('should render campaign description', () => {
      const campaign = createMockCampaign({ description: 'Descrição da campanha' });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByText('Descrição da campanha')).toBeInTheDocument();
    });

    it('should render "Ativa" status badge', () => {
      renderWithProviders(<CampaignCardBanner campaign={createMockCampaign()} />);
      expect(screen.getByText('Ativa')).toBeInTheDocument();
    });

    it('should not crash when description is missing', () => {
      const campaign = createMockCampaign({ description: undefined });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render as a link pointing to the campaign slug', () => {
      const campaign = createMockCampaign({ slug: 'minha-campanha' });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/campanhas/minha-campanha');
    });

    it('should wrap the entire card in the link', () => {
      const campaign = createMockCampaign({ name: 'Card Inteiro' });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByRole('link')).toHaveTextContent(/Card Inteiro/i);
    });
  });

  describe('Image', () => {
    it('should render image with alt text when imageUrl is provided', () => {
      const campaign = createMockCampaign({
        name: 'Campanha com Foto',
        imageUrl: 'https://example.com/foto.jpg',
      });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByAltText('Campanha com Foto')).toBeInTheDocument();
    });

    it('should not render an img element when imageUrl is absent', () => {
      const campaign = createMockCampaign({ imageUrl: undefined });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Location Badge', () => {
    it('should show all three location fields joined by commas', () => {
      const campaign = createMockCampaign({
        pickupNeighborhood: 'Vila Madalena',
        pickupCity: 'São Paulo',
        pickupState: 'SP',
      });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByText('Vila Madalena, São Paulo, SP')).toBeInTheDocument();
    });

    it('should show city and state when neighborhood is absent', () => {
      const campaign = createMockCampaign({
        pickupNeighborhood: undefined,
        pickupCity: 'Campinas',
        pickupState: 'SP',
      });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByText('Campinas, SP')).toBeInTheDocument();
    });

    it('should show only state when only state is provided', () => {
      const campaign = createMockCampaign({
        pickupNeighborhood: undefined,
        pickupCity: undefined,
        pickupState: 'MG',
      });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByText('MG')).toBeInTheDocument();
    });

    it('should not render location badge when all location fields are absent', () => {
      const campaign = createMockCampaign({
        pickupNeighborhood: undefined,
        pickupCity: undefined,
        pickupState: undefined,
      });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      // No comma-separated location text should appear
      expect(screen.queryByText(/, /)).not.toBeInTheDocument();
    });
  });

  describe('Stats', () => {
    it('should display formatted order count', () => {
      const campaign = createMockCampaign({ _count: { products: 3, orders: 42 } });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByText(/\+42 pedidos/)).toBeInTheDocument();
    });

    it('should handle zero orders', () => {
      const campaign = createMockCampaign({ _count: { products: 0, orders: 0 } });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByText(/\+0 pedidos/)).toBeInTheDocument();
    });

    it('should handle missing _count gracefully', () => {
      const campaign = createMockCampaign({ _count: undefined });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByText(/\+0 pedidos/)).toBeInTheDocument();
    });
  });

  describe('Index prop', () => {
    it('should render without errors when index is not provided (defaults to 0)', () => {
      renderWithProviders(<CampaignCardBanner campaign={createMockCampaign()} />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('should cycle through background variants for different index values', () => {
      [0, 1, 2, 3, 10].forEach((index) => {
        const { unmount } = renderWithProviders(
          <CampaignCardBanner campaign={createMockCampaign()} index={index} />
        );
        expect(screen.getByRole('link')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have a link with meaningful text content', () => {
      const campaign = createMockCampaign({ name: 'Campanha Acessível' });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByRole('link')).toHaveTextContent(/Campanha Acessível/i);
    });

    it('should render image with descriptive alt text', () => {
      const campaign = createMockCampaign({
        name: 'Campanha com Imagem',
        imageUrl: 'https://example.com/img.jpg',
      });
      renderWithProviders(<CampaignCardBanner campaign={campaign} />);
      expect(screen.getByAltText('Campanha com Imagem')).toBeInTheDocument();
    });
  });
});
