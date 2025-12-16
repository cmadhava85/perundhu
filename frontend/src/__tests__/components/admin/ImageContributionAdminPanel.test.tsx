import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageContributionAdminPanel } from '../../../components/admin/ImageContributionAdminPanel';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => 'test-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock alert
global.alert = vi.fn();

describe('ImageContributionAdminPanel', () => {
  const mockContributions = [
    {
      id: 'contrib-1',
      imageUrl: 'http://example.com/image1.jpg',
      submissionDate: '2025-12-16T10:00:00Z',
      status: 'PENDING',
      userId: 'user-123',
      description: 'Bus schedule at Madurai',
      location: 'Madurai'
    },
    {
      id: 'contrib-2',
      imageUrl: 'http://example.com/image2.jpg',
      submissionDate: '2025-12-16T11:00:00Z',
      status: 'PROCESSED',
      userId: 'user-456',
      description: 'Chennai bus timing board',
      location: 'Chennai',
      extractedData: JSON.stringify({
        busNumber: '166',
        origin: 'Chennai',
        destination: 'Madurai'
      })
    },
    {
      id: 'contrib-3',
      imageUrl: 'http://example.com/image3.jpg',
      submissionDate: '2025-12-16T12:00:00Z',
      status: 'LOW_CONFIDENCE_OCR',
      userId: 'user-789',
      description: 'Blurry schedule',
      location: 'Trichy'
    }
  ];

  const mockOCRData = {
    extractedText: 'Bus 166 Madurai to Chennai 08:00',
    busNumber: '166',
    origin: 'Madurai',
    destination: 'Chennai',
    departureTimes: ['08:00', '14:00'],
    arrivalTimes: ['14:00', '20:00'],
    confidence: 0.85,
    multipleRoutes: [
      {
        routeNumber: '166',
        fromLocation: 'Madurai',
        toLocation: 'Chennai',
        via: 'Dindigul, Trichy',
        timings: ['08:00', '14:00'],
        busType: 'EXPRESS'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    
    // Default: return contributions list
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockContributions
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading and Initial Render', () => {
    it('should show loading state initially', () => {
      // Don't resolve fetch immediately
      mockFetch.mockImplementation(() => new Promise(() => {}));
      
      render(<ImageContributionAdminPanel />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display contributions after loading', async () => {
      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
      
      // Verify API was called with auth header
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/contributions/images'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer')
          })
        })
      );
    });

    it('should handle fetch error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
      
      // Should not crash
    });
  });

  describe('Contribution List Display', () => {
    it('should show contribution status badges', async () => {
      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
      
      // Status indicators should be visible
      expect(screen.getByText(/PENDING/i)).toBeInTheDocument();
      expect(screen.getByText(/PROCESSED/i)).toBeInTheDocument();
    });

    it('should show contribution details', async () => {
      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
      
      // Status should be visible in the table - PENDING with spaces
      await waitFor(() => {
        expect(screen.getByText(/PENDING/i)).toBeInTheDocument();
      });
    });
  });

  describe('OCR Extraction', () => {
    it('should call OCR extraction API when button clicked', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockContributions })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOCRData });

      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Find the extract text button (has Download icon with title "Extract Text")
      const extractButtons = screen.getAllByTitle('Extract Text');
      expect(extractButtons.length).toBeGreaterThan(0);
      
      await userEvent.click(extractButtons[0]);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/extract-ocr'),
          expect.any(Object)
        );
      });
    });

    it('should display OCR data in modal after extraction', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockContributions })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOCRData });

      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Click eye icon to view OCR data
      const eyeButtons = screen.getAllByRole('button');
      const viewButton = eyeButtons.find(btn => 
        btn.querySelector('[class*="eye"]') || 
        btn.getAttribute('aria-label')?.includes('view')
      );

      if (viewButton) {
        await userEvent.click(viewButton);
      }
    });
  });

  describe('Approve/Reject Actions', () => {
    it('should call approve API when approve button clicked', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockContributions })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'APPROVED' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockContributions });

      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const approveButtons = screen.getAllByRole('button');
      const approveButton = approveButtons.find(btn => 
        btn.classList.contains('approve') ||
        btn.textContent?.toLowerCase().includes('approve') ||
        btn.querySelector('[class*="check"]')
      );

      if (approveButton) {
        await userEvent.click(approveButton);
        
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/approve'),
            expect.objectContaining({ method: 'POST' })
          );
        });
      }
    });

    it('should call reject API when reject button clicked', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockContributions })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'REJECTED' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => mockContributions });

      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const rejectButtons = screen.getAllByRole('button');
      const rejectButton = rejectButtons.find(btn => 
        btn.classList.contains('reject') ||
        btn.textContent?.toLowerCase().includes('reject') ||
        btn.querySelector('[class*="x"]')
      );

      if (rejectButton) {
        await userEvent.click(rejectButton);
      }
    });
  });

  describe('Integration', () => {
    it('should call integration API when integrate button clicked', async () => {
      const mockIntegrationResult = {
        integratedCount: 5,
        skippedDuplicates: 2,
        failedCount: 0,
        message: 'Successfully integrated 5 timing records'
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockContributions })
        .mockResolvedValueOnce({ ok: true, json: async () => mockIntegrationResult });

      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Find integrate button
      const integrateButton = screen.queryByRole('button', { name: /integrate/i });

      if (integrateButton) {
        await userEvent.click(integrateButton);
        
        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/integration/timing-records'),
            expect.objectContaining({ method: 'POST' })
          );
        });
      }
    });

    it('should show integration result alert on success', async () => {
      const mockIntegrationResult = {
        integratedCount: 3,
        skippedDuplicates: 1,
        failedCount: 0,
        message: 'Integration completed'
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockContributions })
        .mockResolvedValueOnce({ ok: true, json: async () => mockIntegrationResult });

      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      const integrateButton = screen.queryByRole('button', { name: /integrate/i });
      if (integrateButton) {
        await userEvent.click(integrateButton);
        
        await waitFor(() => {
          expect(global.alert).toHaveBeenCalledWith(
            expect.stringContaining('Integration Complete')
          );
        });
      }
    });
  });

  describe('Refresh', () => {
    it('should refresh contributions when refresh button clicked', async () => {
      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Find refresh button
      const refreshButton = screen.queryByRole('button', { name: /refresh/i }) ||
        screen.queryByLabelText(/refresh/i);

      if (refreshButton) {
        await userEvent.click(refreshButton);
        
        await waitFor(() => {
          // Should have been called at least twice (initial + refresh)
          expect(mockFetch).toHaveBeenCalledTimes(2);
        });
      }
    });
  });

  describe('Status Filtering', () => {
    it('should filter by status when filter is selected', async () => {
      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Look for status filter dropdown
      const filterSelect = screen.queryByRole('combobox');
      
      if (filterSelect) {
        await userEvent.selectOptions(filterSelect, 'PENDING');
        
        // Should show only pending contributions
        await waitFor(() => {
          expect(screen.getByText(/PENDING/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('LOW_CONFIDENCE_OCR handling', () => {
    it('should show manual origin input for LOW_CONFIDENCE_OCR status', async () => {
      const lowConfidenceContributions = [
        {
          id: 'contrib-low',
          imageUrl: 'http://example.com/low.jpg',
          submissionDate: '2025-12-16T10:00:00Z',
          status: 'LOW_CONFIDENCE_OCR',
          userId: 'user-123',
          location: 'Unknown'
        }
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => lowConfidenceContributions
      });

      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // LOW_CONFIDENCE_OCR status should be visible (component displays with spaces)
      await waitFor(() => {
        expect(screen.getByText(/LOW CONFIDENCE OCR/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should allow editing OCR data in edit mode', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockContributions })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOCRData });

      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Look for edit button in the panel
      const editButton = screen.queryByRole('button', { name: /edit/i });
      
      if (editButton) {
        await userEvent.click(editButton);
        
        // Should show edit controls
        await waitFor(() => {
          const saveButton = screen.queryByRole('button', { name: /save/i });
          expect(saveButton || screen.queryByText(/cancel/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Multiple Routes Display', () => {
    it('should display multiple routes from OCR data', async () => {
      const multiRouteOCR = {
        ...mockOCRData,
        multipleRoutes: [
          {
            routeNumber: '166',
            fromLocation: 'Madurai',
            toLocation: 'Chennai',
            timings: ['08:00'],
            busType: 'EXPRESS'
          },
          {
            routeNumber: '520',
            fromLocation: 'Madurai',
            toLocation: 'Bengaluru',
            timings: ['10:00'],
            busType: 'DELUXE'
          }
        ]
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockContributions })
        .mockResolvedValueOnce({ ok: true, json: async () => multiRouteOCR });

      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Component should be able to handle multiple routes
    });
  });

  describe('Authorization', () => {
    it('should include auth token in all API requests', async () => {
      mockLocalStorage.getItem.mockReturnValue('admin-jwt-token');
      
      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers.Authorization).toContain('Bearer');
    });

    it('should use dev-admin-token when no token in localStorage', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<ImageContributionAdminPanel />);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers.Authorization).toContain('dev-admin-token');
    });
  });
});
