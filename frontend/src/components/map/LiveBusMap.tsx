import React from 'react';
import { GoogleMap, MarkerF, InfoWindowF, useJsApiLoader } from '@react-google-maps/api';
import type { Location, BusLocation } from '../../types';
import { getEnv } from '../../utils/environment';
import BusInfoWindow from './BusInfoWindow';

interface LiveBusMapProps {
  fromLocation: Location;
  toLocation: Location;
  busLocations: BusLocation[];
  selectedBus: BusLocation | null;
  mapCenter: { lat: number; lng: number };
  onBusClick: (bus: BusLocation) => void;
  onInfoClose: () => void;
  getBusMarkerIcon: (confidence: number) => any;
}

const libraries = ['places'] as ("places" | "drawing" | "geometry" | "visualization")[];

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '10px'
};

const LiveBusMap: React.FC<LiveBusMapProps> = ({
  fromLocation,
  toLocation,
  busLocations,
  selectedBus,
  mapCenter,
  onBusClick,
  onInfoClose,
  getBusMarkerIcon
}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: getEnv('VITE_GOOGLE_MAPS_API_KEY'),
    libraries,
  });

  // Calculate map bounds to fit all markers
  const calculateBounds = () => {
    if (!isLoaded || busLocations.length === 0) return null;
    
    const bounds = new google.maps.LatLngBounds();
    
    // Add from and to locations
    bounds.extend({ lat: fromLocation.latitude, lng: fromLocation.longitude });
    bounds.extend({ lat: toLocation.latitude, lng: toLocation.longitude });
    
    // Add all bus locations
    busLocations.forEach(bus => {
      bounds.extend({ lat: bus.latitude, lng: bus.longitude });
    });
    
    return bounds;
  };

  // Handle map load event
  const handleMapLoad = (map: google.maps.Map) => {
    const bounds = calculateBounds();
    if (bounds) {
      map.fitBounds(bounds);
    }
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="map-container">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={12}
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {/* Origin marker */}
        <MarkerF
          position={{ lat: fromLocation.latitude, lng: fromLocation.longitude }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#1a73e8',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 10
          }}
          label={{
            text: "A",
            color: "#FFFFFF",
            fontWeight: "bold",
            fontSize: "14px"
          }}
          title={fromLocation.name}
        />
        
        {/* Destination marker */}
        <MarkerF
          position={{ lat: toLocation.latitude, lng: toLocation.longitude }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#1a73e8',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 10
          }}
          label={{
            text: "B",
            color: "#FFFFFF",
            fontWeight: "bold",
            fontSize: "14px"
          }}
          title={toLocation.name}
        />
        
        {/* Bus markers */}
        {busLocations.map(bus => (
          <MarkerF
            key={`bus-${bus.busId}`}
            position={{ lat: bus.latitude, lng: bus.longitude }}
            icon={getBusMarkerIcon(bus.confidenceScore)}
            onClick={() => onBusClick(bus)}
            title={`${bus.busName} (${bus.busNumber})`}
            animation={google.maps.Animation.DROP}
          />
        ))}
        
        {/* Info window for selected bus */}
        {selectedBus && (
          <InfoWindowF
            position={{ lat: selectedBus.latitude, lng: selectedBus.longitude }}
            onCloseClick={onInfoClose}
          >
            <BusInfoWindow bus={selectedBus} />
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  );
};

export default LiveBusMap;