import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import BusTracker from '../BusTracker';
import { useAuth } from '../../hooks/useAuth';
import { getOrCreateDeviceId } from '../../utils/deviceId';
import type { Bus, Stop } from '../../types';

// Mock hooks and utilities
vi.mock('../../hooks/useAuth');
vi.mock('../../utils/deviceId');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' }
  })
}));

// Mock fetch API
global.fetch = vi.fn();

describe('BusTracker Component with Device ID', () => {
  const mockBus: Bus = {
    id: 1,
    busName: 'Chennai Express',
    busNumber: 'TN01AB1234',
    from: 'Chennai',
    to: 'Coimbatore',
    departureTime: '08:00',
    arrivalTime: '14:00'
  };

  const mockStop: Stop = {
    id: 1,
    name: 'Chennai Central',
    arrivalTime: '08:00',
    departureTime: '08:05',
    order: 1,
    busId: 1
  };

  const mockBuses: Bus[] = [mockBus];
  const mockStops: Record<number, Stop[]> = {
    1: [mockStop]
  };

  const mockDeviceId = '1234567890_abc123xyz';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Mock authenticated user
    (useAuth as unknown as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn()
    });

    // Mock device ID
    (getOrCreateDeviceId as unknown as jest.Mock).mockReturnValue(mockDeviceId);

    // Mock geolocation with both getCurrentPosition and watchPosition
    const mockPosition = {
      coords: {
        latitude: 13.0827,
        longitude: 80.2707,
        accuracy: 15.5,
        speed: 5.2,
        heading: 0,
        altitude: 0,
        altitudeAccuracy: 0
      },
      timestamp: Date.now()
    };

    // Mock geolocation properly for happy-dom
    Object.defineProperty(global.navigator, 'geolocation', {
      writable: true,
      value: {
        getCurrentPosition: vi.fn((success) => {
          success(mockPosition);
        }),
        watchPosition: vi.fn((success) => {
          success(mockPosition);
          return 1;
        }),
        clearWatch: vi.fn()
      }
    });

    // Reset fetch mock
    (global.fetch as unknown as jest.Mock).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Anonymous Tracking', () => {
    it('should show anonymous banner when user is not authenticated', async () => {
      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Tracking anonymously/i)).toBeInTheDocument();
      });
    });

    it('should use device ID as reporterId when not authenticated', async () => {
      (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      // Enable tracking to show select elements
      const trackingToggle = screen.getByLabelText('Enable bus tracking');
      fireEvent.click(trackingToggle);

      // Wait for the select elements to be rendered
      await waitFor(() => {
        expect(screen.getByDisplayValue('-- Choose bus --')).toBeInTheDocument();
      });

      // Select bus and stop
      fireEvent.change(screen.getByDisplayValue('-- Choose bus --'), {
        target: { value: '1' }
      });

      fireEvent.change(screen.getByDisplayValue('-- Choose stop --'), {
        target: { value: '1' }
      });

      // Start tracking
      const startButton = screen.getByRole('button', { name: /I'm boarding this bus/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect((global.fetch as unknown as jest.Mock)).toHaveBeenCalledWith(
          '/api/v1/bus-tracking/report',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining(mockDeviceId)
          })
        );
      });
    });

    it('should create device ID on component mount', () => {
      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      expect((getOrCreateDeviceId as unknown as jest.Mock)).toHaveBeenCalled();
    });
  });

  describe('Authenticated User Tracking', () => {
    beforeEach(() => {
      // Mock authenticated user
      (useAuth as unknown as jest.Mock).mockReturnValue({
        user: { id: 'user_john@example.com', email: 'john@example.com', role: 'USER' },
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn()
      });
    });

    it('should not show anonymous banner when user is authenticated', async () => {
      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      await waitFor(() => {
        expect(screen.queryByText(/Tracking anonymously/i)).not.toBeInTheDocument();
      });
    });

    it('should use user ID as reporterId when authenticated', async () => {
      (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      // Enable tracking to show select elements
      const trackingToggle = screen.getByLabelText('Enable bus tracking');
      fireEvent.click(trackingToggle);

      // Wait for the select elements to be rendered
      await waitFor(() => {
        expect(screen.getByDisplayValue('-- Choose bus --')).toBeInTheDocument();
      });

      // Select bus and stop
      fireEvent.change(screen.getByDisplayValue('-- Choose bus --'), {
        target: { value: '1' }
      });

      fireEvent.change(screen.getByDisplayValue('-- Choose stop --'), {
        target: { value: '1' }
      });

      // Start tracking
      const startButton = screen.getByRole('button', { name: /I'm boarding this bus/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect((global.fetch as unknown as jest.Mock)).toHaveBeenCalledWith(
          '/api/v1/bus-tracking/report',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('user_john@example.com')
          })
        );
      });
    });
  });

  describe('Report Location', () => {
    it('should send reporterId in location report', async () => {
      (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      // Enable tracking first to show the select elements
      const trackingToggle = screen.getByLabelText('Enable bus tracking');
      fireEvent.click(trackingToggle);

      // Wait for the select elements to be rendered
      await waitFor(() => {
        expect(screen.getByDisplayValue('-- Choose bus --')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByDisplayValue('-- Choose bus --'), {
        target: { value: '1' }
      });

      fireEvent.change(screen.getByDisplayValue('-- Choose stop --'), {
        target: { value: '1' }
      });

      const boardingButton = screen.getByRole('button', { name: /I'm boarding this bus/i });
      fireEvent.click(boardingButton);

      await waitFor(() => {
        const call = ((global.fetch as unknown as jest.Mock).mock.calls[0] as unknown[]);
        const body = JSON.parse((call[1] as { body: string }).body);

        expect(body).toHaveProperty('reporterId');
        expect(body.reporterId).toBe(`device_${mockDeviceId}`);
      });
    });

    it('should include all required fields in location report', async () => {
      (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      // Enable tracking first to show the select elements
      const trackingToggle = screen.getByLabelText('Enable bus tracking');
      fireEvent.click(trackingToggle);

      // Wait for the select elements to be rendered
      await waitFor(() => {
        expect(screen.getByDisplayValue('-- Choose bus --')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByDisplayValue('-- Choose bus --'), {
        target: { value: '1' }
      });

      fireEvent.change(screen.getByDisplayValue('-- Choose stop --'), {
        target: { value: '1' }
      });

      const boardingButton = screen.getByRole('button', { name: /I'm boarding this bus/i });
      fireEvent.click(boardingButton);

      await waitFor(() => {
        const call = ((global.fetch as unknown as jest.Mock).mock.calls[0] as unknown[]);
        const body = JSON.parse((call[1] as { body: string }).body);

        expect(body).toHaveProperty('busId', 1);
        expect(body).toHaveProperty('stopId', 1);
        expect(body).toHaveProperty('reporterId');
        expect(body).toHaveProperty('latitude');
        expect(body).toHaveProperty('longitude');
        expect(body).toHaveProperty('accuracy');
        expect(body).toHaveProperty('speed');
        expect(body).toHaveProperty('timestamp');
      });
    });
  });

  describe('Toggle Tracking', () => {
    it('should enable tracking when toggle is turned on', async () => {
      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      await waitFor(() => {
        const toggle = screen.getByLabelText('Enable bus tracking');
        expect(toggle).toBeDefined();
        fireEvent.click(toggle);
      });
    });

    it('should show error if bus and stop not selected', async () => {
      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      await waitFor(() => {
        const toggle = screen.getByLabelText('Enable bus tracking');
        expect(toggle).toBeDefined();
        fireEvent.click(toggle);
      });

      // When tracking is enabled, select forms should appear
      await waitFor(() => {
        expect(screen.getByDisplayValue('-- Choose bus --')).toBeInTheDocument();
      });

      // Try to click start button without selecting bus/stop
      // The start button should not appear until both are selected
      expect(screen.queryByRole('button', { name: /I'm boarding this bus/i })).not.toBeInTheDocument();
    });
  });

  describe('Disembarkation', () => {
    it('should handle stopping tracking', async () => {
      (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      // Enable tracking first to show the select elements
      const trackingToggle = screen.getByLabelText('Enable bus tracking');
      fireEvent.click(trackingToggle);

      // Wait for the select elements to be rendered
      await waitFor(() => {
        expect(screen.getByDisplayValue('-- Choose bus --')).toBeInTheDocument();
      });

      // Start tracking
      fireEvent.change(screen.getByDisplayValue('-- Choose bus --'), {
        target: { value: '1' }
      });

      fireEvent.change(screen.getByDisplayValue('-- Choose stop --'), {
        target: { value: '1' }
      });

      // Click the boarding button
      const boardingButton = screen.getByRole('button', { name: /I'm boarding this bus/i });
      fireEvent.click(boardingButton);

      // Wait for the tracking-active section to appear with the stop button
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /I've reached my destination/i })).toBeInTheDocument();
      });

      // Stop tracking
      const stopButton = screen.getByRole('button', { name: /I've reached my destination/i });
      fireEvent.click(stopButton);

      // Should return to showing the select forms (tracking re-enabled but not onboard)
      await waitFor(() => {
        expect(screen.getByDisplayValue('-- Choose bus --')).toBeInTheDocument();
      });
    });
  });

  describe('Translation Keys', () => {
    it('should not show reward points without login', () => {
      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      // Should not show points badge
      expect(screen.queryByText(/points/i)).not.toBeInTheDocument();
    });

    it('should show benefits section', () => {
      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      expect(screen.getByText(/Why track buses?/i)).toBeInTheDocument();
    });
  });
});
