import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CombinedMapTracker from '../CombinedMapTracker';
import ModernBusList from '../ModernBusList';
import type { Location, Bus, Stop } from '../../types';

// Demo component to test map functionality with numbered stops
const MapStopNumberingDemo: React.FC = () => {
  const { t } = useTranslation();
  
  // Mock data for testing
  const [fromLocation] = useState<Location>({
    id: 1,
    name: 'Chennai Central',
    latitude: 13.0827,
    longitude: 80.2707
  });

  const [toLocation] = useState<Location>({
    id: 2,
    name: 'Coimbatore Junction',
    latitude: 11.0168,
    longitude: 76.9558
  });

  const [mockBus] = useState<Bus>({
    id: 1,
    busNumber: 'TN-01-1234',
    busName: 'Express Service',
    from: 'Chennai Central',
    to: 'Coimbatore Junction',
    departureTime: '08:00',
    arrivalTime: '14:00',
    fare: 350,
    category: 'AC',
    isLive: true
  });

  const [selectedStops] = useState<Stop[]>([
    {
      id: 1,
      name: 'Chennai Central',
      busId: 1,
      latitude: 13.0827,
      longitude: 80.2707,
      arrivalTime: '08:00',
      departureTime: '08:00',
      stopOrder: 1,
      location: {
        latitude: 13.0827,
        longitude: 80.2707
      }
    },
    {
      id: 2,
      name: 'Kancheepuram',
      busId: 1,
      latitude: 12.8184,
      longitude: 79.7036,
      arrivalTime: '09:15',
      departureTime: '09:20',
      stopOrder: 2,
      location: {
        latitude: 12.8184,
        longitude: 79.7036
      }
    },
    {
      id: 3,
      name: 'Vellore',
      busId: 1,
      latitude: 12.9165,
      longitude: 79.1325,
      arrivalTime: '10:30',
      departureTime: '10:40',
      stopOrder: 3,
      location: {
        latitude: 12.9165,
        longitude: 79.1325
      }
    },
    {
      id: 4,
      name: 'Salem',
      busId: 1,
      latitude: 11.6643,
      longitude: 78.1460,
      arrivalTime: '12:00',
      departureTime: '12:10',
      stopOrder: 4,
      location: {
        latitude: 11.6643,
        longitude: 78.1460
      }
    },
    {
      id: 5,
      name: 'Coimbatore Junction',
      busId: 1,
      latitude: 11.0168,
      longitude: 76.9558,
      arrivalTime: '14:00',
      departureTime: '14:00',
      stopOrder: 5,
      location: {
        latitude: 11.0168,
        longitude: 76.9558
      }
    }
  ]);

  const [selectedBusId, setSelectedBusId] = useState<number | null>(1);

  useEffect(() => {
    // Simulate map initialization
    console.log('Map Demo initialized with numbered stops:', selectedStops.length);
    
    // Test the highlight functionality after component mounts
    setTimeout(() => {
      const event = new CustomEvent('highlightStop', { 
        detail: { 
          stop: selectedStops[2], // Highlight Vellore (3rd stop)
          index: 3 
        } 
      });
      window.dispatchEvent(event);
    }, 2000);
  }, [selectedStops]);

  const handleBusSelect = (busId: number) => {
    setSelectedBusId(busId);
    console.log('Bus selected for map display:', busId);
  };

  const handleStopSelect = (stop: Stop) => {
    console.log('Stop selected on map:', stop.name, 'Stop #' + stop.stopOrder);
  };

  return (
    <div className="map-demo-container" style={{ padding: '2rem' }}>
      <div className="demo-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '1rem' }}>
          {t('demo.title', 'Map Components with Numbered Stops Demo')}
        </h1>
        <div style={{ 
          background: '#f3f4f6', 
          padding: '1rem', 
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
            Features Being Tested:
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
            <li>✅ Numbered stop markers (1, 2, 3, 4, 5)</li>
            <li>✅ Stop highlighting when clicked in bus list</li>
            <li>✅ Interactive map with route visualization</li>
            <li>✅ Origin (A) and Destination (B) markers</li>
            <li>✅ Real-time stop selection feedback</li>
          </ul>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Bus List Section */}
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
            Bus List with Clickable Stops
          </h3>
          <ModernBusList
            buses={[mockBus]}
            selectedBusId={selectedBusId}
            stops={selectedStops}
            onSelectBus={(bus: Bus) => handleBusSelect(bus.id)}
          />
        </div>

        {/* Map Section */}
        <div>
          <h3 style={{ marginBottom: '1rem', color: '#374151' }}>
            Interactive Map with Numbered Stops
          </h3>
          <CombinedMapTracker
            fromLocation={fromLocation}
            toLocation={toLocation}
            selectedStops={selectedStops}
            buses={[mockBus]}
            showLiveTracking={false}
            onBusSelect={handleBusSelect}
            onStopSelect={handleStopSelect}
          />
        </div>
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '2rem', 
        background: '#ecfdf5', 
        border: '1px solid #d1fae5',
        padding: '1rem', 
        borderRadius: '8px' 
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#065f46' }}>
          How to Test:
        </h4>
        <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#047857' }}>
          <li>Click "View Stops" in the bus card to expand the stops list</li>
          <li>Click on any numbered stop in the list to highlight it on the map</li>
          <li>Observe the numbered markers (1-5) on the map corresponding to each stop</li>
          <li>Check that Origin (A) and Destination (B) markers are properly positioned</li>
          <li>Verify that the highlighted stop has a different color and animation</li>
        </ol>
      </div>
    </div>
  );
};

export default MapStopNumberingDemo;