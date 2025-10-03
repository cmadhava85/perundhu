import React, { useState, useEffect } from 'react';
import LocationAutocompleteInput from '../LocationAutocompleteInput';
import { locationAutocompleteService } from '../../services/locationAutocompleteService';

/**
 * Debug component to test location autocomplete functionality
 */
const LocationAutocompleteDebug: React.FC = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    console.log('LocationDebug:', message);
    setDebugInfo(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addDebugInfo('LocationAutocompleteDebug component mounted');
  }, []);

  const handleFromChange = (value: string, location?: any) => {
    setFromValue(value);
    addDebugInfo(`From location changed: "${value}" ${location ? `(${location.name})` : '(no location object)'}`);
  };

  const handleToChange = (value: string, location?: any) => {
    setToValue(value);
    addDebugInfo(`To location changed: "${value}" ${location ? `(${location.name})` : '(no location object)'}`);
  };

  // Test the service directly
  const testService = async () => {
    addDebugInfo('Testing locationAutocompleteService directly...');
    try {
      const results = await locationAutocompleteService.getLocationSuggestions('Chennai', 'en');
      addDebugInfo(`Direct service test result: ${results.length} suggestions for "Chennai"`);
      results.forEach((result, i) => {
        addDebugInfo(`  ${i+1}. ${result.name} (${result.source})`);
      });
    } catch (error) {
      addDebugInfo(`Direct service test error: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🔍 Location Autocomplete Debug</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={testService} style={{ padding: '10px 20px', marginRight: '10px' }}>
          Test Service Directly
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <h3>From Location</h3>
          <LocationAutocompleteInput
            id="debug-from"
            name="from"
            value={fromValue}
            onChange={handleFromChange}
            placeholder="Enter departure location"
            label="From"
          />
          <p>Value: {fromValue}</p>
        </div>

        <div>
          <h3>To Location</h3>
          <LocationAutocompleteInput
            id="debug-to"
            name="to"
            value={toValue}
            onChange={handleToChange}
            placeholder="Enter destination location"
            label="To"
          />
          <p>Value: {toValue}</p>
        </div>
      </div>

      <div style={{ marginTop: '30px', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
        <h3>Debug Info</h3>
        <div style={{ maxHeight: '300px', overflow: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
          {debugInfo.map((info, i) => (
            <div key={i}>{info}</div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '20px', background: '#e3f2fd', padding: '15px', borderRadius: '8px' }}>
        <h3>Test Instructions</h3>
        <ol>
          <li>Type at least 2 characters in either input field</li>
          <li>Watch for suggestions dropdown</li>
          <li>Check debug info for API calls and errors</li>
          <li>Test with: Chennai, Villupuram, TestCity</li>
        </ol>
      </div>
    </div>
  );
};

export default LocationAutocompleteDebug;