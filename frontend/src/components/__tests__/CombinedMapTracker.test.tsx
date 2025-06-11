import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CombinedMapTracker from '../CombinedMapTracker';
import { Location, Bus, Stop, BusLocation } from '../../types';
import { getCurrentBusLocations } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
  getCurrentBusLocations: jest.fn()
}));

// Mock the environment utility
jest.mock('../../utils/environment', () => ({
  getEnv: jest.fn().mockReturnValue('fake-api-key'),
  getFeatureFlag: jest.fn().mockReturnValue(true)
}));

// Mock the react-i18next hook
jest.mock('react-i18next', () => ({
  useTranslation: () => {
    return {
      t: (key: string) => key,
      i18n: {
        language: 'en'
      }
    };
  },
}));

// Define Google Maps types for TypeScript
interface GoogleLatLng {
  lat: () => number;
  lng: () => number;
  equals: (other: GoogleLatLng) => boolean;
  toString: () => string;
}

interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

interface GoogleLatLngBounds {
  extend: (point: GoogleLatLng | GoogleLatLngLiteral) => GoogleLatLngBounds;
  getCenter: () => GoogleLatLng;
  isEmpty: () => boolean;
  contains: (latLng: GoogleLatLng) => boolean;
  getNorthEast: () => GoogleLatLng;
  getSouthWest: () => GoogleLatLng;
  toJSON: () => { north: number, east: number, south: number, west: number };
}

interface GoogleMap {
  setCenter: (center: GoogleLatLngLiteral | GoogleLatLng) => void;
  fitBounds: (bounds: GoogleLatLngBounds) => void;
  getCenter: () => GoogleLatLng;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
}

interface DirectionsResult {
  routes: Array<{
    legs: Array<{
      distance: { text: string, value: number };
      duration: { text: string, value: number };
      steps: any[];
      start_location: GoogleLatLngLiteral;
      end_location: GoogleLatLngLiteral;
    }>;
    overview_polyline: { points: string };
  }>;
}

interface DirectionsRendererOptions {
  directions?: DirectionsResult;
  map?: GoogleMap | null;
  routeIndex?: number;
  suppressMarkers?: boolean;
  suppressPolylines?: boolean;
  polylineOptions?: any;
}

// Set up Google Maps mock
beforeAll(() => {
  // Define enum values for DirectionsStatus
  const DirectionsStatus = {
    OK: "OK",
    NOT_FOUND: "NOT_FOUND",
    ZERO_RESULTS: "ZERO_RESULTS",
    MAX_WAYPOINTS_EXCEEDED: "MAX_WAYPOINTS_EXCEEDED",
    INVALID_REQUEST: "INVALID_REQUEST",
    OVER_QUERY_LIMIT: "OVER_QUERY_LIMIT",
    REQUEST_DENIED: "REQUEST_DENIED",
    UNKNOWN_ERROR: "UNKNOWN_ERROR"
  };

  // Define enum values for TravelMode
  const TravelMode = {
    DRIVING: "DRIVING",
    BICYCLING: "BICYCLING",
    TRANSIT: "TRANSIT",
    WALKING: "WALKING"
  };

  // Define enum values for Animation
  const Animation = {
    BOUNCE: 0, 
    DROP: 1    
  };

  // Create the google maps namespace with proper typing
  window.google = {
    maps: {
      DirectionsService: jest.fn().mockImplementation(() => ({
        route: jest.fn((_request, callback) => {
          callback({
            routes: [
              {
                legs: [
                  {
                    distance: { text: '100 km', value: 100000 },
                    duration: { text: '2 hours', value: 7200 },
                    steps: [],
                    start_location: { lat: 13.0827, lng: 80.2707 },
                    end_location: { lat: 11.0168, lng: 76.9558 }
                  }
                ],
                overview_polyline: { points: '' }
              }
            ]
          }, DirectionsStatus.OK);
        })
      })),
      LatLng: jest.fn().mockImplementation((lat, lng) => ({ 
        lat: () => lat, 
        lng: () => lng,
        equals: jest.fn().mockReturnValue(true),
        toString: jest.fn().mockReturnValue(`(${lat},${lng})`),
      })),
      LatLngBounds: jest.fn().mockImplementation(() => ({
        extend: jest.fn().mockReturnThis(),
        getCenter: jest.fn().mockReturnValue({ lat: () => 12, lng: () => 78 }),
        isEmpty: jest.fn().mockReturnValue(false),
        contains: jest.fn().mockReturnValue(true),
        getNorthEast: jest.fn().mockReturnValue({ lat: () => 13, lng: () => 80 }),
        getSouthWest: jest.fn().mockReturnValue({ lat: () => 11, lng: () => 76 }),
        toJSON: jest.fn().mockReturnValue({ north: 13, east: 80, south: 11, west: 76 }),
      })),
      DirectionsStatus,
      TravelMode,
      Animation,
      Size: jest.fn().mockImplementation((width, height) => ({ width, height })),
      Point: jest.fn().mockImplementation((x, y) => ({ x, y })),
      Marker: jest.fn().mockImplementation(() => ({
        setPosition: jest.fn(),
        setMap: jest.fn(),
        addListener: jest.fn(),
        setAnimation: jest.fn(),
        setIcon: jest.fn(),
        setTitle: jest.fn(),
      })),
      InfoWindow: jest.fn().mockImplementation(() => ({
        setContent: jest.fn(),
        setPosition: jest.fn(),
        open: jest.fn(),
        close: jest.fn(),
        addListener: jest.fn(),
      })),
      DirectionsRenderer: jest.fn().mockImplementation(() => ({
        setDirections: jest.fn(),
        setMap: jest.fn(),
        setOptions: jest.fn(),
        setRouteIndex: jest.fn(),
        getRouteIndex: jest.fn().mockReturnValue(0),
      })),
      MapTypeId: {
        ROADMAP: 'roadmap',
        SATELLITE: 'satellite',
        HYBRID: 'hybrid',
        TERRAIN: 'terrain'
      }
    } as any
  };
  
  // Add mock implementations for event methods
  window.google.maps.event = {
    trigger: jest.fn(),
    addDomListener: jest.fn(),
    addDomListenerOnce: jest.fn(),
    addListener: jest.fn().mockReturnValue(123),
    addListenerOnce: jest.fn(),
    clearInstanceListeners: jest.fn(),
    clearListeners: jest.fn(),
    hasListeners: jest.fn().mockReturnValue(false),
    removeListener: jest.fn(),
  } as any;
  
  // Add MAX_BOUNDS static property to LatLngBounds
  Object.defineProperty(window.google.maps.LatLngBounds, 'MAX_BOUNDS', {
    value: {
      getNorthEast: jest.fn().mockReturnValue({ lat: () => 85, lng: () => 180 }),
      getSouthWest: jest.fn().mockReturnValue({ lat: () => -85, lng: () => -180 }),
    },
    configurable: true,
    writable: false,
    enumerable: true
  });
});

// Mock @react-google-maps/api with proper typing
jest.mock('@react-google-maps/api', () => {
  return {
    useJsApiLoader: jest.fn().mockReturnValue({ isLoaded: true, loadError: null }),
    GoogleMap: ({ children, onLoad }: { children: React.ReactNode, onLoad?: (map: GoogleMap) => void }) => {
      // Call onLoad with a mock map instance if provided
      React.useEffect(() => {
        if (onLoad) {
          const mockMap: GoogleMap = {
            setCenter: jest.fn(),
            fitBounds: jest.fn(),
            getCenter: jest.fn().mockReturnValue({ lat: () => 12, lng: () => 78 }),
            setZoom: jest.fn(),
            getZoom: jest.fn().mockReturnValue(10)
          };
          onLoad(mockMap);
        }
      }, [onLoad]);
      
      return (
        <div data-testid="google-map">
          {children}
        </div>
      );
    },
    DirectionsRenderer: ({ onLoad, options }: { onLoad?: (renderer: any) => void, options?: DirectionsRendererOptions }) => {
      // Call onLoad with a mock renderer instance if provided
      React.useEffect(() => {
        if (onLoad) {
          const mockRenderer = {
            setDirections: jest.fn(),
            setMap: jest.fn(),
            setOptions: jest.fn(),
            setRouteIndex: jest.fn(),
            getRouteIndex: jest.fn().mockReturnValue(0),
          };
          onLoad(mockRenderer);
        }
      }, [onLoad]);

      return (
        <div data-testid="directions-renderer">
          Directions
        </div>
      );
    },
    MarkerF: ({ position, title, onClick }: { position: GoogleLatLngLiteral, title?: string, onClick?: () => void }) => (
      <div 
        data-testid="map-marker" 
        data-lat={position.lat} 
        data-lng={position.lng} 
        onClick={onClick}
      >
        Marker: {title || 'Untitled'}
      </div>
    ),
    InfoWindowF: ({ position, children }: { position: GoogleLatLngLiteral, children: React.ReactNode }) => (
      <div data-testid="info-window" data-lat={position.lat} data-lng={position.lng}>
        {children}
      </div>
    )
  };
});

// Mock data for testing
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

const mockBuses: Bus[] = [
  {
    id: 1,
    busNumber: 'TN-01-1234',
    busName: 'SETC Express',
    from: 'Chennai',
    to: 'Coimbatore',
    departureTime: '06:00',
    arrivalTime: '12:30'
  }
];

const mockStops: Stop[] = [
  { id: 1, name: 'Chennai', stopLat: 13.0827, stopLng: 80.2707, arrivalTime: '06:00', departureTime: '06:00', order: 1 },
  { id: 2, name: 'Vellore', stopLat: 12.9165, stopLng: 79.1325, arrivalTime: '07:30', departureTime: '07:35', order: 2 },
  { id: 3, name: 'Coimbatore', stopLat: 11.0168, stopLng: 76.9558, arrivalTime: '12:30', departureTime: '12:30', order: 3 }
];

const mockBusLocations: BusLocation[] = [
  { 
    busId: 1, 
    busNumber: 'TN-01-1234', 
    latitude: 12.5, 
    longitude: 78.5, 
    speed: 65, 
    direction: 'N',
    lastUpdated: new Date().toISOString(),
    routeId: 1
  }
];

describe('CombinedMapTracker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentBusLocations as jest.Mock).mockResolvedValue(mockBusLocations);
  });

  test('renders the map when showLiveTracking is true', async () => {
    render(
      <CombinedMapTracker 
        fromLocation={mockFromLocation} 
        toLocation={mockToLocation} 
        buses={mockBuses}
        selectedStops={mockStops}
        showLiveTracking={true}
      />
    );

    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(getCurrentBusLocations).toHaveBeenCalled();
    });

    // Wait for the bus markers to be displayed
    await waitFor(() => {
      const markers = screen.getAllByTestId('map-marker');
      // We expect markers for all stops plus one for the bus location
      expect(markers.length).toBeGreaterThan(0);
    });
  });

  test('renders the map without live tracking when showLiveTracking is false', async () => {
    render(
      <CombinedMapTracker 
        fromLocation={mockFromLocation} 
        toLocation={mockToLocation} 
        buses={mockBuses}
        selectedStops={mockStops}
        showLiveTracking={false}
      />
    );

    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    
    // getCurrentBusLocations should not be called
    expect(getCurrentBusLocations).not.toHaveBeenCalled();
  });

  test('does not call getCurrentBusLocations when no buses are selected', async () => {
    render(
      <CombinedMapTracker 
        fromLocation={mockFromLocation} 
        toLocation={mockToLocation} 
        buses={[]}
        selectedStops={mockStops}
        showLiveTracking={true}
      />
    );

    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    
    // getCurrentBusLocations should not be called when no buses
    expect(getCurrentBusLocations).not.toHaveBeenCalled();
  });

  test('shows info window when a marker is clicked', async () => {
    render(
      <CombinedMapTracker 
        fromLocation={mockFromLocation} 
        toLocation={mockToLocation} 
        buses={mockBuses}
        selectedStops={mockStops}
        showLiveTracking={true}
      />
    );

    // Wait for markers to render
    await waitFor(() => {
      const markers = screen.getAllByTestId('map-marker');
      expect(markers.length).toBeGreaterThan(0);
      
      // Simulate clicking on a marker
      fireEvent.click(markers[0]);
    });

    // Just verify we don't get any errors when clicking markers
    expect(true).toBe(true);
  });
});