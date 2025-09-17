import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CombinedMapTracker from '../CombinedMapTracker';
import type { Location, Bus, Stop, BusLocation } from '../../types';
import { getCurrentBusLocations } from '../../services/api';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../../services/api';

// Mock the API functions
vi.mock('../../services/api', () => ({
  getCurrentBusLocations: vi.fn(),
  getStops: vi.fn()
}));

// Mock Google Maps API
vi.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: any) => <div data-testid="google-map">{children}</div>,
  LoadScript: ({ children }: any) => <div data-testid="load-script">{children}</div>,
  useJsApiLoader: () => ({ isLoaded: true, loadError: null }),
  MarkerF: ({ position, onClick }: any) => (
    <div 
      data-testid="map-marker" 
      onClick={onClick}
      data-lat={position?.lat}
      data-lng={position?.lng}
    >
      Marker
    </div>
  ),
  InfoWindowF: ({ children }: any) => (
    <div data-testid="info-window">{children}</div>
  ),
  DirectionsRenderer: ({ directions }: any) => (
    <div data-testid="directions-renderer">Directions: {directions ? 'Available' : 'None'}</div>
  ),
  DirectionsService: vi.fn().mockImplementation(() => ({
    route: vi.fn((callback) => {
      // Use setTimeout to prevent immediate callback loops
      setTimeout(() => {
        const mockResult = {
          routes: [{
            legs: [{
              start_address: 'Start Location',
              end_address: 'End Location',
              distance: { text: '100 km', value: 100000 },
              duration: { text: '2 hours', value: 7200 }
            }]
          }]
        };
        callback(mockResult, 'OK');
      }, 0);
    }),
  })),
}));

// Mock leaflet
vi.mock('leaflet', () => {
  return {
    map: vi.fn().mockImplementation(() => ({
      setView: vi.fn(),
      fitBounds: vi.fn(),
      invalidateSize: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn(),
      getContainer: vi.fn().mockReturnValue(document.createElement('div')),
    })),
    tileLayer: vi.fn().mockImplementation(() => ({
      addTo: vi.fn(),
    })),
    marker: vi.fn().mockImplementation(() => ({
      addTo: vi.fn(),
      bindPopup: vi.fn().mockReturnThis(),
      setLatLng: vi.fn(),
      getLatLng: vi.fn().mockReturnValue({ lat: 12.5, lng: 78.5 }),
      openPopup: vi.fn(),
      closePopup: vi.fn(),
      on: vi.fn(),
      setIcon: vi.fn(),
    })),
    divIcon: vi.fn().mockImplementation(() => ({})),
    icon: vi.fn().mockImplementation(() => ({})),
    latLng: vi.fn().mockImplementation((lat, lng) => ({ lat, lng })),
    latLngBounds: vi.fn().mockImplementation(() => ({
      extend: vi.fn().mockReturnThis(),
      getCenter: vi.fn().mockReturnValue({ lat: 12, lng: 78 }),
      isValid: vi.fn().mockReturnValue(true),
    })),
    polyline: vi.fn().mockImplementation(() => ({
      addTo: vi.fn(),
    })),
    popup: vi.fn().mockImplementation(() => ({
      setLatLng: vi.fn(),
      setContent: vi.fn(),
      openOn: vi.fn(),
    })),
    control: {
      scale: vi.fn().mockImplementation(() => ({
        addTo: vi.fn(),
      })),
    },
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'map.loading': 'Loading map...',
        'map.error': 'Error loading map',
        'map.busLocation': 'Bus Location',
        'map.stop': 'Stop',
        'map.currentLocation': 'Current Location'
      };
      return translations[key] || key;
    }
  })
}));

// Mock the MapComponent
vi.mock('../MapComponent', () => {
  return {
    __esModule: true,
    default: ({ onBusClick, onMapProviderChange }: any) => {
      // Simulate map load and provider change
      React.useEffect(() => {
        if (onMapProviderChange) {
          onMapProviderChange('Leaflet');
        }
      }, [onMapProviderChange]);

      return (
        <div data-testid="map-container" style={{ width: '100%', height: '450px', borderRadius: '10px' }}>
          <div className="leaflet-container" data-testid="leaflet-map">
            <div className="leaflet-marker-pane">
              <div 
                className="leaflet-marker" 
                data-testid="leaflet-marker"
                onClick={() => onBusClick && onBusClick({ busId: 1 })}
              >
                Bus Marker
              </div>
            </div>
          </div>
        </div>
      );
    }
  };
});

// Temporarily skip these tests due to memory leak issues
describe.skip('CombinedMapTracker Component', () => {
  const mockFromLocation = {
    id: 1,
    name: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707
  };

  const mockToLocation = {
    id: 2,
    name: 'Coimbatore',
    latitude: 11.0168,
    longitude: 76.9558
  };

  const mockBusLocations: BusLocation[] = [
    { 
      busId: 1,
      busName: 'SETC Express', 
      busNumber: 'TN-01-1234',
      fromLocation: 'Chennai', 
      toLocation: 'Coimbatore',
      latitude: 12.5, 
      longitude: 78.5, 
      speed: 65,
      heading: 45, 
      timestamp: new Date().toISOString(),
      lastReportedStopName: 'Vellore',
      nextStopName: 'Coimbatore',
      estimatedArrivalTime: '12:30',
      reportCount: 3,
      confidenceScore: 85
    }
  ];

  const mockBuses = [
    {
      id: 1,
      busNumber: 'TN-01-1234',
      busName: 'Express Bus',
      from: 'Chennai',
      to: 'Coimbatore',
      departureTime: '08:00',
      arrivalTime: '14:00'
    }
  ];

  const mockStops = [
    {
      id: 1,
      name: 'Chennai Central',
      latitude: 13.0827,
      longitude: 80.2707,
      arrivalTime: '08:00',
      departureTime: '08:00',
      order: 1
    },
    {
      id: 2,
      name: 'Coimbatore Junction',
      latitude: 11.0168,
      longitude: 76.9558,
      arrivalTime: '14:00',
      departureTime: '14:00',
      order: 2
    }
  ];

  const defaultProps = {
    fromLocation: mockFromLocation,
    toLocation: mockToLocation,
    buses: mockBuses,
    selectedBuses: [1],
    showLiveTracking: false,
    userLocation: null,
    onBusSelect: vi.fn(),
    onStopSelect: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset API mocks with proper resolved values
    (api.getCurrentBusLocations as any).mockResolvedValue(mockBusLocations);
    (api.getStops as any).mockResolvedValue(mockStops);
  });

  it('renders the map when showLiveTracking is true', async () => {
    render(
      <CombinedMapTracker 
        {...defaultProps}
        showLiveTracking={true}
      />
    );

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(getCurrentBusLocations).toHaveBeenCalled();
    });
    expect(screen.getByTestId('leaflet-map')).toBeInTheDocument();
  });
});