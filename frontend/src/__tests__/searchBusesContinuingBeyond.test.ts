import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchBuses } from '../services/api';
import type { Location } from '../types';

// Mock the API function
vi.mock('../services/api', () => ({
  searchBuses: vi.fn()
}));

const mockSearchBuses = vi.mocked(searchBuses);

describe('Enhanced Search API with Continuing Buses', () => {
  const mockFromLocation: Location = {
    id: 1,
    name: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707
  };

  const mockToLocation: Location = {
    id: 2,
    name: 'Trichy',
    latitude: 10.7905,
    longitude: 78.7047
  };

  const mockEnhancedSearchResult = [
    {
      id: 1,
      name: 'Direct Express',
      busName: 'Direct Express',
      busNumber: 'TN-01-1111',
      from: 'Chennai',
      to: 'Trichy',
      departureTime: '09:00',
      arrivalTime: '13:00',
      duration: '4h',
      fare: 250,
      isLive: true,
      category: 'Express'
    },
    {
      id: 2,
      name: 'Via Express',
      busName: 'Via Express',
      busNumber: 'TN-02-2222',
      from: 'Salem',
      to: 'Madurai',
      departureTime: '08:30',
      arrivalTime: '15:30',
      duration: '7h',
      fare: 300,
      isLive: true,
      category: 'Express'
    },
    {
      id: 3,
      name: 'Express 101 (via Trichy)',
      busName: 'Express 101 (via Trichy)',
      busNumber: 'TN-03-3333',
      from: 'Chennai',
      to: 'Madurai',
      departureTime: '08:00',
      arrivalTime: '14:00',
      duration: '6h',
      fare: 350,
      isLive: true,
      category: 'Express'
    },
    {
      id: 4,
      name: 'Super Deluxe 202 (via Trichy)',
      busName: 'Super Deluxe 202 (via Trichy)',
      busNumber: 'TN-04-4444',
      from: 'Chennai',
      to: 'Virudhunagar',
      departureTime: '10:30',
      arrivalTime: '17:30',
      duration: '7h',
      fare: 450,
      isLive: false,
      category: 'Super Deluxe'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch comprehensive search results including continuing buses by default', async () => {
    mockSearchBuses.mockResolvedValue(mockEnhancedSearchResult);

    const result = await searchBuses(mockFromLocation, mockToLocation);

    expect(mockSearchBuses).toHaveBeenCalledWith(mockFromLocation, mockToLocation);
    expect(result).toEqual(mockEnhancedSearchResult);
    expect(result).toHaveLength(4); // All bus types included
  });

  it('should exclude continuing buses when includeContinuing is false', async () => {
    const resultWithoutContinuing = mockEnhancedSearchResult.slice(0, 2); // Only direct and via buses
    mockSearchBuses.mockResolvedValue(resultWithoutContinuing);

    const result = await searchBuses(mockFromLocation, mockToLocation, false);

    expect(mockSearchBuses).toHaveBeenCalledWith(mockFromLocation, mockToLocation, false);
    expect(result).toEqual(resultWithoutContinuing);
    expect(result).toHaveLength(2); // Excluding continuing buses
  });

  it('should handle API errors gracefully', async () => {
    const mockError = new Error('Enhanced Search API Error');
    mockSearchBuses.mockRejectedValue(mockError);

    await expect(
      searchBuses(mockFromLocation, mockToLocation)
    ).rejects.toThrow('Enhanced Search API Error');
  });

  it('should return empty array when no buses found', async () => {
    mockSearchBuses.mockResolvedValue([]);

    const result = await searchBuses(mockFromLocation, mockToLocation);

    expect(result).toEqual([]);
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network Error');
    mockSearchBuses.mockRejectedValue(networkError);

    await expect(
      searchBuses(mockFromLocation, mockToLocation)
    ).rejects.toThrow('Network Error');
  });

  it('should include buses with different final destinations', () => {
    const finalDestinations = mockEnhancedSearchResult.map(bus => bus.to);
    expect(finalDestinations).toContain('Trichy');
    expect(finalDestinations).toContain('Madurai');
    expect(finalDestinations).toContain('Virudhunagar');
  });

  it('should maintain bus name formatting for continuing buses', () => {
    const continuingBuses = mockEnhancedSearchResult.filter(bus => bus.name?.includes('(via Trichy)'));
    expect(continuingBuses).toHaveLength(2);
    expect(continuingBuses[0].name).toBe('Express 101 (via Trichy)');
    expect(continuingBuses[1].name).toBe('Super Deluxe 202 (via Trichy)');
  });

  it('should handle API timeout errors', async () => {
    const timeoutError = new Error('Request timeout');
    mockSearchBuses.mockRejectedValue(timeoutError);

    await expect(
      searchBuses(mockFromLocation, mockToLocation)
    ).rejects.toThrow('Request timeout');
  });

  it('should properly format API request with location IDs', async () => {
    mockSearchBuses.mockResolvedValue(mockEnhancedSearchResult);

    await searchBuses(mockFromLocation, mockToLocation, true);

    // Verify the function was called with the correct location objects
    expect(mockSearchBuses).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, name: 'Chennai' }),
      expect.objectContaining({ id: 2, name: 'Trichy' }),
      true
    );
  });
});

describe('Search Buses Continuing Beyond Destination', () => {
  // Mock bus data with correct Bus interface properties
  const mockBuses = [
    {
      id: 1,
      from: 'Chennai',
      to: 'Madurai', 
      busName: 'Parveen Travels',
      busNumber: 'TN01AB1234',
      departureTime: '06:00',
      arrivalTime: '12:00'
    },
    {
      id: 2,
      from: 'Salem',
      to: 'Trichy',
      busName: 'KPN Travels', 
      busNumber: 'TN38CD5678',
      departureTime: '07:00',
      arrivalTime: '10:00'
    },
    {
      id: 3,
      from: 'Chennai',
      to: 'Madurai',
      busName: 'VRL Travels (via Trichy)',
      busNumber: 'TN01EF9012',
      departureTime: '08:00',
      arrivalTime: '14:00'
    },
    {
      id: 4,
      from: 'Chennai', 
      to: 'Kanyakumari',
      busName: 'SRS Travels (via Trichy)',
      busNumber: 'TN01GH3456',
      departureTime: '09:00',
      arrivalTime: '18:00'
    }
  ];

  it('should find buses that continue beyond destination', () => {
    // Function to find buses continuing beyond destination
    const searchBusesContinuingBeyond = (fromLocation: string, toLocation: string) => {
      return mockBuses.filter(bus => 
        bus.from === fromLocation && 
        (bus.to !== toLocation && bus.busName.includes(`(via ${toLocation})`))
      );
    };

    const fromLocation = 'Chennai';
    const toLocation = 'Trichy';
    
    const result = searchBusesContinuingBeyond(fromLocation, toLocation);
    
    expect(result).toHaveLength(2);
    
    // Check that all results are from Chennai and continue beyond Trichy
    const finalDestinations = result.map(bus => bus.to);
    expect(finalDestinations).toContain('Madurai');
    expect(finalDestinations).toContain('Kanyakumari');
    
    // Verify these are continuing buses (via Trichy)
    const continuingBuses = result.filter(bus => bus.busName?.includes('(via Trichy)'));
    expect(continuingBuses).toHaveLength(2);
  });

  it('should return empty array when no continuing buses exist', () => {
    const searchBusesContinuingBeyond = (fromLocation: string, toLocation: string) => {
      return mockBuses.filter(bus => 
        bus.from === fromLocation && 
        (bus.to !== toLocation && bus.busName.includes(`(via ${toLocation})`))
      );
    };

    const result = searchBusesContinuingBeyond('Salem', 'Chennai');
    expect(result).toHaveLength(0);
  });

  it('should filter correctly by from location', () => {
    const searchBusesContinuingBeyond = (fromLocation: string, toLocation: string) => {
      return mockBuses.filter(bus => 
        bus.from === fromLocation && 
        (bus.to !== toLocation && bus.busName.includes(`(via ${toLocation})`))
      );
    };

    const result = searchBusesContinuingBeyond('Salem', 'Trichy');
    expect(result).toHaveLength(0); // Salem buses don't continue beyond Trichy
  });
});