import React, { useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import { getEnv } from '../../utils/environment';

interface MapContainerProps {
  center: { lat: number; lng: number };
  onMapLoad?: (map: google.maps.Map) => void;
  children?: React.ReactNode;
  className?: string;
}

const libraries: Libraries = ['places'];

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const containerStyle = {
  width: '100%',
  height: '450px',
  borderRadius: '10px'
};

const MapContainer: React.FC<MapContainerProps> = ({
  center,
  onMapLoad,
  children,
  className = ''
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: getEnv('VITE_GOOGLE_MAPS_API_KEY'),
    libraries,
  });

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    onMapLoad?.(map);
  }, [onMapLoad]);

  if (loadError) {
    return (
      <div className="map-error-fallback">
        <div className="map-error-content">
          <div className="map-error-icon">🗺️</div>
          <h3>Map Service Unavailable</h3>
          <p>Unable to load Google Maps. Please check your internet connection and try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-button primary"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) return null;

  return (
    <div className={`map-container ${className}`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={7}
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {children}
      </GoogleMap>
    </div>
  );
};

export default MapContainer;