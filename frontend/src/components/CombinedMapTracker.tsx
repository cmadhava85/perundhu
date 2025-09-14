import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Location, Bus, Stop, BusLocation } from '../types';
import type { Stop as ApiStop } from '../types/apiTypes';
import MapComponent from './MapComponent';

// Import our new components and hook
import BusInfoPanel from './map/BusInfoPanel';
import MapLegend from './map/MapLegend';
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
 * Now using the universal MapComponent that supports both Leaflet and Google Maps
 * Broken down into smaller, more manageable components
 */
const CombinedMapTracker = ({
  fromLocation,
  toLocation,
  selectedStops,
  buses,
  showLiveTracking,
  isMobile
}: CombinedMapTrackerProps) => {
  const { t } = useTranslation();
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  
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
      console.log('Bus selected:', bus.busName || bus.busNumber);
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