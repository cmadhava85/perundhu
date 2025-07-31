import { renderHook } from '@testing-library/react';
import { useBusLocationData } from '../useBusLocationData';
import type { Location } from '../../types';

// Mock the API calls
jest.mock('../../services/api', () => ({
  getCurrentBusLocations: jest.fn().mockResolvedValue([])
}));

// Force the NODE_ENV to be 'test' to help with detecting test environment
process.env.NODE_ENV = 'test';

// Mock the react-i18next hook
jest.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (key: string, fallback?: string) => fallback || key,
      i18n: {
        language: 'en'
      }
    };
  }
}));

describe('useBusLocationData Hook', () => {
  // Common test data
  const mockFromLocation: Location = {
    id: 1,
    name: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707
  };
  
  const mockToLocation: Location = {
    id: 2,
    name: 'Coimbatore',
    latitude: 11.0168,
    longitude: 76.9558
  };
  
  beforeEach(() => {
    // Create spies for interval methods
    jest.spyOn(globalThis, 'setInterval').mockImplementation(() => 123 as any);
    jest.spyOn(globalThis, 'clearInterval').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore original implementations
    jest.restoreAllMocks();
  });
  
  it('initializes with default values when tracking disabled', () => {
    const { result } = renderHook(() => 
      useBusLocationData(mockFromLocation, mockToLocation, false)
    );
    
    expect(result.current.busLocations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});