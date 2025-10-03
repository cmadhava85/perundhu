import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { StopContribution, Location } from '../../types';
import LocationAutocompleteInput from '../LocationAutocompleteInput';

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

  // Handle location selection from the autocomplete input - Memoized to prevent refresh issues
  const handleFromLocationChange = useCallback((value: string, location?: any) => {
    // Store the full location data for future reference
    if (location) {
      setFromLocationData({
        id: location.id || 0,
        name: location.name || value,
        translatedName: location.translatedName || '',
        latitude: location.latitude || 0,
        longitude: location.longitude || 0
      });
    }
    
    // Create a synthetic event that mimics the standard input onChange event
    const syntheticEvent = {
      target: {
        name: 'fromLocationName',
        value: value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChangeFrom(syntheticEvent);
    
    console.log('Selected origin location:', value, location);
  }, [onChangeFrom]);

  const handleToLocationChange = useCallback((value: string, location?: any) => {
    // Store the full location data for future reference
    if (location) {
      setToLocationData({
        id: location.id || 0,
        name: location.name || value,
        translatedName: location.translatedName || '',
        latitude: location.latitude || 0,
        longitude: location.longitude || 0
      });
    }
    
    // Create a synthetic event that mimics the standard input onChange event
    const syntheticEvent = {
      target: {
        name: 'toLocationName',
        value: value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    console.log('Destination selected, about to update form with:', value);
    
    onChangeTo(syntheticEvent);
    
    console.log('Selected destination location:', value, location);
  }, [onChangeTo]);

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
      {/* Enhanced Timing Section */}
      <div className="timing-section">
        <div className="timing-group">
          <label className="timing-label">{t('contribution.departureTime', 'Departure Time')}</label>
          <input
            type="time"
            id="departureTime"
            name="departureTime"
            value={departureTime}
            onChange={onChangeTimes}
            className={`timing-input ${timeError ? 'field-error' : ''}`}
            placeholder="HH:MM"
          />
          <small className="field-hint">{t('contribution.whenBusLeaves', 'When bus leaves origin')}</small>
        </div>
        
        <div className="timing-group">
          <label className="timing-label">{t('contribution.arrivalTime', 'Arrival Time')}</label>
          <input
            type="time"
            id="arrivalTime"
            name="arrivalTime"
            value={arrivalTime}
            onChange={onChangeTimes}
            className={`timing-input ${timeError ? 'field-error' : ''}`}
            placeholder="HH:MM"
          />
          <small className="field-hint">{t('contribution.whenBusArrives', 'When bus reaches destination')}</small>
        </div>
      </div>

      <div className="visualization-container">
        <div className="route-start-point">
          <div className="location-marker origin-marker"></div>
          <div className="location-dropdown-wrapper">
            <LocationAutocompleteInput
              id="fromLocationName"
              name="fromLocationName"
              value={fromLocation}
              onChange={handleFromLocationChange}
              placeholder={t('contribution.fromLocation', 'Origin')}
              label=""
              required={true}
            />
          </div>
          {departureTime && (
            <div className="route-time-display">
              <span className="time-label">{t('contribution.departs', 'Departs')}</span>
              <span className="time-value">{departureTime}</span>
            </div>
          )}
        </div>
        
        {stops.length > 0 && (
          <div className="route-stops-container">
            {stops.map((stop, index) => (
              <div key={index} className="route-stop-point">
                <div className="location-marker stop-marker"></div>
                <div className="stop-info">
                  <div className="stop-name">{stop.name}</div>
                  <div className="stop-times">
                    {stop.arrivalTime && (
                      <span className="arrival-time">
                        ↓ {stop.arrivalTime}
                      </span>
                    )}
                    {stop.arrivalTime && stop.departureTime && <span className="time-separator">|</span>}
                    {stop.departureTime && (
                      <span className="departure-time">
                        ↑ {stop.departureTime}
                      </span>
                    )}
                  </div>
                  <div className="stop-duration">
                    {stop.arrivalTime && stop.departureTime && (
                      <span className="duration-info">
                        {t('contribution.stopDuration', 'Stop duration')}: {calculateStopDuration(stop.arrivalTime, stop.departureTime)}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  type="button" 
                  className="remove-stop-btn"
                  onClick={() => onRemoveStop(index)}
                  aria-label="Remove stop"
                  title={t('contribution.removeStop', 'Remove this stop')}
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
            <LocationAutocompleteInput
              id="toLocationName"
              name="toLocationName"
              value={toLocation}
              onChange={handleToLocationChange}
              placeholder={t('contribution.toLocation', 'Destination')}
              label=""
              required={true}
            />
          </div>
          {arrivalTime && (
            <div className="route-time-display">
              <span className="time-label">{t('contribution.arrives', 'Arrives')}</span>
              <span className="time-value">{arrivalTime}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Journey Summary */}
      {departureTime && arrivalTime && (
        <div className="journey-summary">
          <div className="summary-item">
            <span className="summary-label">{t('contribution.totalJourneyTime', 'Total Journey Time')}</span>
            <span className="summary-value">{calculateJourneyDuration(departureTime, arrivalTime)}</span>
          </div>
          {stops.length > 0 && (
            <div className="summary-item">
              <span className="summary-label">{t('contribution.totalStops', 'Total Stops')}</span>
              <span className="summary-value">{stops.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Helper function to calculate stop duration
  function calculateStopDuration(arrivalTime: string, departureTime: string): string {
    const arrival = new Date(`2000-01-01T${arrivalTime}`);
    const departure = new Date(`2000-01-01T${departureTime}`);
    const diffMs = departure.getTime() - arrival.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} ${t('contribution.minutes', 'mins')}`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  }

  // Helper function to calculate total journey duration
  function calculateJourneyDuration(departureTime: string, arrivalTime: string): string {
    const departure = new Date(`2000-01-01T${departureTime}`);
    const arrival = new Date(`2000-01-01T${arrivalTime}`);
    let diffMs = arrival.getTime() - departure.getTime();
    
    // Handle overnight journeys
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Add 24 hours
    }
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (hours === 0) {
      return `${mins} ${t('contribution.minutes', 'mins')}`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }
};

export default RouteVisualization;