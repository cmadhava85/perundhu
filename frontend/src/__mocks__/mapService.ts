// Mock implementation for the map service

export const MapProvider = {
  LEAFLET: 'leaflet',
  GOOGLE_MAPS: 'google_maps'
};

// Mock map service
const mapService = {
  provider: MapProvider.LEAFLET,
  map: null,

  // Initialize the map service
  init: jest.fn().mockImplementation(() => Promise.resolve()),
  
  // Create a new map instance
  createMap: jest.fn().mockImplementation(() => {}),
  
  // Draw a route between two points
  drawRoute: jest.fn().mockImplementation(() => {}),
  
  // Add a marker to the map
  addMarker: jest.fn().mockImplementation(() => {}),
  
  // Clear all markers from the map
  clearMarkers: jest.fn().mockImplementation(() => {}),
  
  // Clear all routes from the map
  clearRoutes: jest.fn().mockImplementation(() => {}),
  
  // Clean up the map instance
  cleanup: jest.fn().mockImplementation(() => {}),
  
  // Fit the map to show all markers
  fitBounds: jest.fn().mockImplementation(() => {}),
  
  // Set the map view to a specific location
  setView: jest.fn().mockImplementation(() => {}),
  
  // Get the current map provider
  getProvider: jest.fn().mockImplementation(() => MapProvider.LEAFLET)
};

export default mapService;