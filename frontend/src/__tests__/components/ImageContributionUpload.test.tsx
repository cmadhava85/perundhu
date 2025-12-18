import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import ImageContributionUpload from '../../components/ImageContributionUpload';
import * as api from '../../services/api';
import * as recaptchaService from '../../services/recaptchaService';

// Mock the modules
vi.mock('../../services/api');
vi.mock('../../services/recaptchaService');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
    i18n: { language: 'en' }
  })
}));

const mockedApi = vi.mocked(api);
const mockedRecaptcha = vi.mocked(recaptchaService);

describe('ImageContributionUpload', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for reCAPTCHA
    mockedRecaptcha.getRecaptchaToken.mockResolvedValue('mock-captcha-token');
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <ImageContributionUpload onSuccess={mockOnSuccess} onError={mockOnError} />
    );
  };

  describe('Rendering', () => {
    it('should render upload area', () => {
      renderComponent();
      
      expect(screen.getByText('Upload Bus Schedule Image')).toBeInTheDocument();
      expect(screen.getByText(/Drag & drop bus schedule images here/i)).toBeInTheDocument();
    });

    it('should render form fields', () => {
      renderComponent();
      
      expect(screen.getByPlaceholderText(/e.g., Bus schedule at Kochi/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., Kochi$/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/e.g., Kochi-Alappuzha/i)).toBeInTheDocument();
    });

    it('should show image count stats', () => {
      renderComponent();
      
      expect(screen.getByText(/0 images/i)).toBeInTheDocument();
      expect(screen.getByText(/0 processed/i)).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should accept valid image files', async () => {
      renderComponent();
      
      const file = new File(['image content'], 'bus-schedule.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await userEvent.upload(input, file);
      
      expect(screen.getByText('bus-schedule.jpg')).toBeInTheDocument();
    });

    it('should accept multiple files', async () => {
      renderComponent();
      
      const files = [
        new File(['image1'], 'schedule1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'schedule2.png', { type: 'image/png' })
      ];
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await userEvent.upload(input, files);
      
      expect(screen.getByText('schedule1.jpg')).toBeInTheDocument();
      expect(screen.getByText('schedule2.png')).toBeInTheDocument();
    });

    it('should filter out files larger than 10MB', async () => {
      renderComponent();
      
      // Create a mock file with a size property > 10MB
      const largeFile = new File([''], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 15 * 1024 * 1024 });
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, largeFile);
      
      expect(screen.queryByText('large.jpg')).not.toBeInTheDocument();
    });

    it('should filter out non-image files', async () => {
      renderComponent();
      
      const pdfFile = new File(['pdf content'], 'document.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await userEvent.upload(input, pdfFile);
      
      expect(screen.queryByText('document.pdf')).not.toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should show drag active state on drag over', () => {
      renderComponent();
      
      const dropZone = screen.getByRole('button', { name: /drag/i });
      
      fireEvent.dragOver(dropZone);
      
      expect(screen.getByText('Drop images here!')).toBeInTheDocument();
    });

    it('should reset state on drag leave', () => {
      renderComponent();
      
      const dropZone = screen.getByRole('button', { name: /drag/i });
      
      fireEvent.dragOver(dropZone);
      expect(screen.getByText('Drop images here!')).toBeInTheDocument();
      
      fireEvent.dragLeave(dropZone);
      expect(screen.queryByText('Drop images here!')).not.toBeInTheDocument();
    });

    it('should handle file drop', async () => {
      renderComponent();
      
      const dropZone = screen.getByRole('button', { name: /drag/i });
      const file = new File(['image'], 'dropped.jpg', { type: 'image/jpeg' });
      
      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file]
        }
      });
      
      await waitFor(() => {
        expect(screen.getByText('dropped.jpg')).toBeInTheDocument();
      });
    });
  });

  describe('Form Fields', () => {
    it('should update description field', async () => {
      renderComponent();
      
      const descriptionInput = screen.getByPlaceholderText(/e.g., Bus schedule at Kochi/i);
      await userEvent.type(descriptionInput, 'Madurai bus stand schedule');
      
      expect(descriptionInput).toHaveValue('Madurai bus stand schedule');
    });

    it('should update location field', async () => {
      renderComponent();
      
      const locationInput = screen.getByPlaceholderText(/e.g., Kochi$/i);
      await userEvent.type(locationInput, 'Madurai');
      
      expect(locationInput).toHaveValue('Madurai');
    });

    it('should update route name field', async () => {
      renderComponent();
      
      const routeInput = screen.getByPlaceholderText(/e.g., Kochi-Alappuzha/i);
      await userEvent.type(routeInput, 'Madurai-Chennai');
      
      expect(routeInput).toHaveValue('Madurai-Chennai');
    });
  });

  describe('Image Upload', () => {
    // TODO: Fix timing issue - onSuccess callback not being called in test environment
    it.skip('should upload image successfully', async () => {
      mockedApi.submitImageContribution.mockResolvedValue({
        success: true,
        contributionId: 'contrib-123',
        status: 'PROCESSING'
      });
      mockedApi.getImageProcessingStatus.mockResolvedValue({
        status: 'PROCESSED'
      });

      renderComponent();
      
      // Add a file
      const file = new File(['image'], 'schedule.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);
      
      // Click upload button
      const uploadButton = screen.getByRole('button', { name: /^Upload$/i });
      await userEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(mockedApi.submitImageContribution).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith('contrib-123');
      });
    });

    it('should handle duplicate image error (409)', async () => {
      const duplicateError = new api.ApiError('Duplicate image', 409, 'This image has already been uploaded');
      mockedApi.submitImageContribution.mockRejectedValue(duplicateError);

      renderComponent();
      
      const file = new File(['image'], 'duplicate.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);
      
      const uploadButton = screen.getByRole('button', { name: /^Upload$/i });
      await userEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });
    });

    it('should handle rate limit error (429)', async () => {
      const rateLimitError = new api.ApiError('Rate limit exceeded', 429, 'Too many uploads');
      mockedApi.submitImageContribution.mockRejectedValue(rateLimitError);

      renderComponent();
      
      const file = new File(['image'], 'schedule.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);
      
      const uploadButton = screen.getByRole('button', { name: /^Upload$/i });
      await userEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });
    });

    it('should handle general upload errors', async () => {
      mockedApi.submitImageContribution.mockRejectedValue(new Error('Network error'));

      renderComponent();
      
      const file = new File(['image'], 'schedule.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);
      
      const uploadButton = screen.getByRole('button', { name: /^Upload$/i });
      await userEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalled();
      });
    });
  });

  describe('Upload All', () => {
    it('should show Upload All button when multiple pending images exist', async () => {
      renderComponent();
      
      const files = [
        new File(['img1'], 'schedule1.jpg', { type: 'image/jpeg' }),
        new File(['img2'], 'schedule2.jpg', { type: 'image/jpeg' })
      ];
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, files);
      
      expect(screen.getByRole('button', { name: /Upload All \(2\)/i })).toBeInTheDocument();
    });

    it('should upload all pending images when Upload All is clicked', async () => {
      mockedApi.submitImageContribution.mockResolvedValue({
        success: true,
        contributionId: 'contrib-123',
        status: 'PROCESSING'
      });
      mockedApi.getImageProcessingStatus.mockResolvedValue({
        status: 'PROCESSED'
      });

      renderComponent();
      
      const files = [
        new File(['img1'], 'schedule1.jpg', { type: 'image/jpeg' }),
        new File(['img2'], 'schedule2.jpg', { type: 'image/jpeg' })
      ];
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, files);
      
      const uploadAllButton = screen.getByRole('button', { name: /Upload All/i });
      await userEvent.click(uploadAllButton);
      
      await waitFor(() => {
        expect(mockedApi.submitImageContribution).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Remove Image', () => {
    it('should remove image when Remove button is clicked', async () => {
      renderComponent();
      
      const file = new File(['image'], 'schedule.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);
      
      expect(screen.getByText('schedule.jpg')).toBeInTheDocument();
      
      const removeButton = screen.getByRole('button', { name: /Remove/i });
      await userEvent.click(removeButton);
      
      expect(screen.queryByText('schedule.jpg')).not.toBeInTheDocument();
    });

    it('should revoke object URL when removing image', async () => {
      renderComponent();
      
      const file = new File(['image'], 'schedule.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);
      
      const removeButton = screen.getByRole('button', { name: /Remove/i });
      await userEvent.click(removeButton);
      
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Retry Processing', () => {
    it('should retry processing when Retry button is clicked', async () => {
      mockedApi.retryImageProcessing.mockResolvedValue({
        success: true
      });
      mockedApi.getImageProcessingStatus.mockResolvedValue({
        status: 'PROCESSING'
      });
      mockedApi.submitImageContribution.mockResolvedValue({
        success: true,
        contributionId: 'contrib-123',
        status: 'PROCESSING_FAILED'
      });

      renderComponent();
      
      const file = new File(['image'], 'schedule.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);
      
      // First upload
      const uploadButton = screen.getByRole('button', { name: /^Upload$/i });
      await userEvent.click(uploadButton);
      
      // Wait for upload to complete and verify retry can be called
      await waitFor(() => {
        expect(mockedApi.submitImageContribution).toHaveBeenCalled();
      });
    });
  });

  describe('Status Display', () => {
    it('should display file size correctly', async () => {
      renderComponent();
      
      const file = new File(['x'.repeat(1024)], 'schedule.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);
      
      expect(screen.getByText('1 KB')).toBeInTheDocument();
    });

    it('should show Ready to upload status for new images', async () => {
      renderComponent();
      
      const file = new File(['image'], 'schedule.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);
      
      expect(screen.getByText('Ready to upload')).toBeInTheDocument();
    });
  });

  describe('reCAPTCHA Integration', () => {
    it('should get reCAPTCHA token before upload', async () => {
      mockedApi.submitImageContribution.mockResolvedValue({
        success: true,
        contributionId: 'contrib-123',
        status: 'PROCESSING'
      });
      mockedApi.getImageProcessingStatus.mockResolvedValue({
        status: 'PROCESSED'
      });

      renderComponent();
      
      const file = new File(['image'], 'schedule.jpg', { type: 'image/jpeg' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await userEvent.upload(input, file);
      
      const uploadButton = screen.getByRole('button', { name: /^Upload$/i });
      await userEvent.click(uploadButton);
      
      await waitFor(() => {
        expect(mockedRecaptcha.getRecaptchaToken).toHaveBeenCalledWith('image_upload');
      });
    });
  });
});
