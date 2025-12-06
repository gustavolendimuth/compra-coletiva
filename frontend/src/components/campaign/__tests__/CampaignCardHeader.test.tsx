import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMockCampaign } from '@/__tests__/mock-data';
import { CampaignCardHeader } from '../CampaignCardHeader';

describe('CampaignCardHeader', () => {
  describe('Campaign Name', () => {
    it('should display campaign name', () => {
      const campaign = createMockCampaign({ name: 'Summer Sale Campaign' });
      render(<CampaignCardHeader campaign={campaign} />);

      expect(screen.getByText('Summer Sale Campaign')).toBeInTheDocument();
    });

    it('should truncate long campaign names with line-clamp', () => {
      const longName = 'Very Long Campaign Name That Should Be Truncated After Two Lines';
      const campaign = createMockCampaign({ name: longName });
      render(<CampaignCardHeader campaign={campaign} />);

      const nameElement = screen.getByText(longName);
      expect(nameElement).toHaveClass('line-clamp-2');
    });
  });

  describe('Status Badge', () => {
    it('should display ACTIVE status with correct styling', () => {
      const campaign = createMockCampaign({ status: 'ACTIVE' });
      render(<CampaignCardHeader campaign={campaign} />);

      const badge = screen.getByText('Ativa');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('should display CLOSED status with correct styling', () => {
      const campaign = createMockCampaign({ status: 'CLOSED' });
      render(<CampaignCardHeader campaign={campaign} />);

      const badge = screen.getByText('Fechada');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
    });

    it('should display SENT status with correct styling', () => {
      const campaign = createMockCampaign({ status: 'SENT' });
      render(<CampaignCardHeader campaign={campaign} />);

      const badge = screen.getByText('Enviada');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    it('should display ARCHIVED status with correct styling', () => {
      const campaign = createMockCampaign({ status: 'ARCHIVED' });
      render(<CampaignCardHeader campaign={campaign} />);

      const badge = screen.getByText('Arquivada');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700');
    });

    it('should have proper badge styling', () => {
      const campaign = createMockCampaign({ status: 'ACTIVE' });
      render(<CampaignCardHeader campaign={campaign} />);

      const badge = screen.getByText('Ativa');
      expect(badge).toHaveClass('px-2.5', 'py-1', 'text-xs', 'font-medium', 'rounded-full');
    });
  });

  describe('Creator Display', () => {
    it('should display creator name when available', () => {
      const campaign = createMockCampaign({
        creator: { id: 'user-1', name: 'Jane Smith' },
      });
      render(<CampaignCardHeader campaign={campaign} />);

      expect(screen.getByText('por')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should style creator name correctly', () => {
      const campaign = createMockCampaign({
        creator: { id: 'user-1', name: 'Jane Smith' },
      });
      render(<CampaignCardHeader campaign={campaign} />);

      const creatorName = screen.getByText('Jane Smith');
      expect(creatorName).toHaveClass('font-medium', 'text-gray-700');
    });

    it('should not display creator section when creator is undefined', () => {
      const campaign = createMockCampaign({ creator: undefined });
      render(<CampaignCardHeader campaign={campaign} />);

      expect(screen.queryByText('por')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Spacing', () => {
    it('should have proper spacing between elements', () => {
      const campaign = createMockCampaign({
        creator: { id: 'user-1', name: 'Test User' },
      });
      const { container } = render(<CampaignCardHeader campaign={campaign} />);

      const wrapper = container.querySelector('.space-y-2');
      expect(wrapper).toBeInTheDocument();
    });

    it('should use proper text sizes', () => {
      const campaign = createMockCampaign({
        creator: { id: 'user-1', name: 'Test User' },
      });
      render(<CampaignCardHeader campaign={campaign} />);

      const campaignName = screen.getByText(campaign.name);
      expect(campaignName).toHaveClass('text-lg', 'font-semibold');

      // Get the p element containing "por"
      const creatorParagraph = screen.getByText(/por/).closest('p');
      expect(creatorParagraph).toHaveClass('text-sm', 'text-gray-500');
    });
  });

  describe('Typography', () => {
    it('should use semibold font for campaign name', () => {
      const campaign = createMockCampaign({ name: 'Test Campaign' });
      render(<CampaignCardHeader campaign={campaign} />);

      const name = screen.getByText('Test Campaign');
      expect(name).toHaveClass('font-semibold');
    });

    it('should use medium font for status badge', () => {
      const campaign = createMockCampaign({ status: 'ACTIVE' });
      render(<CampaignCardHeader campaign={campaign} />);

      const badge = screen.getByText('Ativa');
      expect(badge).toHaveClass('font-medium');
    });
  });
});
