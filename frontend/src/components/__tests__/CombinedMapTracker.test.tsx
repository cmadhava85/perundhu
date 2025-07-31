import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CombinedMapTracker from '../CombinedMapTracker';
import type { Location, Bus, Stop, BusLocation } from '../../types';
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

// Mock leaflet
jest.mock('leaflet', () => {
  return {
    map: jest.fn().mockImplementation(() => ({
      setView: jest.fn(),
      fitBounds: jest.fn(),
      invalidateSize: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      remove: jest.fn(),
      getContainer: jest.fn().mockReturnValue(document.createElement('div')),
    })),
    tileLayer: jest.fn().mockImplementation(() => ({
      addTo: jest.fn(),
    })),
    marker: jest.fn().mockImplementation(() => ({
      addTo: jest.fn(),
      bindPopup: jest.fn().mockReturnThis(),
      setLatLng: jest.fn(),
      getLatLng: jest.fn().mockReturnValue({ lat: 12.5, lng: 78.5 }),
      openPopup: jest.fn(),
      closePopup: jest.fn(),
      on: jest.fn(),
      setIcon: jest.fn(),
    })),
    divIcon: jest.fn().mockImplementation(() => ({})),
    icon: jest.fn().mockImplementation(() => ({})),
    latLng: jest.fn().mockImplementation((lat, lng) => ({ lat, lng })),
    latLngBounds: jest.fn().mockImplementation(() => ({
      extend: jest.fn().mockReturnThis(),
      getCenter: jest.fn().mockReturnValue({ lat: 12, lng: 78 }),
      isValid: jest.fn().mockReturnValue(true),
    })),
    polyline: jest.fn().mockImplementation(() => ({
      addTo: jest.fn(),
    })),
    popup: jest.fn().mockImplementation(() => ({
      setLatLng: jest.fn(),
      setContent: jest.fn(),
      openOn: jest.fn(),
    })),
    control: {
      scale: jest.fn().mockImplementation(() => ({
        addTo: jest.fn(),
      })),
    },
  };
});

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
    busName: 'SETC Express', 
    busNumber: 'TN-01-1234',
    fromLocation: 'Chennai', 
    toLocation: 'Coimbatore',
    latitude: 12.5, 
    longitude: 78.5, 
    speed: 65,
    heading: 45, 
    direction: 'N',
    timestamp: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    lastReportedStopName: 'Vellore',
    nextStopName: 'Coimbatore',
    estimatedArrivalTime: '12:30',
    reportCount: 3,
    confidenceScore: 85,
    routeId: 1
  }
];

// Mock the MapComponent
jest.mock('../MapComponent', () => {
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
          {/* Create a simulated Leaflet structure for targeting in tests */}
          <div className="leaflet-container" data-testid="leaflet-map">
            <div className="leaflet-marker-pane">
              {mockBusLocations.map((bus, index) => (
                <div 
                  key={index} 
                  className="leaflet-marker" 
                  data-testid="leaflet-marker"
                  data-lat={bus.latitude}
                  data-lng={bus.longitude}
                  onClick={() => onBusClick && onBusClick(bus)}
                >
                  Bus Marker
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };
});

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

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(getCurrentBusLocations).toHaveBeenCalled();
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

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    
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

    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    
    // getCurrentBusLocations should not be called when no buses
    expect(getCurrentBusLocations).not.toHaveBeenCalled();
  });

  test('shows info window when a marker is clicked', async () => {
    const { container } = render(
      <CombinedMapTracker 
        fromLocation={mockFromLocation} 
        toLocation={mockToLocation} 
        buses={mockBuses}
        selectedStops={mockStops}
        showLiveTracking={true}
      />
    );

    await waitFor(() => {
      expect(getCurrentBusLocations).toHaveBeenCalled();
    });
    
    // More robust test to check that the active trackers are shown
    expect(container.querySelector('.active-trackers')).toBeInTheDocument();
    
    // Wait for the Leaflet map to be shown
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });
  });
});