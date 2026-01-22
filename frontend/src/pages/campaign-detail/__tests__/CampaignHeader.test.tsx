import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CampaignHeader } from '../CampaignHeader';
import { createMockCampaignFull } from '@/__tests__/mock-data';

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock campaignApi and API_URL
vi.mock('@/api', () => ({
  campaignApi: {
    downloadSupplierInvoice: vi.fn(),
  },
  API_URL: 'http://localhost:3000',
}));

describe('CampaignHeader', () => {
  const mockOnEditDeadline = vi.fn();
  const mockOnCloseCampaign = vi.fn();
  const mockOnReopenCampaign = vi.fn();
  const mockOnMarkAsSent = vi.fn();
  const mockOnUpdateCampaign = vi.fn();
  const mockOnCloneCampaign = vi.fn();
  const mockOnImageUpload = vi.fn();

  const mockCampaign = createMockCampaignFull({
    id: 'campaign-1',
    name: 'Test Campaign',
    description: 'Test Description',
    status: 'ACTIVE',
    creatorId: 'user-1',
  });

  const defaultProps = {
    campaign: mockCampaign,
    canEditCampaign: true,
    ordersCount: 5,
    onEditDeadline: mockOnEditDeadline,
    onCloseCampaign: mockOnCloseCampaign,
    onReopenCampaign: mockOnReopenCampaign,
    onMarkAsSent: mockOnMarkAsSent,
    onUpdateCampaign: mockOnUpdateCampaign,
    onCloneCampaign: mockOnCloneCampaign,
    onImageUpload: mockOnImageUpload,
  };

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <CampaignHeader {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render campaign name', () => {
      renderComponent();
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });

    it('should render campaign description', () => {
      renderComponent();
      expect(screen.getAllByText('Test Description')[0]).toBeInTheDocument();
    });

    it('should render back link to campaigns list', () => {
      renderComponent();
      const backLink = screen.getByRole('link', { name: /voltar/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/campaigns');
    });

    it('should show placeholder when description is empty', () => {
      const campaignWithoutDescription = { ...mockCampaign, description: undefined };
      renderComponent({ campaign: campaignWithoutDescription });

      expect(screen.getAllByText(/clique para adicionar descrição/i)[0]).toBeInTheDocument();
    });
  });

  describe('Inline Editing - Name', () => {
    it('should allow editing campaign name when clicked by creator', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameElement = screen.getByText('Test Campaign');
      await user.click(nameElement);

      const input = screen.getByDisplayValue('Test Campaign');
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });

    it('should save new name on Enter key', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameElement = screen.getByText('Test Campaign');
      await user.click(nameElement);

      const input = screen.getByDisplayValue('Test Campaign');
      await user.clear(input);
      await user.type(input, 'New Campaign Name{Enter}');

      expect(mockOnUpdateCampaign).toHaveBeenCalledWith({ name: 'New Campaign Name' });
    });

    it('should cancel editing on Escape key', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameElement = screen.getByText('Test Campaign');
      await user.click(nameElement);

      const input = screen.getByDisplayValue('Test Campaign');
      await user.type(input, ' Modified{Escape}');

      expect(mockOnUpdateCampaign).not.toHaveBeenCalled();
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });

    it('should save on blur', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameElement = screen.getByText('Test Campaign');
      await user.click(nameElement);

      const input = screen.getByDisplayValue('Test Campaign');
      await user.clear(input);
      await user.type(input, 'Updated Name');

      // Click outside to blur
      await user.click(document.body);

      await waitFor(() => {
        expect(mockOnUpdateCampaign).toHaveBeenCalledWith({ name: 'Updated Name' });
      });
    });

    it('should not allow editing when canEditCampaign is false', async () => {
      const user = userEvent.setup();
      renderComponent({ canEditCampaign: false });

      const nameElement = screen.getByText('Test Campaign');
      await user.click(nameElement);

      // Should not show input field
      expect(screen.queryByDisplayValue('Test Campaign')).not.toBeInTheDocument();
    });
  });

  describe('Inline Editing - Description', () => {
    it('should allow editing description when clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const descriptionElement = screen.getAllByText('Test Description')[0];
      await user.click(descriptionElement);

      const textarea = screen.getAllByDisplayValue('Test Description')[0];
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveFocus();
    });

    it('should save description on Enter key', async () => {
      const user = userEvent.setup();
      renderComponent();

      const descriptionElement = screen.getAllByText('Test Description')[0];
      await user.click(descriptionElement);

      const textarea = screen.getAllByDisplayValue('Test Description')[0];
      await user.clear(textarea);
      await user.type(textarea, 'New description{Enter}');

      expect(mockOnUpdateCampaign).toHaveBeenCalledWith({ description: 'New description' });
    });

    it('should allow multiline with Shift+Enter', async () => {
      const user = userEvent.setup();
      renderComponent();

      const descriptionElement = screen.getAllByText('Test Description')[0];
      await user.click(descriptionElement);

      const textarea = screen.getAllByDisplayValue('Test Description')[0];
      await user.clear(textarea);
      await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      expect(textarea).toHaveValue('Line 1\nLine 2');
    });

    it('should cancel description editing on Escape key', async () => {
      const user = userEvent.setup();
      renderComponent();

      const descriptionElement = screen.getAllByText('Test Description')[0];
      await user.click(descriptionElement);

      const textarea = screen.getAllByDisplayValue('Test Description')[0];
      await user.type(textarea, ' Modified{Escape}');

      expect(mockOnUpdateCampaign).not.toHaveBeenCalled();
    });
  });

  describe('Deadline Display', () => {
    it('should display deadline when present', () => {
      const campaignWithDeadline = {
        ...mockCampaign,
        deadline: new Date('2025-12-31T23:59:59').toISOString(),
      };
      renderComponent({ campaign: campaignWithDeadline });

      expect(screen.getAllByText(/data limite:/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/31\/12\/2025/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/23:59/)[0]).toBeInTheDocument();
    });

    it('should show edit button for deadline when present and user can edit', () => {
      const campaignWithDeadline = {
        ...mockCampaign,
        deadline: new Date('2025-12-31T23:59:59').toISOString(),
      };
      renderComponent({ campaign: campaignWithDeadline });

      const editButton = screen.getAllByTitle(/editar data limite/i)[0];
      expect(editButton).toBeInTheDocument();
    });

    it('should call onEditDeadline when edit button is clicked', async () => {
      const user = userEvent.setup();
      const campaignWithDeadline = {
        ...mockCampaign,
        deadline: new Date('2025-12-31T23:59:59').toISOString(),
      };
      renderComponent({ campaign: campaignWithDeadline });

      const editButton = screen.getAllByTitle(/editar data limite/i)[0];
      await user.click(editButton);

      expect(mockOnEditDeadline).toHaveBeenCalled();
    });

    it('should show "Adicionar data limite" button when no deadline and campaign is active', () => {
      const campaignWithoutDeadline = { ...mockCampaign, deadline: undefined };
      renderComponent({ campaign: campaignWithoutDeadline });

      expect(screen.getAllByRole('button', { name: /adicionar data limite/i })[0]).toBeInTheDocument();
    });

    it('should highlight deadline in red when expired', () => {
      const expiredCampaign = {
        ...mockCampaign,
        deadline: new Date('2020-01-01T00:00:00').toISOString(), // Past date
      };
      renderComponent({ campaign: expiredCampaign });

      const deadlineElement = screen.getAllByText(/data limite:/i)[0].closest('div');
      expect(deadlineElement).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should highlight deadline in yellow when expiring soon (within 24h)', () => {
      const soonExpiring = {
        ...mockCampaign,
        deadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
      };
      renderComponent({ campaign: soonExpiring });

      const deadlineElement = screen.getAllByText(/data limite:/i)[0].closest('div');
      expect(deadlineElement).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });

    it('should highlight deadline in blue when not expiring soon', () => {
      const notExpiringSoon = {
        ...mockCampaign,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      };
      renderComponent({ campaign: notExpiringSoon });

      const deadlineElement = screen.getAllByText(/data limite:/i)[0].closest('div');
      expect(deadlineElement).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  describe('Action Buttons - Active Campaign', () => {
    it('should show "Fechar Campanha" button for active campaign when user can edit', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /fechar campanha/i })).toBeInTheDocument();
    });

    it('should call onCloseCampaign when close button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const closeButton = screen.getByRole('button', { name: /fechar campanha/i });
      await user.click(closeButton);

      expect(mockOnCloseCampaign).toHaveBeenCalled();
    });

    it('should show "Gerar Fatura" button when there are orders', () => {
      renderComponent({ ordersCount: 5 });
      expect(screen.getByRole('button', { name: /gerar fatura/i })).toBeInTheDocument();
    });

    it('should not show "Gerar Fatura" button when there are no orders', () => {
      renderComponent({ ordersCount: 0 });
      expect(screen.queryByRole('button', { name: /gerar fatura/i })).not.toBeInTheDocument();
    });
  });

  describe('Action Buttons - Closed Campaign', () => {
    it('should show "Reabrir" and "Marcar como Enviado" buttons for closed campaign', () => {
      const closedCampaign = { ...mockCampaign, status: 'CLOSED' };
      renderComponent({ campaign: closedCampaign });

      expect(screen.getByRole('button', { name: /reabrir/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /marcar como enviado/i })).toBeInTheDocument();
    });

    it('should call onReopenCampaign when reopen button is clicked', async () => {
      const user = userEvent.setup();
      const closedCampaign = { ...mockCampaign, status: 'CLOSED' };
      renderComponent({ campaign: closedCampaign });

      const reopenButton = screen.getByRole('button', { name: /reabrir/i });
      await user.click(reopenButton);

      expect(mockOnReopenCampaign).toHaveBeenCalled();
    });

    it('should call onMarkAsSent when mark as sent button is clicked', async () => {
      const user = userEvent.setup();
      const closedCampaign = { ...mockCampaign, status: 'CLOSED' };
      renderComponent({ campaign: closedCampaign });

      const sentButton = screen.getByRole('button', { name: /marcar como enviado/i });
      await user.click(sentButton);

      expect(mockOnMarkAsSent).toHaveBeenCalled();
    });
  });

  describe('Action Buttons - Sent Campaign', () => {
    it('should show "Reabrir Campanha" button for sent campaign', () => {
      const sentCampaign = { ...mockCampaign, status: 'SENT' };
      renderComponent({ campaign: sentCampaign });

      expect(screen.getByRole('button', { name: /reabrir campanha/i })).toBeInTheDocument();
    });
  });

  describe('Status Alert Banners', () => {
    it('should show closed campaign alert', () => {
      const closedCampaign = { ...mockCampaign, status: 'CLOSED' };
      renderComponent({ campaign: closedCampaign });

      expect(screen.getByText(/campanha fechada/i)).toBeInTheDocument();
      expect(
        screen.getByText(/não é possível adicionar ou alterar produtos e pedidos/i)
      ).toBeInTheDocument();
    });

    it('should show sent campaign alert', () => {
      const sentCampaign = { ...mockCampaign, status: 'SENT' };
      renderComponent({ campaign: sentCampaign });

      expect(screen.getByText(/campanha enviada/i)).toBeInTheDocument();
      expect(
        screen.getByText(/foi marcada como enviada/i)
      ).toBeInTheDocument();
    });

    it('should not show alert for active campaign', () => {
      renderComponent();

      expect(screen.queryByText(/campanha fechada/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/campanha enviada/i)).not.toBeInTheDocument();
    });
  });

  describe('Authorization', () => {
    it('should not show action buttons when canEditCampaign is false', () => {
      renderComponent({ canEditCampaign: false });

      expect(screen.queryByRole('button', { name: /fechar campanha/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /gerar fatura/i })).not.toBeInTheDocument();
    });

    it('should not show edit deadline button when canEditCampaign is false', () => {
      const campaignWithDeadline = {
        ...mockCampaign,
        deadline: new Date('2025-12-31T23:59:59').toISOString(),
      };
      renderComponent({ campaign: campaignWithDeadline, canEditCampaign: false });

      expect(screen.queryByTitle(/editar data limite/i)).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive classes to action buttons', () => {
      renderComponent();

      const button = screen.getByRole('button', { name: /fechar campanha/i });
      expect(button).toHaveClass('text-xs', 'sm:text-sm', 'whitespace-nowrap');
    });
  });

  describe('Campaign Image', () => {
    it('should display campaign image when imageUrl is present (S3 URL)', () => {
      const campaignWithImage = {
        ...mockCampaign,
        imageUrl: 'https://s3.amazonaws.com/bucket/image.jpg',
      };
      renderComponent({ campaign: campaignWithImage });

      const image = screen.getByAltText('Test Campaign');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://s3.amazonaws.com/bucket/image.jpg');
    });

    it('should display campaign image when imageUrl is present (local storage)', () => {
      const campaignWithImage = {
        ...mockCampaign,
        imageUrl: '/uploads/campaigns/image.jpg',
      };
      renderComponent({ campaign: campaignWithImage });

      const image = screen.getByAltText('Test Campaign');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'http://localhost:3000/uploads/campaigns/image.jpg');
    });

    it('should show edit button on image when user can edit', () => {
      const campaignWithImage = {
        ...mockCampaign,
        imageUrl: '/uploads/campaigns/image.jpg',
      };
      renderComponent({ campaign: campaignWithImage });

      const editButton = screen.getByTitle(/alterar imagem/i);
      expect(editButton).toBeInTheDocument();
    });

    it('should call onImageUpload when edit button is clicked', async () => {
      const user = userEvent.setup();
      const campaignWithImage = {
        ...mockCampaign,
        imageUrl: '/uploads/campaigns/image.jpg',
      };
      renderComponent({ campaign: campaignWithImage });

      const editButton = screen.getByTitle(/alterar imagem/i);
      await user.click(editButton);

      expect(mockOnImageUpload).toHaveBeenCalled();
    });

    it('should not show edit button on image when user cannot edit', () => {
      const campaignWithImage = {
        ...mockCampaign,
        imageUrl: '/uploads/campaigns/image.jpg',
      };
      renderComponent({ campaign: campaignWithImage, canEditCampaign: false });

      expect(screen.queryByTitle(/alterar imagem/i)).not.toBeInTheDocument();
    });

    it('should show upload placeholder when no image and user can edit', () => {
      const campaignWithoutImage = { ...mockCampaign, imageUrl: undefined };
      renderComponent({ campaign: campaignWithoutImage });

      const uploadButton = screen.getByTitle(/adicionar imagem da campanha/i);
      expect(uploadButton).toBeInTheDocument();
    });

    it('should call onImageUpload when placeholder is clicked', async () => {
      const user = userEvent.setup();
      const campaignWithoutImage = { ...mockCampaign, imageUrl: undefined };
      renderComponent({ campaign: campaignWithoutImage });

      const uploadButton = screen.getByTitle(/adicionar imagem da campanha/i);
      await user.click(uploadButton);

      expect(mockOnImageUpload).toHaveBeenCalled();
    });

    it('should not show upload placeholder when no image and user cannot edit', () => {
      const campaignWithoutImage = { ...mockCampaign, imageUrl: undefined };
      renderComponent({ campaign: campaignWithoutImage, canEditCampaign: false });

      expect(screen.queryByTitle(/adicionar imagem da campanha/i)).not.toBeInTheDocument();
    });

    it('should render image with correct responsive classes', () => {
      const campaignWithImage = {
        ...mockCampaign,
        imageUrl: '/uploads/campaigns/image.jpg',
      };
      renderComponent({ campaign: campaignWithImage });

      const imageContainer = screen.getByAltText('Test Campaign').parentElement;
      expect(imageContainer).toHaveClass('w-24', 'h-24', 'md:w-32', 'md:h-32');
    });
  });
});
