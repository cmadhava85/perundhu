import React, { useState } from 'react';
import RouteMap from './RouteMap';
import type { Location } from '../types';

/**
 * Test locations
 */
const testLocations: Location[] = [
  {
    id: 1,
    name: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707
  },
  {
    id: 2,
    name: 'Kanchipuram',
    latitude: 12.9716,
    longitude: 79.7035
  }
];

const GoogleMapsTest: React.FC = () => {
  const [testLocations] = useState<Location[]>([
    { id: 1, name: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
    { id: 2, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 }
  ]);

  return (
    <div className="google-maps-test">
      <h2>Google Maps Integration Test</h2>
      <div className="maps-container">
        <RouteMap 
          fromLocation={testLocations[0]} 
          toLocation={testLocations[1]} 
          selectedRoute={null}
          userLocation={null}
          routes={[]}
        />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div>
      <h3>Test Map</h3>
      <p>Testing route from Chennai to Bangalore</p>
      <RouteMap 
        fromLocation={testLocations[0]} 
        toLocation={testLocations[1]} 
        selectedRoute={null}
        userLocation={null}
        routes={[]}
      />
    </div>
  );
};

export default App;