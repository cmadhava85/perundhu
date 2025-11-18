import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import axios from 'axios';
import busTimingService from '../../services/busTimingService';
import type {
  TimingImageContribution,
  TimingExtractionResult,
} from '../../types/busTimingTypes';

vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('BusTimingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadTimingImage', () => {
    it('should upload timing image successfully', async () => {
      const mockFile = new File(['image'], 'timing.jpg', { type: 'image/jpeg' });
      const mockResponse: TimingImageContribution = {
        id: 1,
        userId: 'user123',
        imageUrl: 'http://example.com/timing.jpg',
        thumbnailUrl: 'http://example.com/timing_thumb.jpg',
        originLocation: 'Chennai',
        originLocationTamil: 'சென்னை',
        status: 'PENDING',
        submissionDate: '2025-11-18T10:00:00',
        extractedTimings: [],
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await busTimingService.uploadTimingImage(
        mockFile,
        'Chennai',
        'சென்னை',
        'Bus timing board'
      );

      expect(result).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contributions/timing-images'),
        expect.any(FormData),
        expect.objectContaining({
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['image'], 'timing.jpg', { type: 'image/jpeg' });
      mockedAxios.post.mockRejectedValue(new Error('Upload failed'));

      await expect(
        busTimingService.uploadTimingImage(mockFile, 'Chennai')
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('getPendingContributions', () => {
    it('should fetch pending contributions', async () => {
      const mockContributions: TimingImageContribution[] = [
        {
          id: 1,
          userId: 'user123',
          imageUrl: 'http://example.com/timing1.jpg',
          thumbnailUrl: 'http://example.com/timing1_thumb.jpg',
          originLocation: 'Chennai',
          status: 'PENDING',
          submissionDate: '2025-11-18T10:00:00',
          extractedTimings: [],
        },
        {
          id: 2,
          userId: 'user456',
          imageUrl: 'http://example.com/timing2.jpg',
          thumbnailUrl: 'http://example.com/timing2_thumb.jpg',
          originLocation: 'Madurai',
          status: 'PENDING',
          submissionDate: '2025-11-18T11:00:00',
          extractedTimings: [],
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockContributions });

      const result = await busTimingService.getPendingContributions();

      expect(result).toEqual(mockContributions);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/contributions/timing-images/pending')
      );
    });
  });

  describe('getContributions', () => {
    it('should fetch contributions with status filter', async () => {
      const mockContributions: TimingImageContribution[] = [
        {
          id: 1,
          userId: 'user123',
          imageUrl: 'http://example.com/timing1.jpg',
          thumbnailUrl: 'http://example.com/timing1_thumb.jpg',
          originLocation: 'Chennai',
          status: 'APPROVED',
          submissionDate: '2025-11-18T10:00:00',
          extractedTimings: [],
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockContributions });

      const result = await busTimingService.getContributions('APPROVED');

      expect(result).toEqual(mockContributions);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contributions/timing-images?status=APPROVED')
      );
    });

    it('should fetch contributions with userId filter', async () => {
      const mockContributions: TimingImageContribution[] = [];

      mockedAxios.get.mockResolvedValue({ data: mockContributions });

      const result = await busTimingService.getContributions(undefined, 'user123');

      expect(result).toEqual(mockContributions);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contributions/timing-images?userId=user123')
      );
    });
  });

  describe('getContribution', () => {
    it('should fetch a single contribution by ID', async () => {
      const mockContribution: TimingImageContribution = {
        id: 1,
        userId: 'user123',
        imageUrl: 'http://example.com/timing1.jpg',
        thumbnailUrl: 'http://example.com/timing1_thumb.jpg',
        originLocation: 'Chennai',
        status: 'PENDING',
        submissionDate: '2025-11-18T10:00:00',
        extractedTimings: [],
      };

      mockedAxios.get.mockResolvedValue({ data: mockContribution });

      const result = await busTimingService.getContribution(1);

      expect(result).toEqual(mockContribution);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contributions/timing-images/1')
      );
    });
  });

  describe('extractTimings', () => {
    it('should trigger OCR extraction', async () => {
      const mockResult: TimingExtractionResult = {
        origin: 'Chennai',
        timings: [
          {
            destination: 'Madurai',
            morningTimings: ['06:30', '07:00'],
            afternoonTimings: ['14:00', '15:30'],
            nightTimings: ['20:00'],
          },
        ],
        confidence: 0.85,
        rawText: 'Sample OCR text',
      };

      mockedAxios.post.mockResolvedValue({ data: mockResult });

      const result = await busTimingService.extractTimings(1);

      expect(result).toEqual(mockResult);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/contributions/timing-images/1/extract')
      );
    });
  });

  describe('approveContribution', () => {
    it('should approve contribution with extracted timings', async () => {
      const mockTimings: TimingExtractionResult = {
        origin: 'Chennai',
        timings: [
          {
            destination: 'Madurai',
            morningTimings: ['06:30'],
            afternoonTimings: ['14:00'],
            nightTimings: [],
          },
        ],
        confidence: 0.9,
        rawText: '',
      };

      const mockResponse: TimingImageContribution = {
        id: 1,
        userId: 'user123',
        imageUrl: 'http://example.com/timing1.jpg',
        thumbnailUrl: 'http://example.com/timing1_thumb.jpg',
        originLocation: 'Chennai',
        status: 'APPROVED',
        submissionDate: '2025-11-18T10:00:00',
        processedDate: '2025-11-18T12:00:00',
        processedBy: 'admin',
        extractedTimings: [],
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await busTimingService.approveContribution(1, mockTimings);

      expect(result).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/contributions/timing-images/1/approve'),
        mockTimings
      );
    });
  });

  describe('rejectContribution', () => {
    it('should reject contribution with reason', async () => {
      const mockResponse: TimingImageContribution = {
        id: 1,
        userId: 'user123',
        imageUrl: 'http://example.com/timing1.jpg',
        thumbnailUrl: 'http://example.com/timing1_thumb.jpg',
        originLocation: 'Chennai',
        status: 'REJECTED',
        submissionDate: '2025-11-18T10:00:00',
        processedDate: '2025-11-18T12:00:00',
        processedBy: 'admin',
        validationMessage: 'Image quality too poor',
        extractedTimings: [],
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await busTimingService.rejectContribution(1, 'Image quality too poor');

      expect(result).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/admin/contributions/timing-images/1/reject'),
        { reason: 'Image quality too poor' }
      );
    });
  });

  describe('getMyContributions', () => {
    it('should fetch contributions for a specific user', async () => {
      const mockContributions: TimingImageContribution[] = [
        {
          id: 1,
          userId: 'user123',
          imageUrl: 'http://example.com/timing1.jpg',
          thumbnailUrl: 'http://example.com/timing1_thumb.jpg',
          originLocation: 'Chennai',
          status: 'APPROVED',
          submissionDate: '2025-11-18T10:00:00',
          extractedTimings: [],
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockContributions });

      const result = await busTimingService.getMyContributions('user123');

      expect(result).toEqual(mockContributions);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contributions/timing-images/user/user123')
      );
    });
  });

  describe('deleteContribution', () => {
    it('should delete contribution successfully', async () => {
      mockedAxios.delete.mockResolvedValue({ data: null });

      await busTimingService.deleteContribution(1);

      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contributions/timing-images/1')
      );
    });

    it('should handle delete errors', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(busTimingService.deleteContribution(1)).rejects.toThrow('Delete failed');
    });
  });
});
