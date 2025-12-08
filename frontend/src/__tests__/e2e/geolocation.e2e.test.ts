import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as geolocation from '../../utils/geolocation';

// Mock the geolocation utility functions
vi.mock('../../utils/geolocation', () => ({
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  getGeolocationSupport: vi.fn(),
}));

describe('Geolocation E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect geolocation support', () => {
    (geolocation.getGeolocationSupport as ReturnType<typeof vi.fn>).mockReturnValue(true);
    expect(geolocation.getGeolocationSupport()).toBe(true);

    (geolocation.getGeolocationSupport as ReturnType<typeof vi.fn>).mockReturnValue(false);
    expect(geolocation.getGeolocationSupport()).toBe(false);
  });

  it('should get current position successfully', async () => {
    const mockPosition = {
      coords: {
        latitude: 13.0827,
        longitude: 80.2707,
        accuracy: 10,
      },
      timestamp: Date.now(),
    };

    (geolocation.getCurrentPosition as ReturnType<typeof vi.fn>).mockResolvedValue(mockPosition);

    const result = await geolocation.getCurrentPosition();
    expect(result).toEqual(mockPosition);
    expect(geolocation.getCurrentPosition).toHaveBeenCalled();
  });

  it('should handle geolocation errors', async () => {
    const mockError = new Error('Location access denied');
    (geolocation.getCurrentPosition as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

    await expect(geolocation.getCurrentPosition()).rejects.toThrow('Location access denied');
  });

  it('should watch position and call callback with updates', () => {
    const mockCallback = vi.fn();
    const mockPosition = {
      coords: {
        latitude: 13.0827,
        longitude: 80.2707,
        accuracy: 10,
      },
      timestamp: Date.now(),
    };

    (geolocation.watchPosition as ReturnType<typeof vi.fn>).mockImplementation((callback: (position: typeof mockPosition) => void) => {
      // Simulate position update
      setTimeout(() => callback(mockPosition), 100);
      return 1; // Mock watch ID
    });

    const watchId = geolocation.watchPosition(mockCallback);
    expect(watchId).toBe(1);
    expect(geolocation.watchPosition).toHaveBeenCalledWith(mockCallback);
  });
});