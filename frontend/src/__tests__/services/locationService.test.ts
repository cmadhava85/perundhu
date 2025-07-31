import { searchLocations, validateLocation } from '../../services/locationService';
import * as apiModule from '../../services/api';
import * as offlineModule from '../../services/offlineService';
import type { Location } from '../../types';

// Mock i18n
jest.mock('../../i18n', () => ({
  language: 'en',
}));

// Properly mock the modules with correct TypeScript typing
jest.mock('../../services/api', () => {
  return {
    api: {
      get: jest.fn(),
      post: jest.fn()
    }
  };
});

jest.mock('../../services/offlineService', () => ({
  getLocationsOffline: jest.fn(),
  saveLocationsOffline: jest.fn()
}));

describe('Location Service', () => {
  const mockOfflineLocations: Location[] = [
    { id: 1, name: 'Chennai Central', latitude: 13.0827, longitude: 80.2707 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up API mocks properly using type assertions to help TypeScript
    const mockGet = jest.fn().mockResolvedValue({ data: mockOfflineLocations });
    const mockPost = jest.fn().mockResolvedValue({ data: { valid: true } });
    
    // Use type assertions to help TypeScript recognize mock functions
    (apiModule.api.get as jest.Mock).mockImplementation(mockGet);
    (apiModule.api.post as jest.Mock).mockImplementation(mockPost);
    
    // Default implementations for offline module
    (offlineModule.getLocationsOffline as jest.Mock).mockResolvedValue(mockOfflineLocations);
    (offlineModule.saveLocationsOffline as jest.Mock).mockResolvedValue(true);
  });

  describe('searchLocations', () => {
    it('should call the API with the correct parameters', async () => {
      // Arrange
      const query = 'Chennai';
      const dbResults = [{ ...mockOfflineLocations[0], source: 'database' }];
      const mapResults = [{ ...mockOfflineLocations[0], name: 'Chennai Maps', id: 2, source: 'map' }];
      
      // Set up sequential responses for database and map API calls
      (apiModule.api.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockOfflineLocations }) // Database call
        .mockResolvedValueOnce({ data: [{ name: 'Chennai Maps', id: 2 }] }); // Map API call
      
      // Act
      const result = await searchLocations(query);

      // Assert - check API was called with correct params
      expect(apiModule.api.get).toHaveBeenCalledWith(
        '/api/v1/locations/search',
        expect.objectContaining({
          params: expect.objectContaining({
            query: 'Chennai',
            source: 'database'
          })
        })
      );
      
      // Check that source properties are correctly set in the results
      expect(result.length).toBe(2);
      expect(result[0].source).toBe('database');
      expect(result[1].source).toBe('map');
    });

    it('should fallback to offline locations when API fails', async () => {
      // Arrange
      const query = 'Chennai';
      (apiModule.api.get as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      (offlineModule.getLocationsOffline as jest.Mock).mockResolvedValueOnce(mockOfflineLocations);

      // Act
      const result = await searchLocations(query);

      // Assert - check that offline results have source property
      expect(result.length).toBe(1);
      expect(result[0].source).toBe('offline');
      expect(result[0].name).toBe('Chennai Central');
    });

    it('should filter results to match the query', async () => {
      // Arrange
      const query = 'Chen';
      const mockResponse = [
        { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
        { id: 2, name: 'Chengalpattu', latitude: 12.6819, longitude: 79.9732 }
      ];
      
      // Override the mock behavior for this specific test - Return 2 items for database, but make sure map returns empty array
      (apiModule.api.get as jest.Mock)
        .mockResolvedValueOnce({ data: mockResponse }) // Database call
        .mockResolvedValueOnce({ data: [] }); // Map API call - returns empty array
      
      // Act
      const result = await searchLocations(query);
      
      // Assert
      expect(result.length).toBe(2); // Now this test should pass
      expect(result[0].source).toBe('database');
      expect(result[1].source).toBe('database');
      result.forEach(location => {
        expect(location.name.toLowerCase()).toContain('chen');
      });
    });
    
    it('should use local filtering for short queries', async () => {
      // Arrange
      const query = 'C';  // Short query
      const localLocations = [
        { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
        { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 }
      ];
      
      // Act
      const result = await searchLocations(query, 10, localLocations);
      
      // Assert - API should not be called, only local filtering used
      expect(apiModule.api.get).not.toHaveBeenCalled();
      expect(result.length).toBe(1);
      expect(result[0].source).toBe('local');  // Check source property is set
      expect(result[0].name).toBe('Chennai');
    });
  });

  describe('validateLocation', () => {
    it('should validate a location correctly', async () => {
      // Explicitly make sure this mock returns { data: { valid: true }}
      (apiModule.api.post as jest.Mock).mockResolvedValueOnce({ data: { valid: true } });
      
      // Arrange
      const locationName = 'Chennai';
      const latitude = 13.0827;
      const longitude = 80.2707;

      // Act
      const result = await validateLocation(locationName, latitude, longitude);

      // Assert
      expect(result).toBe(true);
      expect(apiModule.api.post).toHaveBeenCalledWith('/api/v1/locations/validate', {
        name: locationName,
        latitude: latitude,
        longitude: longitude
      });
    });

    it('should fallback to offline location check when API fails', async () => {
      // Arrange
      const locationName = 'Chennai Central';
      const latitude = 13.0827;
      const longitude = 80.2707;
      (apiModule.api.post as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      // Make sure the offline check returns true
      (offlineModule.getLocationsOffline as jest.Mock).mockResolvedValueOnce([
        { id: 1, name: 'Chennai Central', latitude: 13.0827, longitude: 80.2707 }
      ]);

      // Act
      const result = await validateLocation(locationName, latitude, longitude);

      // Assert - just check the result
      expect(result).toBe(true);
    });

    it('should return true when all validations fail (fallback behavior)', async () => {
      // Arrange
      const locationName = 'Unknown Location';
      const latitude = 0;
      const longitude = 0;
      (apiModule.api.post as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      (offlineModule.getLocationsOffline as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));

      // Act
      const result = await validateLocation(locationName, latitude, longitude);

      // Assert
      // Should default to true as a fallback to prevent blocking users
      expect(result).toBe(true);
    });
  });
});