import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { StopContribution, Location } from '../../types';
import LocationDropdown from '../search/LocationDropdown';

interface RouteVisualizationProps {
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  arrivalTime: string;
  stops: StopContribution[];
  onChangeFrom: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeTo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeTimes: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveStop: (index: number) => void;
  fromError?: boolean;
  toError?: boolean;
  timeError?: boolean;
}

/**
 * Component to visualize a route with its stops in a linear format
 */
const RouteVisualization: React.FC<RouteVisualizationProps> = ({
  fromLocation,
  toLocation,
  departureTime,
  arrivalTime,
  stops,
  onChangeFrom,
  onChangeTo,
  onChangeTimes,
  onRemoveStop,
  fromError = false,
  toError = false,
  timeError = false
}) => {
  const { t } = useTranslation();
  const [fromLocationData, setFromLocationData] = useState<Location | null>(null);
  const [toLocationData, setToLocationData] = useState<Location | null>(null);

  // Handle location selection from the dropdown
  const handleFromLocationSelect = (location: Location) => {
    // Store the full location data for future reference
    setFromLocationData(location);
    
    // Create a synthetic event that mimics the standard input onChange event
    const syntheticEvent = {
      target: {
        name: 'fromLocationName',
        value: location.name
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChangeFrom(syntheticEvent);
    
    // Optional: If you want to store additional location data in the parent component
    // This would require modifications to the parent component to accept this data
    console.log('Selected origin location data:', location);
  };

  const handleToLocationSelect = (location: Location) => {
    // Store the full location data for future reference
    setToLocationData(location);
    
    // Create a synthetic event that mimics the standard input onChange event
    const syntheticEvent = {
      target: {
        name: 'toLocationName',
        value: location.name
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    // Log the destination selection to ensure it's being called
    console.log('Destination selected, about to update form with:', location.name);
    
    onChangeTo(syntheticEvent);
    
    // Optional: If you want to store additional location data in the parent component
    // This would require modifications to the parent component to accept this data
    console.log('Selected destination location data:', location);
  };

  // Update our stored location data objects when names change externally
  useEffect(() => {
    if (fromLocation && (!fromLocationData || fromLocationData.name !== fromLocation)) {
      setFromLocationData({
        id: 0, // Changed from null to 0
        name: fromLocation,
        translatedName: '', // Changed from null to empty string
        latitude: 0,
        longitude: 0
      });
    }
    
    if (toLocation && (!toLocationData || toLocationData.name !== toLocation)) {
      setToLocationData({
        id: 0, // Changed from null to 0
        name: toLocation,
        translatedName: '', // Changed from null to empty string
        latitude: 0,
        longitude: 0
      });
    }
  }, [fromLocation, toLocation, fromLocationData, toLocationData]);

  return (
    <div className="route-visualization">
      <div className="visualization-container">
        <div className="route-start-point">
          <div className="location-marker origin-marker"></div>
          <div className="location-dropdown-wrapper">
            <LocationDropdown
              id="fromLocationName"
              label=""
              placeholder={t('contribution.fromLocation', 'Origin')}
              selectedLocation={fromLocationData}
              onSelect={handleFromLocationSelect}
              disabled={false}
              showValidationFeedback={fromError}
            />
          </div>
          <input
            type="time"
            id="departureTime"
            name="departureTime"
            value={departureTime}
            onChange={onChangeTimes}
            className={`time-input ${timeError ? 'field-error' : ''}`}
          />
        </div>
        
        {stops.length > 0 && (
          <div className="route-stops-container">
            {stops.map((stop, index) => (
              <div key={index} className="route-stop-point">
                <div className="location-marker stop-marker"></div>
                <div className="stop-info">
                  <div className="stop-name">{stop.name}</div>
                  <div className="stop-times">
                    {stop.arrivalTime && <span className="arrival-time">{stop.arrivalTime}</span>}
                    {stop.arrivalTime && stop.departureTime && <span> - </span>}
                    {stop.departureTime && <span className="departure-time">{stop.departureTime}</span>}
                  </div>
                </div>
                <button 
                  type="button" 
                  className="remove-stop-btn"
                  onClick={() => onRemoveStop(index)}
                  aria-label="Remove stop"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="route-end-point">
          <div className="location-marker destination-marker"></div>
          <div className="location-dropdown-wrapper">
            <LocationDropdown
              id="toLocationName"
              label=""
              placeholder={t('contribution.toLocation', 'Destination')}
              selectedLocation={toLocationData}
              onSelect={handleToLocationSelect}
              disabled={false}
              showValidationFeedback={toError}
            />
          </div>
          <input
            type="time"
            id="arrivalTime"
            name="arrivalTime"
            value={arrivalTime}
            onChange={onChangeTimes}
            className={`time-input ${timeError ? 'field-error' : ''}`}
          />
        </div>
      </div>
    </div>
  );
};

export default RouteVisualization;