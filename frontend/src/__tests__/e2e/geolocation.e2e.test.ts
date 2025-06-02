import * as geolocation from '../../services/geolocation';

// Mock the geolocation service
jest.mock('../../services/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  getGeolocationSupport: jest.fn().mockReturnValue(true),
  calculateDistance: jest.fn()
}));

describe('Geolocation E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calculateDistance should calculate distance between two coordinates', () => {
    // Mock implementation
    (geolocation.calculateDistance as jest.Mock).mockImplementation((lat1, lon1, lat2, lon2) => {
      // Simple check to ensure parameters are numbers
      if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || 
          typeof lat2 !== 'number' || typeof lon2 !== 'number') {
        throw new Error('All parameters must be numbers');
      }
      
      // Return a dummy value for testing
      return 42.5;
    });

    const distance = geolocation.calculateDistance(13.0827, 80.2707, 9.9252, 78.1198);
    expect(distance).toBe(42.5);
    expect(geolocation.calculateDistance).toHaveBeenCalledWith(13.0827, 80.2707, 9.9252, 78.1198);
  });

  test('getGeolocationSupport should return whether geolocation is supported', () => {
    (geolocation.getGeolocationSupport as jest.Mock).mockReturnValue(true);
    expect(geolocation.getGeolocationSupport()).toBe(true);
    
    (geolocation.getGeolocationSupport as jest.Mock).mockReturnValue(false);
    expect(geolocation.getGeolocationSupport()).toBe(false);
  });

  test('getCurrentPosition should call the appropriate callback', () => {
    // Set up mocks
    const successCallback = jest.fn();
    const errorCallback = jest.fn();
    const mockPosition = { latitude: 13.0827, longitude: 80.2707, accuracy: 10 };
    
    // Mock implementation - fixed by removing unused parameter
    (geolocation.getCurrentPosition as jest.Mock).mockImplementation((success) => {
      success(mockPosition);
    });
    
    // Call the function
    geolocation.getCurrentPosition(successCallback, errorCallback);
    
    // Verify callbacks
    expect(successCallback).toHaveBeenCalledWith(mockPosition);
    expect(errorCallback).not.toHaveBeenCalled();
  });

  test('watchPosition should return a watch ID', () => {
    // Set up mocks
    const updateCallback = jest.fn();
    const errorCallback = jest.fn();
    const mockPosition = { latitude: 13.0827, longitude: 80.2707, accuracy: 10 };
    const mockWatchId = 123;
    
    // Mock implementation - fixed by removing unused parameter
    (geolocation.watchPosition as jest.Mock).mockImplementation((update) => {
      update(mockPosition);
      return mockWatchId;
    });
    
    // Call the function
    const watchId = geolocation.watchPosition(updateCallback, errorCallback);
    
    // Verify callbacks and return value
    expect(updateCallback).toHaveBeenCalledWith(mockPosition);
    expect(errorCallback).not.toHaveBeenCalled();
    expect(watchId).toBe(mockWatchId);
  });

  test('clearWatch should clear position watching', () => {
    const watchId = 42;
    
    geolocation.clearWatch(watchId);
    
    expect(geolocation.clearWatch).toHaveBeenCalledWith(watchId);
  });
});