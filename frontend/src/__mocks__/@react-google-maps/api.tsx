import { vi } from 'vitest';

// Mock Google Maps API components
const GoogleMapsMock = {
  GoogleMap: vi.fn(({ children, ...props }) => (
    <div data-testid="google-map" {...props}>
      {children}
    </div>
  )),
  MarkerF: vi.fn(({ position, ...props }) => (
    <div 
      data-testid="map-marker" 
      data-position={`${position?.lat},${position?.lng}`}
      {...props}
    />
  )),
  InfoWindowF: vi.fn(({ children, ...props }) => (
    <div data-testid="info-window" {...props}>
      {children}
    </div>
  )),
  DirectionsRenderer: vi.fn((props) => (
    <div data-testid="directions-renderer" {...props} />
  )),
  DirectionsService: vi.fn(),
  useJsApiLoader: vi.fn(() => ({
    isLoaded: true,
    loadError: null,
  })),
  useLoadScript: vi.fn(() => ({
    isLoaded: true,
    loadError: null,
  })),
};

export default GoogleMapsMock;
export const {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  DirectionsRenderer,
  DirectionsService,
  useJsApiLoader,
  useLoadScript,
} = GoogleMapsMock;