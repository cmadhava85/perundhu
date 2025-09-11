import { vi } from 'vitest';

// Mock implementation of the useBusSearch hook
export const useBusSearch = vi.fn().mockReturnValue({
  buses: [],
  loading: false,
  error: null,
  searchBuses: vi.fn(),
});

// Default export for flexibility
export default useBusSearch;