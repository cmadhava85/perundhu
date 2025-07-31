import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapComponent from '../MapComponent';
import mapService from '../../services/mapService';

// Mock the i18n
jest.mock('../../i18n', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue || key,
    i18n: {
      language: 'en'
    }
  })
}));

// Mock the map service
jest.mock('../../services/mapService', () => ({
  __esModule: true,
  default: {
    init: jest.fn().mockImplementation(() => Promise.resolve()),
    createMap: jest.fn(),
    drawRoute: jest.fn(),
    addMarker: jest.fn(),
    clearMarkers: jest.fn(),
    clearRoutes: jest.fn(),
    cleanup: jest.fn(),
    fitBounds: jest.fn(),
    setView: jest.fn(),
    getProvider: jest.fn().mockReturnValue('leaflet')
  },
  MapProvider: {
    LEAFLET: 'leaflet',
    GOOGLE_MAPS: 'google_maps'
  }
}));

describe('MapComponent', () => {
  const mockProps = {
    fromLocation: { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    toLocation: { id: 2, name: 'Coimbatore', latitude: 11.0168, longitude: 76.9558 }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the map container', () => {
    render(<MapComponent {...mockProps} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
  
  test('renders loading state initially', () => {
    render(<MapComponent {...mockProps} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  test('initializes the map service', () => {
    render(<MapComponent {...mockProps} />);
    expect(mapService.init).toHaveBeenCalled();
  });
  
  test('applies custom styles when provided', () => {
    const customStyle = { height: '300px', width: '500px' };
    render(<MapComponent {...mockProps} style={customStyle} />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveStyle('height: 300px');
    expect(mapContainer).toHaveStyle('width: 500px');
  });
  
  test('applies custom className when provided', () => {
    render(<MapComponent {...mockProps} className="custom-map-class" />);
    expect(screen.getByTestId('map-container')).toHaveClass('custom-map-class');
  });
});