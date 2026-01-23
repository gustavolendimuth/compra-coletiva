import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionsTab } from '../QuestionsTab';

// Mock CampaignQuestionsPanel component
vi.mock('@/components/campaign', () => ({
  CampaignQuestionsPanel: ({ campaignId }: any) => (
    <div data-testid="campaign-questions-panel">
      Campaign Questions: {campaignId}
    </div>
  ),
}));

describe('QuestionsTab', () => {
  const defaultProps = {
    campaignId: 'campaign-123',
    canEditCampaign: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering - Campaign Editor', () => {
    it('should render questions tab when user can edit campaign', () => {
      render(<QuestionsTab {...defaultProps} canEditCampaign={true} />);

      expect(screen.getByText('Moderar Perguntas')).toBeInTheDocument();
    });

    it('should render description text', () => {
      render(<QuestionsTab {...defaultProps} canEditCampaign={true} />);

      expect(
        screen.getByText(/responda as perguntas dos usuários/i)
      ).toBeInTheDocument();
    });

    it('should render auto-publish information', () => {
      render(<QuestionsTab {...defaultProps} canEditCampaign={true} />);

      expect(
        screen.getByText(/suas respostas serão publicadas automaticamente/i)
      ).toBeInTheDocument();
    });

    it('should render CampaignQuestionsPanel component', () => {
      render(<QuestionsTab {...defaultProps} canEditCampaign={true} />);

      expect(screen.getByTestId('campaign-questions-panel')).toBeInTheDocument();
    });

    it('should pass campaignId to CampaignQuestionsPanel', () => {
      render(<QuestionsTab {...defaultProps} campaignId="test-campaign-456" />);

      expect(screen.getByText('Campaign Questions: test-campaign-456')).toBeInTheDocument();
    });
  });

  describe('Rendering - Non-Editor', () => {
    it('should not render anything when user cannot edit campaign', () => {
      render(<QuestionsTab {...defaultProps} canEditCampaign={false} />);

      expect(screen.queryByText('Moderar Perguntas')).not.toBeInTheDocument();
    });

    it('should not render CampaignQuestionsPanel when user cannot edit campaign', () => {
      render(<QuestionsTab {...defaultProps} canEditCampaign={false} />);

      expect(screen.queryByTestId('campaign-questions-panel')).not.toBeInTheDocument();
    });

    it('should return null for non-editors', () => {
      const { container } = render(<QuestionsTab {...defaultProps} canEditCampaign={false} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Layout and Styling', () => {
    it('should have bottom padding for mobile navigation', () => {
      const { container } = render(<QuestionsTab {...defaultProps} canEditCampaign={true} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('pb-20');
    });

    it('should have max-width container for content', () => {
      const { container } = render(<QuestionsTab {...defaultProps} canEditCampaign={true} />);

      const maxWidthContainer = container.querySelector('.max-w-4xl');
      expect(maxWidthContainer).toBeInTheDocument();
      expect(maxWidthContainer).toHaveClass('mx-auto');
    });

    it('should have proper spacing between header and content', () => {
      const { container } = render(<QuestionsTab {...defaultProps} canEditCampaign={true} />);

      const headerSection = container.querySelector('.mb-6');
      expect(headerSection).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading level', () => {
      render(<QuestionsTab {...defaultProps} canEditCampaign={true} />);

      const heading = screen.getByRole('heading', { level: 2, name: /moderar perguntas/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have descriptive text for screen readers', () => {
      render(<QuestionsTab {...defaultProps} canEditCampaign={true} />);

      const description = screen.getByText(/responda as perguntas dos usuários/i);
      expect(description).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty campaignId', () => {
      render(<QuestionsTab campaignId="" canEditCampaign={true} />);

      expect(screen.getByTestId('campaign-questions-panel')).toBeInTheDocument();
      expect(screen.getByText('Campaign Questions:')).toBeInTheDocument();
    });

    it('should handle undefined campaignId gracefully', () => {
      render(<QuestionsTab campaignId={undefined as any} canEditCampaign={true} />);

      expect(screen.queryByText('Moderar Perguntas')).toBeInTheDocument();
    });

    it('should handle both props being false/empty', () => {
      const { container } = render(
        <QuestionsTab campaignId="" canEditCampaign={false} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Responsive Design', () => {
    it('should have mobile-responsive padding', () => {
      const { container } = render(<QuestionsTab {...defaultProps} canEditCampaign={true} />);

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('pb-20', 'md:pb-0');
    });

    it('should center content on larger screens', () => {
      const { container } = render(<QuestionsTab {...defaultProps} canEditCampaign={true} />);

      const centeredContainer = container.querySelector('.max-w-4xl.mx-auto');
      expect(centeredContainer).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should properly integrate with CampaignQuestionsPanel', () => {
      render(<QuestionsTab {...defaultProps} campaignId="integration-test" />);

      const panel = screen.getByTestId('campaign-questions-panel');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveTextContent('integration-test');
    });

    it('should maintain component structure', () => {
      const { container } = render(<QuestionsTab {...defaultProps} canEditCampaign={true} />);

      // Check for main container
      expect(container.firstChild).toHaveClass('pb-20', 'md:pb-0');

      // Check for max-width container
      const maxWidthContainer = container.querySelector('.max-w-4xl');
      expect(maxWidthContainer).toBeInTheDocument();

      // Check for header section
      const headerSection = container.querySelector('.mb-6');
      expect(headerSection).toBeInTheDocument();
    });
  });
});
