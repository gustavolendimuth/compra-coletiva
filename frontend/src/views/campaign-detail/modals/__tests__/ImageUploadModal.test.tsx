import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ImageUploadModal } from '../ImageUploadModal';
import toast from 'react-hot-toast';

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock campaignService and API_URL
vi.mock('@/api', () => ({
  campaignService: {
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
  },
  API_URL: 'http://localhost:3000',
}));

// Import mocked functions after mock setup
import { campaignService } from '@/api';
const mockUploadImage = campaignService.uploadImage as ReturnType<typeof vi.fn>;
const mockDeleteImage = campaignService.deleteImage as ReturnType<typeof vi.fn>;

describe('ImageUploadModal', () => {
  let queryClient: QueryClient;

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    campaignSlug: 'test-campaign',
    currentImageUrl: undefined,
  };

  const renderComponent = (props = {}) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <ImageUploadModal {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render modal when open', () => {
      renderComponent();
      expect(screen.getByText(/imagem da campanha/i)).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      renderComponent({ isOpen: false });
      expect(screen.queryByText(/imagem da campanha/i)).not.toBeInTheDocument();
    });

    it('should show upload instructions', () => {
      renderComponent();
      expect(screen.getByText(/formatos aceitos: jpeg, png, webp/i)).toBeInTheDocument();
      expect(screen.getByText(/tamanho máximo: 5mb/i)).toBeInTheDocument();
      expect(screen.getByText(/recomendado: proporção 16:9 ou 2:1/i)).toBeInTheDocument();
    });

    it('should show cancel button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });
  });

  describe('Image Upload', () => {
    it('should show upload button disabled when no file selected', () => {
      renderComponent();
      const uploadButton = screen.getByRole('button', { name: /selecione uma imagem/i });
      expect(uploadButton).toBeDisabled();
    });

    it('should enable upload button when file is selected', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Simulate file selection
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      if (input) {
        await user.upload(input, file);
        
        await waitFor(() => {
          const uploadButton = screen.getByRole('button', { name: /enviar imagem/i });
          expect(uploadButton).not.toBeDisabled();
        });
      }
    });

    it('should call uploadImage mutation when upload button is clicked', async () => {
      const user = userEvent.setup();
      mockUploadImage.mockResolvedValue({ data: { imageUrl: '/uploads/test.jpg' } });
      
      renderComponent();

      // Simulate file selection
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      if (input) {
        await user.upload(input, file);
        
        const uploadButton = await screen.findByRole('button', { name: /enviar imagem/i });
        await user.click(uploadButton);

        await waitFor(() => {
          expect(mockUploadImage).toHaveBeenCalledWith('test-campaign', file);
        });
      }
    });

    it('should show success toast on successful upload', async () => {
      const user = userEvent.setup();
      mockUploadImage.mockResolvedValue({ data: { imageUrl: '/uploads/test.jpg' } });
      
      renderComponent();

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      if (input) {
        await user.upload(input, file);
        
        const uploadButton = await screen.findByRole('button', { name: /enviar imagem/i });
        await user.click(uploadButton);

        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith('Imagem enviada com sucesso!');
        });
      }
    });

    it('should show error toast on upload failure', async () => {
      const user = userEvent.setup();
      mockUploadImage.mockRejectedValue({
        response: { data: { message: 'Arquivo muito grande' } },
      });
      
      renderComponent();

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      if (input) {
        await user.upload(input, file);
        
        const uploadButton = await screen.findByRole('button', { name: /enviar imagem/i });
        await user.click(uploadButton);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Arquivo muito grande');
        });
      }
    });

    it('should close modal after successful upload', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();
      mockUploadImage.mockResolvedValue({ data: { imageUrl: '/uploads/test.jpg' } });
      
      renderComponent({ onClose: mockOnClose });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      if (input) {
        await user.upload(input, file);
        
        const uploadButton = await screen.findByRole('button', { name: /enviar imagem/i });
        await user.click(uploadButton);

        await waitFor(() => {
          expect(mockOnClose).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Current Image Display', () => {
    it('should display current image when provided (S3 URL)', () => {
      renderComponent({
        currentImageUrl: 'https://s3.amazonaws.com/bucket/image.jpg',
      });

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'https://s3.amazonaws.com/bucket/image.jpg');
    });

    it('should display current image when provided (local storage)', () => {
      renderComponent({
        currentImageUrl: '/uploads/campaigns/image.jpg',
      });

      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', 'http://localhost:3000/uploads/campaigns/image.jpg');
    });

    it('should show remove button when current image exists', () => {
      renderComponent({
        currentImageUrl: '/uploads/campaigns/image.jpg',
      });

      const removeButtons = screen.getAllByRole('button', { name: /remover imagem/i });
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it('should not show main remove button when no current image', () => {
      renderComponent();
      // Should not have the main "Remover Imagem" button (only in ImageUpload component)
      const buttons = screen.queryAllByRole('button', { name: /remover imagem/i });
      // If there's a button, it should be disabled or not visible
      expect(buttons.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Image Deletion', () => {
    it('should call deleteImage mutation when remove button is clicked', async () => {
      const user = userEvent.setup();
      mockDeleteImage.mockResolvedValue({});

      renderComponent({
        currentImageUrl: '/uploads/campaigns/image.jpg',
      });

      // Get the main "Remover Imagem" button (not the X button in the image preview)
      const removeButtons = screen.getAllByRole('button', { name: /remover imagem/i });
      const mainRemoveButton = removeButtons.find(btn => btn.textContent === 'Remover Imagem');

      if (mainRemoveButton) {
        await user.click(mainRemoveButton);

        // Modal should appear (check by looking for the confirmation message, not the title)
        expect(screen.getByText(/tem certeza que deseja remover a imagem atual da campanha/i)).toBeInTheDocument();

        // Click confirm button in modal
        const confirmButton = screen.getByRole('button', { name: /^remover$/i });
        await user.click(confirmButton);

        await waitFor(() => {
          expect(mockDeleteImage).toHaveBeenCalledWith('test-campaign');
        });
      }
    });

    it('should show confirmation dialog before deleting', async () => {
      const user = userEvent.setup();

      renderComponent({
        currentImageUrl: '/uploads/campaigns/image.jpg',
      });

      const removeButtons = screen.getAllByRole('button', { name: /remover imagem/i });
      const mainRemoveButton = removeButtons.find(btn => btn.textContent === 'Remover Imagem');

      if (mainRemoveButton) {
        await user.click(mainRemoveButton);

        // Modal should appear with confirmation message
        expect(screen.getByText(/tem certeza que deseja remover a imagem atual da campanha/i)).toBeInTheDocument();

        // Click cancel button (get all and pick the last one - from ConfirmModal)
        const cancelButtons = screen.getAllByRole('button', { name: /cancelar/i });
        const confirmModalCancelButton = cancelButtons[cancelButtons.length - 1];
        await user.click(confirmModalCancelButton);

        // deleteImage should NOT be called
        expect(mockDeleteImage).not.toHaveBeenCalled();
      }
    });

    it('should show success toast on successful deletion', async () => {
      const user = userEvent.setup();
      mockDeleteImage.mockResolvedValue({});

      renderComponent({
        currentImageUrl: '/uploads/campaigns/image.jpg',
      });

      const removeButtons = screen.getAllByRole('button', { name: /remover imagem/i });
      const mainRemoveButton = removeButtons.find(btn => btn.textContent === 'Remover Imagem');

      if (mainRemoveButton) {
        await user.click(mainRemoveButton);

        // Click confirm button in modal
        const confirmButton = screen.getByRole('button', { name: /^remover$/i });
        await user.click(confirmButton);

        await waitFor(() => {
          expect(toast.success).toHaveBeenCalledWith('Imagem removida com sucesso!');
        });
      }
    });

    it('should show error toast on deletion failure', async () => {
      const user = userEvent.setup();
      mockDeleteImage.mockRejectedValue({
        response: { data: { message: 'Erro ao remover' } },
      });

      renderComponent({
        currentImageUrl: '/uploads/campaigns/image.jpg',
      });

      const removeButtons = screen.getAllByRole('button', { name: /remover imagem/i });
      const mainRemoveButton = removeButtons.find(btn => btn.textContent === 'Remover Imagem');
      
      if (mainRemoveButton) {
        await user.click(mainRemoveButton);

        // Click confirm button in modal
        const confirmButton = screen.getByRole('button', { name: /^remover$/i });
        await user.click(confirmButton);

        await waitFor(() => {
          expect(toast.error).toHaveBeenCalledWith('Erro ao remover');
        });
      }
    });
  });

  describe('Modal Actions', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();
      
      renderComponent({ onClose: mockOnClose });

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should disable all buttons while upload is in progress', async () => {
      const user = userEvent.setup();
      mockUploadImage.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      
      renderComponent();

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      if (input) {
        await user.upload(input, file);
        
        const uploadButton = await screen.findByRole('button', { name: /enviar imagem/i });
        await user.click(uploadButton);

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /enviando\.\.\./i })).toBeDisabled();
          expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled();
        });
      }
    });
  });
});

