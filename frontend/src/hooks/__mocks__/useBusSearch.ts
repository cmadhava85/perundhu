// Mock implementation of the useBusSearch hook
export const useBusSearch = jest.fn().mockImplementation(() => {
  return {
    buses: [],
    selectedBusId: null,
    stopsMap: {},
    loading: false,
    isLoading: false,
    error: null,
    connectingRoutes: [],
    
    searchBuses: jest.fn().mockResolvedValue([]),
    selectBus: jest.fn().mockImplementation((_busId) => {
      return Promise.resolve([]);
    }),
    resetResults: jest.fn(),
    clearError: jest.fn()
  };
});

// Default export for flexibility
export default useBusSearch;