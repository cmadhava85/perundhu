import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ModernBusList from './ModernBusList';
import OpenStreetMapComponent from './OpenStreetMapComponent';
import FallbackMapComponent from './FallbackMapComponent';
import type { Bus, Stop, Location as AppLocation } from '../types';
import { ApiError } from '../services/api';
import { Link } from 'react-router-dom';
// Using ModernBusList and OpenStreetMapComponent/FallbackMapComponent which have their own styles

interface SearchResultsProps {
  buses: Bus[];
  fromLocation: AppLocation;
  toLocation: AppLocation;
  stops: Stop[];  // Keep this for compatibility, but also add stopsMap
  stopsMap?: Record<number, Stop[]>;  // Add this for the complete stops data
  error?: Error | ApiError | null;
  connectingRoutes?: any[];
}

const SearchResults: React.FC<SearchResultsProps> = ({
  buses,
  fromLocation,
  toLocation,
  stops,
  stopsMap = {},
  error,
  connectingRoutes = []
}) => {
  const { t } = useTranslation();
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedBusStops, setSelectedBusStops] = useState<Stop[]>([]);
  
  // Use stopsMap if available, otherwise fall back to the stops array
  const allStops = Object.keys(stopsMap).length > 0 
    ? Object.values(stopsMap).flat() 
    : stops;
  
  useEffect(() => {
    if (selectedBusId) {
      // Try to get stops from stopsMap first, then fall back to filtering all stops
      const busStops = stopsMap[selectedBusId] || allStops.filter(stop => stop.busId === selectedBusId);
      setSelectedBusStops(busStops);
    } else {
      setSelectedBusStops([]);
    }
  }, [selectedBusId, stopsMap, allStops]);
  
  const handleSelectBus = (bus: Bus) => {
    setSelectedBusId(bus.id);
  };

  if (error) {
    return (
      <div className="search-results error-state">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>{t('searchResults.error.title', 'Search Error')}</h2>
          <p>{error.message}</p>
          <Link to="/">{t('searchResults.error.home', 'Back to Search')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="search-results-content">
        <div className="bus-list-section">
          <ModernBusList 
            buses={buses} 
            selectedBusId={selectedBusId} 
            stops={allStops}
            stopsMap={stopsMap}
            onSelectBus={handleSelectBus}
            fromLocation={fromLocation.name}
            toLocation={toLocation.name}
            fromLocationObj={fromLocation}
            toLocationObj={toLocation}
          />
        </div>
        
        <div className="map-section">
          {typeof window !== 'undefined' && (window as any).L ? (
            <OpenStreetMapComponent
              fromLocation={fromLocation}
              toLocation={toLocation}
              selectedStops={selectedBusStops}
              style={{ height: '400px', width: '100%' }}
            />
          ) : (
            <FallbackMapComponent
              fromLocation={fromLocation}
              toLocation={toLocation}
              selectedStops={selectedBusStops}
              style={{ height: '400px', width: '100%' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(SearchResults);
