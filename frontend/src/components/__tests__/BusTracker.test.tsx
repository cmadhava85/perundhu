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

  const mockDeviceId = 'device_1234567890_abc123xyz';

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

    // Mock geolocation
    (global.navigator.geolocation as unknown) = {
      watchPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: 13.0827,
            longitude: 80.2707,
            accuracy: 15.5,
            speed: 5.2
          }
        });
        return 1;
      }),
      clearWatch: vi.fn()
    };

    // Reset fetch mock
    (global.fetch as unknown as jest.Mock).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Anonymous Tracking', () => {
    it('should show anonymous banner when user is not authenticated', () => {
      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      expect(screen.getByText(/Tracking anonymously using device ID/i)).toBeInTheDocument();
      expect(screen.getByText(/Login to link your contributions/i)).toBeInTheDocument();
    });

    it('should use device ID as reporterId when not authenticated', async () => {
      (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      // Select bus and stop
      fireEvent.change(screen.getByDisplayValue('-- Choose bus --'), {
        target: { value: '1' }
      });

      fireEvent.change(screen.getByDisplayValue('-- Choose stop --'), {
        target: { value: '1' }
      });

      // Start tracking
      const startButton = screen.getByText(/I'm boarding this bus/i);
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

    it('should not show anonymous banner when user is authenticated', () => {
      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      expect(screen.queryByText(/Tracking anonymously/i)).not.toBeInTheDocument();
    });

    it('should use user ID as reporterId when authenticated', async () => {
      (global.fetch as unknown as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });

      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      // Select bus and stop
      fireEvent.change(screen.getByDisplayValue('-- Choose bus --'), {
        target: { value: '1' }
      });

      fireEvent.change(screen.getByDisplayValue('-- Choose stop --'), {
        target: { value: '1' }
      });

      // Start tracking
      const startButton = screen.getByText(/I'm boarding this bus/i);
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

      fireEvent.change(screen.getByDisplayValue('-- Choose bus --'), {
        target: { value: '1' }
      });

      fireEvent.change(screen.getByDisplayValue('-- Choose stop --'), {
        target: { value: '1' }
      });

      fireEvent.click(screen.getByText(/I'm boarding this bus/i));

      await waitFor(() => {
        const call = ((global.fetch as unknown as jest.Mock).mock.calls[0] as unknown[]);
        const body = JSON.parse((call[1] as { body: string }).body);

        expect(body).toHaveProperty('reporterId');
        expect(body.reporterId).toBe(mockDeviceId);
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

      fireEvent.change(screen.getByDisplayValue('-- Choose bus --'), {
        target: { value: '1' }
      });

      fireEvent.change(screen.getByDisplayValue('-- Choose stop --'), {
        target: { value: '1' }
      });

      fireEvent.click(screen.getByText(/I'm boarding this bus/i));

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

      const toggle = screen.getByRole('checkbox');
      expect(toggle).not.toBeChecked();

      fireEvent.click(toggle);

      expect(toggle).toBeChecked();
    });

    it('should show error if bus and stop not selected', async () => {
      render(
        <BusTracker buses={mockBuses} stops={mockStops} />
      );

      const toggle = screen.getByRole('checkbox');
      fireEvent.click(toggle);

      // Try to click start button without selecting bus/stop
      // The start button should not appear
      expect(screen.queryByText(/I'm boarding this bus/i)).not.toBeInTheDocument();
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

      // Start tracking
      fireEvent.change(screen.getByDisplayValue('-- Choose bus --'), {
        target: { value: '1' }
      });

      fireEvent.change(screen.getByDisplayValue('-- Choose stop --'), {
        target: { value: '1' }
      });

      fireEvent.click(screen.getByText(/I'm boarding this bus/i));

      await waitFor(() => {
        expect(screen.getByText(/I've reached my destination/i)).toBeInTheDocument();
      });

      // Stop tracking
      fireEvent.click(screen.getByText(/I've reached my destination/i));

      // Should return to initial state
      expect(screen.getByText(/I'm boarding this bus/i)).toBeInTheDocument();
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
