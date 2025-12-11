import { vi, describe, it, expect, beforeEach } from 'vitest';

// Use vi.hoisted to properly initialize mocks before vi.mock calls
const { mockGet, mockPost, mockPatch, mockHead } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
  mockHead: vi.fn(),
}));

// Mock axios at the module level
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      patch: mockPatch,
      head: mockHead,
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  }
}));

// Mock SecurityService
vi.mock('../securityService', () => ({
  default: {
    isRequestAllowed: vi.fn(() => true),
    handleSecurityBreach: vi.fn()
  }
}));

// Import after mocks are set up
import { 
  getLocations, 
  searchBuses, 
  getStops, 
  getConnectingRoutes, 
  getCurrentBusLocations,
  ApiError,
  setOfflineMode,
  getOfflineMode
} from '../api';

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOfflineMode(false); // Reset offline mode
  });

  describe('getLocations', () => {
    it('should fetch locations successfully', async () => {
      const mockLocations = [
        { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
        { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 }
      ];

      mockGet.mockResolvedValue({ data: mockLocations });

      const locations = await getLocations();

      expect(mockGet).toHaveBeenCalledWith('/api/v1/bus-schedules/locations', {
        params: { lang: 'en' }
      });
      expect(locations).toEqual(mockLocations);
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        response: { status: 500, data: { message: 'Internal server error' } },
        isAxiosError: true
      };
      mockGet.mockRejectedValue(errorResponse);

      await expect(getLocations()).rejects.toThrow(ApiError);
    });

    it('should handle network errors', async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));

      await expect(getLocations()).rejects.toThrow(ApiError);
    });
  });

  describe('searchBuses', () => {
    it('should search buses successfully', async () => {
      // Arrange
      const fromLocation = { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 };
      const toLocation = { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 };
      const mockBuses = [
        { id: 1, name: 'Express Bus', fromLocation: 'Chennai', toLocation: 'Bangalore' }
      ];

      mockGet.mockResolvedValue({ data: mockBuses });

      // Act
      const buses = await searchBuses(fromLocation, toLocation);

      // Assert - just verify the API was called correctly and data was returned
      expect(mockGet).toHaveBeenCalledWith('/api/v1/bus-schedules/search', {
        params: {
          fromLocationId: fromLocation.id,
          toLocationId: toLocation.id,
          includeContinuing: false,
          lang: 'en'
        }
      });
      expect(buses).toBeDefined();
      expect(Array.isArray(buses)).toBe(true);
    });
  });

  describe('getStops', () => {
    it('should fetch stops successfully', async () => {
      const mockStops = [
        { id: 1, name: 'Chennai Central', latitude: 13.0827, longitude: 80.2707, order: 1 },
        { id: 2, name: 'Vellore', latitude: 12.9165, longitude: 79.1325, order: 2 }
      ];

      mockGet.mockResolvedValue({ data: mockStops });

      const stops = await getStops(1);

      // Assert - just verify the API was called correctly and data was returned
      expect(mockGet).toHaveBeenCalledWith('/api/v1/bus-schedules/buses/1/stops/basic', {
        params: { lang: 'en' }
      });
      expect(stops).toBeDefined();
      expect(Array.isArray(stops)).toBe(true);
    });
  });

  describe('getConnectingRoutes', () => {
    it('should fetch connecting routes successfully', async () => {
      const mockRoutes = [
        {
          id: 1,
          isDirectRoute: false,
          firstLeg: { from: 'Chennai', to: 'Trichy' },
          connectionPoint: 'Trichy',
          secondLeg: { from: 'Trichy', to: 'Madurai' },
          waitTime: '30 min',
          totalDuration: '8h 30m'
        }
      ];

      mockGet.mockResolvedValue({ data: mockRoutes });

      const routes = await getConnectingRoutes(1, 3);

      expect(mockGet).toHaveBeenCalledWith('/api/v1/bus-schedules/connecting-routes', {
        params: {
          fromLocationId: 1,
          toLocationId: 3
        }
      });
      expect(routes).toEqual(mockRoutes);
    });
  });

  describe('getCurrentBusLocations', () => {
    it('should fetch current bus locations successfully', async () => {
      // Mock the raw data that comes from the API before transformation
      const mockRawLocations = [
        {
          busNumber: 'TN-01-1234',
          latitude: 13.0827,
          longitude: 80.2707,
          speed: 60
        }
      ];

      mockGet.mockResolvedValue({ data: mockRawLocations });

      const locations = await getCurrentBusLocations();

      expect(mockGet).toHaveBeenCalledWith('/api/v1/bus-tracking/live');
      
      // The response should be transformed to include all required BusLocation fields
      expect(locations).toHaveLength(1);
      expect(locations[0]).toMatchObject({
        busNumber: 'TN-01-1234',
        latitude: 13.0827,
        longitude: 80.2707,
        speed: 60,
        busId: 0, // default value
        busName: '', // default value
        fromLocation: '', // default value
        toLocation: '', // default value
        heading: 0, // default value
        lastReportedStopName: '', // default value
        nextStopName: '', // default value
        estimatedArrivalTime: '', // default value
        reportCount: 0, // default value
        confidenceScore: 0 // default value
      });
      expect(locations[0].timestamp).toBeDefined(); // timestamp should be present
    });
  });

  describe('Error Handling', () => {
    it('should create ApiError with proper details', () => {
      const error = new ApiError('Test error', 400, 'TEST_ERROR');
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('ApiError');
    });

    it('should handle offline mode correctly', () => {
      expect(getOfflineMode()).toBe(false);
      
      setOfflineMode(true);
      expect(getOfflineMode()).toBe(true);
      
      setOfflineMode(false);
      expect(getOfflineMode()).toBe(false);
    });

    it('should return empty array in offline mode for getCurrentBusLocations', async () => {
      setOfflineMode(true);
      mockGet.mockRejectedValue(new Error('Network Error'));

      const locations = await getCurrentBusLocations();
      expect(locations).toEqual([]);
    });
  });
});