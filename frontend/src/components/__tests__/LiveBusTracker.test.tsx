import { render, screen } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import LiveBusTracker from '../LiveBusTracker';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: { [key: string]: string } = {
        'liveTracker.title': 'Live Bus Tracker',
        'liveTracker.staticBusesInfo': 'Showing scheduled buses on this route',
        'liveTracker.activeTrackers': 'Active Trackers',
        'liveTracker.people': 'people',
        'liveTracker.noBuses': 'No buses currently being tracked on this route',
        'liveTracker.enableTracking': 'Use the tracking feature when you board a bus to help other passengers!',
        'liveTracker.noLocationData': 'Location data not available',
        'liveTracker.refreshInfo': 'Bus locations automatically update every 15 seconds',
      };
      return translations[key] || fallback || key;
    },
  }),
}));

// Mock environment utilities
vi.mock('../../utils/environment', () => ({
  getEnv: (key: string) => {
    switch (key) {
      case 'VITE_GOOGLE_MAPS_API_KEY':
        return 'test-api-key';
      default:
        return '';
    }
  },
  getFeatureFlag: (_key: string, defaultValue: boolean = false) => {
    return defaultValue;
  },
}));

// Mock the useLiveBusTracking hook
const mockUseLiveBusTracking = vi.fn();
vi.mock('../hooks/useLiveBusTracking', () => ({
  useLiveBusTracking: mockUseLiveBusTracking,
}));

// Mock the child components
vi.mock('./map/LiveBusMap', () => ({
  default: ({ fromLocation, toLocation, busLocations }: any) => (
    <div data-testid="live-bus-map">
      <div>Map from {fromLocation?.name} to {toLocation?.name}</div>
      <div>Bus locations: {busLocations?.length || 0}</div>
    </div>
  ),
}));

vi.mock('./map/ConfidenceLegend', () => ({
  default: () => (
    <div className="confidence-legend">
      <h4>Confidence Score</h4>
      <div className="legend-items">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#4CAF50' }} />
          <span>High (70-100)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#FFC107' }} />
          <span>Medium (40-69)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#FF0000' }} />
          <span>Low (0-39)</span>
        </div>
      </div>
    </div>
  ),
}));

// Mock global google object for LiveBusMap
Object.defineProperty(global, 'google', {
  value: {
    maps: {
      SymbolPath: {
        CIRCLE: 0,
      },
    },
  },
  writable: true,
});

describe('LiveBusTracker Component', () => {
  const mockProps = {
    fromLocation: {
      id: 1,
      name: 'Chennai',
      latitude: 13.0827,
      longitude: 80.2707
    },
    toLocation: {
      id: 2,
      name: 'Coimbatore',
      latitude: 11.0168,
      longitude: 76.9558
    },
    buses: [
      {
        id: 1,
        busNumber: 'TN-01-1234',
        busName: 'Express Bus',
        from: 'Chennai',
        to: 'Coimbatore',
        departureTime: '08:00',
        arrivalTime: '14:00'
      }
    ],
    onTrackingUpdate: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock return for useLiveBusTracking
    mockUseLiveBusTracking.mockReturnValue({
      liveLocations: [],
      isTracking: false,
      error: null,
      startTracking: vi.fn(),
      stopTracking: vi.fn(),
    });
  });

  it('renders live bus tracker with title', () => {
    render(<LiveBusTracker {...mockProps} />);

    expect(screen.getByText('Live Bus Tracker')).toBeInTheDocument();
  });

  it.skip('shows bus count when buses are provided', () => {
    render(<LiveBusTracker {...mockProps} />);

    expect(screen.getByText(/Showing scheduled buses on this route: 1/)).toBeInTheDocument();
  });

  it.skip('shows message when no location data is available', () => {
    const propsWithoutBuses = {
      ...mockProps,
      buses: []
    };
    
    render(<LiveBusTracker {...propsWithoutBuses} />);

    expect(screen.getByText('Location data not available')).toBeInTheDocument();
  });

  it.skip('shows no buses message when not tracking and no live locations', () => {
    render(<LiveBusTracker {...mockProps} />);

    expect(screen.getByText('No buses currently being tracked on this route')).toBeInTheDocument();
    expect(screen.getByText('Use the tracking feature when you board a bus to help other passengers!')).toBeInTheDocument();
  });

  it('displays refresh information', () => {
    render(<LiveBusTracker {...mockProps} />);

    expect(screen.getByText('Bus locations automatically update every 15 seconds')).toBeInTheDocument();
    expect(screen.getByText('⟳')).toBeInTheDocument();
  });
});