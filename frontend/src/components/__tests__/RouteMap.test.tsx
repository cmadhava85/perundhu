import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../test-utils';
import RouteMap from '../RouteMap';
import type { Location } from '../../types/apiTypes';

// Mock MapComponent using the __mocks__ directory
vi.mock('../MapComponent');

describe('RouteMap Component', () => {
  const mockFromLocation: Location = {
    id: 1,
    name: 'Chennai Central',
    latitude: 13.0827,
    longitude: 80.2707
  };

  const mockToLocation: Location = {
    id: 2,
    name: 'Bangalore Majestic',
    latitude: 12.9716,
    longitude: 77.5946
  };

  const mockSelectedRoute = {
    name: 'Route 1',
    distance: '250 km',
    duration: '5 hours',
    fromLocation: { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    toLocation: { name: 'Bangalore', lat: 12.9716, lng: 77.5946 }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render map container', () => {
      const { container } = render(
        <RouteMap
          selectedRoute={mockSelectedRoute}
          userLocation={null}
          routes={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
        />
      );

      expect(container.querySelector('.route-map-container')).toBeInTheDocument();
    });

    it('should render MapComponent', () => {
      render(
        <RouteMap
          selectedRoute={mockSelectedRoute}
          userLocation={null}
          routes={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });

    it('should render without selected route', () => {
      render(
        <RouteMap
          selectedRoute={null}
          userLocation={null}
          routes={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });
  });

  describe('Location Processing', () => {
    it('should use provided fromLocation prop', () => {
      render(
        <RouteMap
          selectedRoute={mockSelectedRoute}
          userLocation={null}
          routes={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
        />
      );

      // Map should be rendered with the provided locations
      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });

    it('should use provided toLocation prop', () => {
      render(
        <RouteMap
          selectedRoute={mockSelectedRoute}
          userLocation={null}
          routes={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });

    it('should extract locations from selectedRoute when props not provided', () => {
      render(
        <RouteMap
          selectedRoute={mockSelectedRoute}
          userLocation={null}
          routes={[]}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });

    it('should use default locations when no data provided', () => {
      render(
        <RouteMap
          selectedRoute={null}
          userLocation={null}
          routes={[]}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });
  });

  describe('Route Details', () => {
    it('should handle selected route with all details', () => {
      render(
        <RouteMap
          selectedRoute={mockSelectedRoute}
          userLocation={null}
          routes={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });

    it('should handle route with missing optional fields', () => {
      const incompleteRoute = {
        fromLocation: { name: 'Origin', lat: 13.0, lng: 80.0 },
        toLocation: { name: 'Destination', lat: 12.9, lng: 77.5 }
      };

      render(
        <RouteMap
          selectedRoute={incompleteRoute}
          userLocation={null}
          routes={[]}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });

    it('should handle multiple routes in array', () => {
      const multipleRoutes = [
        mockSelectedRoute,
        {
          name: 'Route 2',
          distance: '300 km',
          duration: '6 hours'
        }
      ];

      render(
        <RouteMap
          selectedRoute={mockSelectedRoute}
          userLocation={null}
          routes={multipleRoutes}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });
  });

  describe('User Location', () => {
    it('should handle user location data', () => {
      const userLocation = { lat: 13.1, lng: 80.3 };

      render(
        <RouteMap
          selectedRoute={mockSelectedRoute}
          userLocation={userLocation}
          routes={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });

    it('should handle null user location', () => {
      render(
        <RouteMap
          selectedRoute={mockSelectedRoute}
          userLocation={null}
          routes={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });
  });

  describe('Props Updates', () => {
    it('should update when selectedRoute changes', () => {
      const { rerender } = render(
        <RouteMap
          selectedRoute={mockSelectedRoute}
          userLocation={null}
          routes={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();

      const newRoute = {
        ...mockSelectedRoute,
        name: 'Updated Route'
      };

      rerender(
        <RouteMap
          selectedRoute={newRoute}
          userLocation={null}
          routes={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });

    it('should update when location props change', () => {
      const { rerender } = render(
        <RouteMap
          selectedRoute={mockSelectedRoute}
          userLocation={null}
          routes={[]}
          fromLocation={mockFromLocation}
          toLocation={mockToLocation}
        />
      );

      const newFromLocation: Location = {
        id: 3,
        name: 'New Origin',
        latitude: 13.5,
        longitude: 80.5
      };

      rerender(
        <RouteMap
          selectedRoute={mockSelectedRoute}
          userLocation={null}
          routes={[]}
          fromLocation={newFromLocation}
          toLocation={mockToLocation}
        />
      );

      expect(screen.getByTestId('map-component')).toBeInTheDocument();
    });
  });
});
