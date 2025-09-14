import { renderHook, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest';
import { useBusLocationData } from '../useBusLocationData';
import type { Location } from '../../types';

// Mock the API calls
vi.mock('../../services/api', () => ({
  getCurrentBusLocations: vi.fn().mockResolvedValue([])
}));

// Mock the react-i18next hook
vi.mock('react-i18next', () => ({
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
    vi.spyOn(globalThis, 'setInterval').mockImplementation(() => 123 as any);
    vi.spyOn(globalThis, 'clearInterval').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore original implementations
    vi.restoreAllMocks();
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