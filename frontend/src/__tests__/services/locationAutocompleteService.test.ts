import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { LocationAutocompleteService, locationAutocompleteService, type LocationSuggestion } from '../../services/locationAutocompleteService';
import { GeocodingService } from '../../services/geocodingService';
import * as apiModule from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    get: vi.fn()
  }
}));

// Mock the GeocodingService
vi.mock('../../services/geocodingService', () => ({
  GeocodingService: {
    getInstantSuggestions: vi.fn()
  }
}));

// Mock fetch for Nominatim calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('LocationAutocompleteService', () => {
  let service: LocationAutocompleteService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new LocationAutocompleteService();
    
    // Default mock for console to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    service.clearDebounce();
    vi.restoreAllMocks();
  });

  describe('getLocationSuggestions', () => {
    test('should return empty array for queries shorter than 3 characters', async () => {
      const result1 = await service.getLocationSuggestions('Ch');
      const result2 = await service.getLocationSuggestions('A');
      const result3 = await service.getLocationSuggestions('');

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toEqual([]);
    });

    test('should return database results when available', async () => {
      const mockDbResults = [
        { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
        { id: 2, name: 'Chennai Central', latitude: 13.0878, longitude: 80.2785 }
      ];

      vi.mocked(apiModule.api.get).mockResolvedValue({ data: mockDbResults });

      const result = await service.getLocationSuggestions('Chennai');

      expect(apiModule.api.get).toHaveBeenCalledWith(
        '/api/v1/bus-schedules/locations/autocomplete',
        expect.objectContaining({
          params: { q: 'Chennai', language: 'en' }
        })
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Chennai');
      expect(result[0].source).toBe('database');
    });

    test('should check local cities (instant suggestions) when database is empty', async () => {
      const mockLocalCities = [
        { id: 101, name: 'Aruppukottai', latitude: 9.5125, longitude: 78.0958, source: 'local' }
      ];

      // Database returns empty
      vi.mocked(apiModule.api.get).mockResolvedValue({ data: [] });
      
      // Local cities have results
      vi.mocked(GeocodingService.getInstantSuggestions).mockReturnValue(mockLocalCities);

      const result = await service.getLocationSuggestions('Arupp');

      expect(GeocodingService.getInstantSuggestions).toHaveBeenCalledWith('Arupp', 10);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Aruppukottai');
      expect(result[0].source).toBe('local');
      
      // Nominatim should NOT be called since we found local results
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should fall back to Nominatim when both database and local are empty', async () => {
      // Database returns empty
      vi.mocked(apiModule.api.get).mockResolvedValue({ data: [] });
      
      // Local cities also empty
      vi.mocked(GeocodingService.getInstantSuggestions).mockReturnValue([]);

      // Mock Nominatim response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [
          {
            display_name: 'Test City, Tamil Nadu, India',
            lat: '10.123',
            lon: '78.456',
            type: 'city',
            addresstype: 'city',
            class: 'place'
          }
        ]
      });

      const result = await service.getLocationSuggestions('TestCity');

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Test City');
      expect(result[0].source).toBe('nominatim');
    });

    test('should prioritize database results over local and Nominatim', async () => {
      const mockDbResults = [
        { id: 1, name: 'Madurai', latitude: 9.9252, longitude: 78.1198 }
      ];

      vi.mocked(apiModule.api.get).mockResolvedValue({ data: mockDbResults });

      const result = await service.getLocationSuggestions('Madurai');

      // Should return database results
      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('database');
      
      // Local and Nominatim should NOT be called when database has results
      expect(GeocodingService.getInstantSuggestions).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should handle database timeout gracefully', async () => {
      // Simulate timeout by rejecting with AbortError
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      vi.mocked(apiModule.api.get).mockRejectedValue(abortError);

      // Local cities have results
      const mockLocalCities = [
        { id: 101, name: 'Virudhunagar', latitude: 9.5857, longitude: 77.9624, source: 'local' }
      ];
      vi.mocked(GeocodingService.getInstantSuggestions).mockReturnValue(mockLocalCities);

      const result = await service.getLocationSuggestions('Virud');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Virudhunagar');
    });

    test('should filter Nominatim results to only include cities/towns', async () => {
      vi.mocked(apiModule.api.get).mockResolvedValue({ data: [] });
      vi.mocked(GeocodingService.getInstantSuggestions).mockReturnValue([]);

      // Mock Nominatim with mixed results (city + road)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [
          {
            display_name: 'Trichy, Tamil Nadu, India',
            lat: '10.790',
            lon: '78.704',
            type: 'city',
            addresstype: 'city',
            class: 'place'
          },
          {
            display_name: 'Trichy Road, Tamil Nadu, India',
            lat: '10.800',
            lon: '78.700',
            type: 'road',
            addresstype: 'road',
            class: 'highway'
          }
        ]
      });

      const result = await service.getLocationSuggestions('Trichy');

      // Should only include the city, not the road
      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Trichy');
    });
  });

  describe('getDebouncedSuggestions', () => {
    test('should debounce rapid calls', async () => {
      vi.useFakeTimers();
      
      const callback = vi.fn();
      vi.mocked(apiModule.api.get).mockResolvedValue({ data: [] });
      vi.mocked(GeocodingService.getInstantSuggestions).mockReturnValue([]);

      // Rapid calls
      service.getDebouncedSuggestions('Che', callback);
      service.getDebouncedSuggestions('Chen', callback);
      service.getDebouncedSuggestions('Chenn', callback);
      service.getDebouncedSuggestions('Chenna', callback);
      service.getDebouncedSuggestions('Chennai', callback);

      // Advance timers
      await vi.advanceTimersByTimeAsync(200);

      // Only the last call should have been executed
      expect(apiModule.api.get).toHaveBeenCalledTimes(1);
      expect(apiModule.api.get).toHaveBeenCalledWith(
        '/api/v1/bus-schedules/locations/autocomplete',
        expect.objectContaining({
          params: { q: 'Chennai', language: 'en' }
        })
      );

      vi.useRealTimers();
    });

    test('should use faster debounce for short queries', async () => {
      vi.useFakeTimers();
      
      const callback = vi.fn();
      vi.mocked(apiModule.api.get).mockResolvedValue({ data: [] });
      vi.mocked(GeocodingService.getInstantSuggestions).mockReturnValue([]);

      // Short query (3 chars) should use INSTANT_DEBOUNCE (50ms)
      service.getDebouncedSuggestions('Mad', callback);
      
      // Advance by 50ms - should trigger
      await vi.advanceTimersByTimeAsync(60);

      expect(apiModule.api.get).toHaveBeenCalled();

      vi.useRealTimers();
    });

    test('should clear debounce when clearDebounce is called', () => {
      vi.useFakeTimers();
      
      const callback = vi.fn();
      service.getDebouncedSuggestions('Chennai', callback);
      
      // Clear before it fires
      service.clearDebounce();
      
      vi.advanceTimersByTime(200);

      // Callback should NOT have been called
      expect(callback).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('singleton instance', () => {
    test('should export a singleton instance', () => {
      expect(locationAutocompleteService).toBeInstanceOf(LocationAutocompleteService);
    });
  });
});

describe('Aruppukottai spelling variants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('should find Aruppukottai from local cities when database is empty', async () => {
    const service = new LocationAutocompleteService();
    
    // Database returns empty (simulating the issue where DB doesn't have this city)
    vi.mocked(apiModule.api.get).mockResolvedValue({ data: [] });
    
    // Local cities should include Aruppukottai
    const mockLocalCities = [
      { id: 101, name: 'Aruppukottai', latitude: 9.5125, longitude: 78.0958, source: 'local' }
    ];
    vi.mocked(GeocodingService.getInstantSuggestions).mockReturnValue(mockLocalCities);

    const result = await service.getLocationSuggestions('Arupp');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Aruppukottai');
    expect(result[0].source).toBe('local');
    
    // Should NOT call Nominatim since we found it locally
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('should find Aruppukkottai (alternate spelling) from local cities', async () => {
    const service = new LocationAutocompleteService();
    
    vi.mocked(apiModule.api.get).mockResolvedValue({ data: [] });
    
    // Local cities include the alternate spelling (as OSM uses it)
    const mockLocalCities = [
      { id: 101, name: 'Aruppukottai', latitude: 9.5125, longitude: 78.0958, source: 'local' },
      { id: 102, name: 'Aruppukkottai', latitude: 9.5125, longitude: 78.0958, source: 'local' }
    ];
    vi.mocked(GeocodingService.getInstantSuggestions).mockReturnValue(mockLocalCities);

    const result = await service.getLocationSuggestions('Aruppukk');

    expect(result.length).toBeGreaterThan(0);
    expect(result.some(r => r.name.toLowerCase().includes('aruppuk'))).toBe(true);
  });
});
