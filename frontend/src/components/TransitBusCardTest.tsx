import React from 'react';
import type { Bus, Stop, Location } from '../types';
import TransitBusCard from './TransitBusCard';

// Test data with valid coordinates for Chennai to Coimbatore route
const testBus: Bus = {
  id: 1,
  busNumber: '142',
  busName: 'Express Deluxe Service',
  category: 'Express',
  from: 'Chennai',
  to: 'Coimbatore',
  departureTime: '06:30',
  arrivalTime: '14:00',
  fare: 450,
  status: 'on-time'
};

const testFromLocation: Location = {
  id: 1,
  name: 'Chennai Central',
  latitude: 13.0827,
  longitude: 80.2707
};

const testToLocation: Location = {
  id: 2,
  name: 'Coimbatore',
  latitude: 11.0168,
  longitude: 76.9558
};

const testStops: Stop[] = [
  {
    id: 1,
    name: 'Vellore',
    latitude: 12.9165,
    longitude: 79.1325,
    arrivalTime: '08:30',
    departureTime: '08:35',
    busId: 1
  },
  {
    id: 2,
    name: 'Salem',
    latitude: 11.6643,
    longitude: 78.1460,
    arrivalTime: '10:15',
    departureTime: '10:20',
    busId: 1
  },
  {
    id: 3,
    name: 'Namakkal',
    latitude: 11.2189,
    longitude: 78.1677,
    arrivalTime: '11:00',
    departureTime: '11:05',
    busId: 1
  },
  {
    id: 4,
    name: 'Karur',
    latitude: 10.9601,
    longitude: 78.0766,
    arrivalTime: '11:45',
    departureTime: '11:50',
    busId: 1
  },
  {
    id: 5,
    name: 'Tirupur',
    latitude: 11.1085,
    longitude: 77.3411,
    arrivalTime: '12:30',
    departureTime: '12:35',
    busId: 1
  }
];

const TransitBusCardTest: React.FC = () => {
  const [selectedBusId, setSelectedBusId] = React.useState<number | null>(null);

  const handleSelectBus = (busId: number) => {
    setSelectedBusId(busId);
    console.log('Test: Bus selected:', busId);
    console.log('Test: Stops data:', testStops);
  };

  console.log('TransitBusCardTest: Rendering with stops:', testStops);
  console.log('TransitBusCardTest: From location:', testFromLocation);
  console.log('TransitBusCardTest: To location:', testToLocation);

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      backgroundColor: '#f5f5f7',
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 20px 0', color: '#1d1d1f' }}>
          🗺️ TransitBusCard Map Test
        </h1>
        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>Test Configuration:</strong><br/>
          • Route: {testFromLocation.name} → {testToLocation.name}<br/>
          • Stops: {testStops.length} intermediate stops<br/>
          • Expected: Numbered markers (1-{testStops.length}) should appear on the map<br/>
          • All stops have valid coordinates
        </div>
      </div>

      <TransitBusCard
        bus={testBus}
        selectedBusId={selectedBusId}
        stops={testStops}
        onSelectBus={handleSelectBus}
        fromLocation={testFromLocation}
        toLocation={testToLocation}
        isCompact={false}
      />

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginTop: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1d1d1f' }}>Debug Information</h3>
        <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>
          <div><strong>Bus ID:</strong> {testBus.id}</div>
          <div><strong>Stops Count:</strong> {testStops.length}</div>
          <div><strong>Selected Bus:</strong> {selectedBusId || 'None'}</div>
          <div><strong>Stops with Coordinates:</strong> {testStops.filter(s => s.latitude && s.longitude).length}</div>
        </div>
        
        <details style={{ marginTop: '15px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Show Stops Data</summary>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '10px', 
            borderRadius: '4px', 
            overflow: 'auto',
            fontSize: '12px',
            margin: '10px 0 0 0'
          }}>
            {JSON.stringify(testStops, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default TransitBusCardTest;