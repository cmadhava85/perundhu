import { describe, it, vi } from 'vitest';
import { render, screen } from "./src/test-utils";
import RouteMap from "./src/components/RouteMap";
import React from 'react';

// Mock MapComponent
vi.mock('./src/components/MapComponent', () => ({
  default: () => React.createElement('div', { 'data-testid': 'map-component' }, 'Map Component')
}));

describe('Debug RouteMap', () => {
  it('should render something', () => {
    const { container } = render(
      <RouteMap
        selectedRoute={null}
        userLocation={null}
        routes={[]}
        fromLocation={{ id: 1, name: 'Chennai', latitude: 13, longitude: 80 }}
        toLocation={{ id: 2, name: 'Bangalore', latitude: 12, longitude: 77 }}
      />
    );
    
    console.log('Container HTML:', container.innerHTML);
    console.log('Document body:', document.body.innerHTML);
    screen.debug();
  });
});
