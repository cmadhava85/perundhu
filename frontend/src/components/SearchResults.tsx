import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import BusList from './BusList';
import MapComponent from './MapComponent';
import type { Bus, Stop, Location } from '../types';
import { ApiError } from '../services/api';
import { Link } from 'react-router-dom';
import '../styles/SearchResults.css';

interface SearchResultsProps {
  buses: Bus[];
  fromLocation: Location;
  toLocation: Location;
  stops: Stop[];
  error?: Error | ApiError | null;
  connectingRoutes?: any[];
}

/**
 * Component that shows search results with a list of buses and a map
 * When a bus is selected from the list, its stops are displayed on the map
 */
const SearchResults: React.FC<SearchResultsProps> = ({
  buses,
  fromLocation,
  toLocation,
  stops,
  error,
  connectingRoutes = []
}) => {
  const { t } = useTranslation();
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedBusStops, setSelectedBusStops] = useState<Stop[]>([]);
  
  // Update the selected bus stops when the selected bus changes
  useEffect(() => {
    if (selectedBusId) {
      // Filter stops for the selected bus
      const busStops = stops.filter(stop => stop.busId === selectedBusId);
      setSelectedBusStops(busStops);
    } else {
      setSelectedBusStops([]);
    }
  }, [selectedBusId, stops]);
  
  // Handle bus selection
  const handleSelectBus = (bus: Bus) => {
    setSelectedBusId(bus.id);
  };

  // If there's an error, display it
  if (error) {
    return (
      <div className="search-results-container">
        <div className="search-results-header">
          <h1 className="search-results-title">
            {fromLocation && toLocation 
              ? `Bus Routes from ${fromLocation.name} to ${toLocation.name}` 
              : t('searchResults.title', 'Available Bus Routes')}
          </h1>
        </div>
        
        <div className="search-error-container">
          <div className="search-error-message">
            <h2>{t('searchResults.error', 'Error')}</h2>
            <p>{error.message || t('error.unknown', 'An unknown error occurred')}</p>
            
            {/* Show specific advice for common error types */}
            {error instanceof ApiError && error.errorCode === "NO_ROUTES_FOUND" && (
              <div className="search-error-advice">
                <p>{t('searchResults.noRoutesAdvice', 'Try searching for a different route, or check for connecting routes.')}</p>
                <Link to="/" className="search-again-button">
                  {t('searchResults.searchAgain', 'Search Again')}
                </Link>
              </div>
            )}
            
            {/* Generic error retry */}
            {!(error instanceof ApiError && error.errorCode === "NO_ROUTES_FOUND") && (
              <div className="search-error-advice">
                <p>{t('searchResults.errorAdvice', 'Please try again later or contact support if the problem persists.')}</p>
                <Link to="/" className="search-again-button">
                  {t('searchResults.searchAgain', 'Search Again')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If there are connecting routes but no direct buses
  if (buses.length === 0 && connectingRoutes && connectingRoutes.length > 0) {
    return (
      <div className="search-results-container">
        <div className="search-results-header">
          <h1 className="search-results-title">
            {t('searchResults.connectingRoutes', 'Connecting Routes Available')}
          </h1>
          <p>
            {t('searchResults.noDirectRoutes', 'No direct buses found between')} {fromLocation.name} {t('common.and')} {toLocation.name}.
            {t('searchResults.connectingRoutesAvailable', 'Connecting routes are available.')}
          </p>
        </div>
        
        <div className="search-results-content">
          <Link to="/connecting-routes" className="view-connecting-routes-button">
            {t('searchResults.viewConnectingRoutes', 'View Connecting Routes')}
          </Link>
        </div>
      </div>
    );
  }
  
  // If no buses found and no error is set
  if (buses.length === 0) {
    return (
      <div className="search-results-container">
        <div className="search-results-header">
          <h1 className="search-results-title">
            {fromLocation && toLocation 
              ? `Bus Routes from ${fromLocation.name} to ${toLocation.name}` 
              : t('searchResults.title', 'Available Bus Routes')}
          </h1>
        </div>
        
        <div className="search-error-container">
          <div className="search-error-message">
            <h2>{t('searchResults.noRoutesFound', 'No Routes Found')}</h2>
            <p>
              {t('searchResults.noRoutesFoundMessage', 'Sorry, we could not find any buses for this route.')}
            </p>
            <div className="search-error-advice">
              <p>{t('searchResults.noRoutesAdvice', 'Try searching for a different route.')}</p>
              <Link to="/" className="search-again-button">
                {t('searchResults.searchAgain', 'Search Again')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Normal display with buses found
  return (
    <div className="search-results-container">
      <div className="search-results-header">
        <h1 className="search-results-title">
          {fromLocation && toLocation 
            ? `Bus Routes from ${fromLocation.name} to ${toLocation.name}` 
            : t('searchResults.title', 'Available Bus Routes')}
        </h1>
      </div>
      
      <div className="search-results-content">
        <div className="bus-list-section">
          <BusList 
            buses={buses} 
            selectedBusId={selectedBusId} 
            stops={stops} 
            onSelectBus={handleSelectBus}
          />
        </div>
        
        <div className="map-section">
          <div className="map-container-wrapper">
            <MapComponent
              fromLocation={fromLocation}
              toLocation={toLocation}
              selectedStops={selectedBusStops}
              style={{ height: '100%', width: '100%', borderRadius: '8px' }}
              mapId="search-results-map"
            />
          </div>
          
          {selectedBusId && selectedBusStops.length > 0 && (
            <div className="stops-legend">
              <h3>{t('searchResults.busStops', 'Bus Stops')}</h3>
              <div className="stops-legend-list">
                {selectedBusStops.map((stop, index) => (
                  <div key={stop.id || index} className="stop-legend-item">
                    <span className="stop-number">{index + 1}</span>
                    <span className="stop-name">{stop.name}</span>
                    {stop.arrivalTime && (
                      <span className="stop-time">{stop.arrivalTime}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!selectedBusId && (
            <div className="map-instruction">
              {t('searchResults.selectBusToViewStops', 'Select a bus to view its stops on the map')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;