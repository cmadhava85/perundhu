import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { logDebug } from '../utils/logger';
import type { Location, Bus, Stop, BusLocation } from '../types';
import type { Stop as ApiStop } from '../types/apiTypes';
import MapComponent from './MapComponent';
import MapLegend from './map/MapLegend';
import BusInfoPanel from './map/BusInfoPanel';
import TrackerStatus from './map/TrackerStatus';
import useBusLocationData from '../hooks/useBusLocationData';

interface CombinedMapTrackerProps {
  fromLocation: Location;
  toLocation: Location;
  buses: Bus[];
  selectedStops?: Stop[];
  showLiveTracking?: boolean;
  isMobile?: boolean;
  browserName?: string; // Added for test compatibility
  selectedBuses?: number[];
  userLocation?: { latitude: number; longitude: number } | null;
  onBusSelect?: (busId: number) => void;
  onStopSelect?: (stop: Stop) => void;
}

/**
 * Helper function to adapt Stop type from index to apiTypes
 */
const adaptStops = (stops: Stop[] | undefined): ApiStop[] | undefined => {
  if (!stops) return undefined;
  return stops.map(stop => ({
    id: stop.id || 0,
    name: stop.name,
    busId: 0, // Default value
    locationId: 0, // Default value
    arrivalTime: stop.arrivalTime || '',
    departureTime: stop.departureTime || '',
    stopOrder: stop.stopOrder || 0,
    location: stop.location ? {
      id: 0, // Default ID since it might not exist
      name: 'Stop', // Default name
      latitude: stop.location.latitude,
      longitude: stop.location.longitude
    } : undefined
  }));
};

/**
 * Combined component that shows both static route map and live bus tracking
 * Enhanced with proper stop numbering and highlighting
 */
const CombinedMapTracker = ({
  fromLocation,
  toLocation,
  selectedStops,
  buses,
  showLiveTracking,
  isMobile,
  browserName: _browserName,
  selectedBuses: _selectedBuses = [],
  userLocation: _userLocation,
  onBusSelect: _onBusSelect,
  onStopSelect
}: CombinedMapTrackerProps) => {
  const { t } = useTranslation();
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [highlightedStopIndex, setHighlightedStopIndex] = useState<number | null>(null);
  
  // Suppress lint warning for infoDialogOpen - used for state management
  void infoDialogOpen;
  
  // Use our custom hook for bus location data with guaranteed boolean and pass buses array
  const { busLocations, isLoading, error } = useBusLocationData(
    fromLocation,
    toLocation,
    !!showLiveTracking, // Convert to boolean with double negation
    buses // Pass buses array to the hook
  );

  // Update the handler to accept the union type
  const handleBusClick = (bus: Bus | BusLocation) => {
    // Check if it's a BusLocation type
    if ('latitude' in bus && 'longitude' in bus) {
      // It's a BusLocation
      setSelectedBus(bus);
      setInfoDialogOpen(true);
    } else {
      // It's a Bus type with different properties
      logDebug('Bus selected', {
        component: 'CombinedMapTracker',
        busName: bus.busName || bus.busNumber
      });
      // You might want to fetch additional information here
    }
  };

  // Handle closing the bus info panel
  const handleCloseBusInfo = () => {
    setSelectedBus(null);
    setInfoDialogOpen(false);
  };

  // Get container style based on mobile state (with safe default)
  const getContainerStyle = () => {
    return {
      width: '100%',
      height: isMobile ? '350px' : '450px',
      borderRadius: '10px'
    };
  };

  // Listen for stop highlight events from bus list
  useEffect(() => {
    const handleHighlightStop = (event: CustomEvent) => {
      const { index } = event.detail;
      setHighlightedStopIndex(index);
      
      // Auto-hide highlight after 3 seconds
      setTimeout(() => {
        setHighlightedStopIndex(null);
      }, 3000);
    };

    globalThis.addEventListener('highlightStop', handleHighlightStop as EventListener);
    return () => {
      globalThis.removeEventListener('highlightStop', handleHighlightStop as EventListener);
    };
  }, []);

  // Enhanced stop location function with proper error handling
  const _getStopLocation = useCallback((stop: Stop): { lat: number; lng: number } | null => {
    if (stop.latitude !== null && stop.longitude !== null && 
        stop.latitude !== undefined && stop.longitude !== undefined) {
      return { lat: stop.latitude, lng: stop.longitude };
    }
    if (stop.location?.latitude !== null && stop.location?.longitude !== null && stop.location) {
      return { lat: stop.location.latitude, lng: stop.location.longitude };
    }
    return null;
  }, []);

  // Enhanced stop selection handler
  const _handleStopSelect = useCallback((stop: Stop) => {
    logDebug('Stop selected', {
      component: 'CombinedMapTracker',
      stopName: stop.name
    });
    onStopSelect?.(stop);
    
    // Highlight the stop temporarily
    const stopIndex = selectedStops?.findIndex(s => s.id === stop.id);
    if (stopIndex !== undefined && stopIndex !== -1) {
      setHighlightedStopIndex(stopIndex + 1);
      setTimeout(() => setHighlightedStopIndex(null), 2000);
    }
  }, [selectedStops, onStopSelect]);

  return (
    <div className="combined-map-section">
      <h2>{t('combinedMap.title', 'Route Map & Live Tracking')}</h2>
      
      {/* Status component for error, loading states, and tracker info */}
      <TrackerStatus 
        isLoading={isLoading}
        error={error}
        busLocations={busLocations}
        showLiveTracking={showLiveTracking || false}
      />
      
      {/* Map component with adapted type for selectedStops */}
      <MapComponent 
        fromLocation={fromLocation}
        toLocation={toLocation}
        selectedStops={adaptStops(selectedStops)}
        buses={showLiveTracking ? busLocations : []}
        onBusClick={(bus: Bus | BusLocation) => handleBusClick(bus)}
        style={getContainerStyle()}
        mapId="combined-map-tracker"
      />
      
      {/* Enhanced stop count display */}
      {selectedStops && selectedStops.length > 0 && (
        <div className="stops-info">
          <span className="stops-icon">🚏</span>
          <span>{t('map.stopsCount', '{{count}} stops on route', { count: selectedStops.length })}</span>
          {highlightedStopIndex && (
            <span className="highlighted-stop">
              {t('map.highlightedStop', 'Stop {{number}} highlighted', { number: highlightedStopIndex })}
            </span>
          )}
        </div>
      )}
      
      {/* Bus info panel */}
      {selectedBus && (
        <BusInfoPanel 
          bus={selectedBus}
          onClose={handleCloseBusInfo}
        />
      )}
      
      {/* Map legend */}
      <MapLegend />
    </div>
  );
};

export default CombinedMapTracker;