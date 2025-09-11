import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useBusSearch } from '../hooks/useBusSearch';
import type { Bus, Location } from '../types';

// Mock the API functions
vi.mock('../services/api', () => ({
  searchBuses: vi.fn(),
  getStops: vi.fn(),
  ApiError: class ApiError extends Error {
    message: string;
    status: number;
    errorCode: string;
    
    constructor(message: string, status: number, errorCode: string) {
      super(message);
      this.message = message;
      this.status = status;
      this.errorCode = errorCode;
    }
  }
}));

vi.mock('../services/osmDiscoveryService', () => ({
  OSMDiscoveryService: {
    discoverIntermediateStops: vi.fn(),
    discoverOSMRoutes: vi.fn(),
    sortStopsByRelevance: vi.fn(),
    filterStopsByFacilities: vi.fn(),
    groupStopsByNetwork: vi.fn(),
  }
}));

describe('useBusSearch - Continuing Buses Feature', () => {
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

  const mockBuses: Bus[] = [
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with includeContinuingBuses set to true by default', () => {
    const { result } = renderHook(() => useBusSearch());
    
    expect(result.current.includeContinuingBuses).toBe(true);
  });

  it('should toggle includeContinuingBuses state', () => {
    const { result } = renderHook(() => useBusSearch());
    
    expect(result.current.includeContinuingBuses).toBe(true);
    
    act(() => {
      result.current.toggleIncludeContinuingBuses();
    });
    
    expect(result.current.includeContinuingBuses).toBe(false);
    
    act(() => {
      result.current.toggleIncludeContinuingBuses();
    });
    
    expect(result.current.includeContinuingBuses).toBe(true);
  });

  it('should pass includeContinuingBuses flag to searchBuses API', async () => {
    const { searchBuses: mockSearchBuses } = await import('../services/api');
    vi.mocked(mockSearchBuses).mockResolvedValue(mockBuses);

    const { result } = renderHook(() => useBusSearch());
    
    await act(async () => {
      await result.current.searchBuses(mockFromLocation, mockToLocation);
    });
    
    expect(mockSearchBuses).toHaveBeenCalledWith(
      mockFromLocation, 
      mockToLocation, 
      true // includeContinuingBuses should be true by default
    );
  });

  it('should search with includeContinuingBuses disabled when toggled off', async () => {
    const { searchBuses: mockSearchBuses } = await import('../services/api');
    vi.mocked(mockSearchBuses).mockResolvedValue(mockBuses);

    const { result } = renderHook(() => useBusSearch());
    
    // Toggle off continuing buses
    act(() => {
      result.current.toggleIncludeContinuingBuses();
    });
    
    await act(async () => {
      await result.current.searchBuses(mockFromLocation, mockToLocation);
    });
    
    expect(mockSearchBuses).toHaveBeenCalledWith(
      mockFromLocation, 
      mockToLocation, 
      false // includeContinuingBuses should be false after toggle
    );
  });

  it('should handle continuing buses in search results', async () => {
    const { searchBuses: mockSearchBuses } = await import('../services/api');
    vi.mocked(mockSearchBuses).mockResolvedValue(mockBuses);

    const { result } = renderHook(() => useBusSearch());
    
    await act(async () => {
      await result.current.searchBuses(mockFromLocation, mockToLocation);
    });
    
    expect(result.current.buses).toEqual(mockBuses);
    expect(result.current.buses).toHaveLength(4);
    
    // Verify that continuing buses are included in results
    const continuingBuses = result.current.buses.filter(bus => 
      bus.busName?.includes('(via Trichy)')
    );
    expect(continuingBuses).toHaveLength(2);
  });

  it('should reset all state including continuing buses toggle', () => {
    const { result } = renderHook(() => useBusSearch());
    
    // Set some state
    act(() => {
      result.current.toggleIncludeContinuingBuses(); // Set to false
    });
    
    // Reset
    act(() => {
      result.current.resetResults();
    });
    
    // Continuing buses flag should remain as is (not reset)
    expect(result.current.includeContinuingBuses).toBe(false);
    expect(result.current.buses).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});