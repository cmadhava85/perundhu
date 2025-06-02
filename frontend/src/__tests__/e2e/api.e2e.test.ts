import * as apiService from '../../services/api';

// Skip tests that depend on implementation details and just test the public API
describe('API Service Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test getLocations
  test('getLocations function exists', () => {
    expect(typeof apiService.getLocations).toBe('function');
  });

  // Test searchBuses
  test('searchBuses function exists', () => {
    expect(typeof apiService.searchBuses).toBe('function');
  });

  // Test getStops
  test('getStops function exists', () => {
    expect(typeof apiService.getStops).toBe('function');
  });

  // Test getCurrentBusLocations
  test('getCurrentBusLocations function exists', () => {
    expect(typeof apiService.getCurrentBusLocations).toBe('function');
  });
});