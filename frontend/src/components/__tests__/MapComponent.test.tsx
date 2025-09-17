import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import MapComponent from '../MapComponent';
import mapService from '../../services/mapService';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => defaultValue || key,
    i18n: {
      language: 'en'
    }
  })
}));

// Mock the map service
vi.mock('../../services/mapService', () => ({
  default: {
    init: vi.fn().mockImplementation(() => Promise.resolve()),
    createMap: vi.fn(),
    drawRoute: vi.fn(),
    addMarker: vi.fn(),
    clearMarkers: vi.fn(),
    clearRoutes: vi.fn(),
    cleanup: vi.fn(),
    fitBounds: vi.fn(),
    setView: vi.fn(),
    getProvider: vi.fn().mockReturnValue('leaflet')
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
    vi.clearAllMocks();
  });

  it('renders the map container', () => {
    render(<MapComponent {...mockProps} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
  
  it('renders loading state initially', () => {
    render(<MapComponent {...mockProps} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  it('initializes the map service', () => {
    render(<MapComponent {...mockProps} />);
    expect(mapService.init).toHaveBeenCalled();
  });
  
  it('applies custom styles when provided', () => {
    const customStyle = { height: '300px', width: '500px' };
    render(<MapComponent {...mockProps} style={customStyle} />);
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveStyle('height: 300px');
    expect(mapContainer).toHaveStyle('width: 500px');
  });
  
  it('applies custom className when provided', () => {
    render(<MapComponent {...mockProps} className="custom-map-class" />);
    expect(screen.getByTestId('map-container')).toHaveClass('custom-map-class');
  });
});