import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GoogleMap, DirectionsRenderer, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import type { Location, Stop } from '../types';
import { getEnv } from '../utils/environment';
import { featureFlags } from '../config/featureFlags';

interface RouteMapProps {
  fromLocation: Location;
  toLocation: Location;
  selectedStops?: Stop[]; // Added selectedStops as an optional prop
}

const libraries: Libraries = ['places'];

const defaultCenter = {
  lat: 13.0827,
  lng: 80.2707
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  scrollwheel: true,
  fullscreenControl: true,
};

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '10px'
};

const RouteMap: React.FC<RouteMapProps> = ({ fromLocation, toLocation, selectedStops = [] }) => {
  if (!featureFlags.enableMap) {
    return null;
  }

  const { t } = useTranslation();
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: getEnv('VITE_GOOGLE_MAPS_API_KEY'),
    libraries,
  });

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (!isLoaded || !fromLocation || !toLocation) return;

    const directionsService = new google.maps.DirectionsService();

    setIsLoading(true);
    setError(null);

    directionsService.route(
      {
        origin: { lat: fromLocation.latitude, lng: fromLocation.longitude },
        destination: { lat: toLocation.latitude, lng: toLocation.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
      },
      (result, status) => {
        setIsLoading(false);

        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          // Fit bounds to show all markers
          if (mapRef.current && result.routes[0]?.bounds) {
            mapRef.current.fitBounds(result.routes[0].bounds);
          }
        } else {
          setError(t('map.error.directions'));
        }
      }
    );
  }, [isLoaded, fromLocation, toLocation, t]);

  if (!isLoaded) return null;

  return (
    <div className="map-section">
      <h2>{t('map.title')}</h2>
      <div className="map-outer-container">
        {error && <div className="map-error">{error}</div>}
        {isLoading && <div className="map-loading">{t('common.loading')}</div>}
        
        {!error && isLoaded && (
          <div style={containerStyle}>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={defaultCenter}
              zoom={7}
              options={mapOptions}
              onLoad={handleMapLoad}
            >
              {directions && (
                <>
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: "#1a73e8",
                        strokeWeight: 5,
                      }
                    }}
                  />
                  
                  <MarkerF
                    position={{ 
                      lat: fromLocation.latitude, 
                      lng: fromLocation.longitude 
                    }}
                    label={{
                      text: "A",
                      color: "#FFFFFF",
                      fontWeight: "bold"
                    }}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      fillColor: "#1a73e8",
                      fillOpacity: 1,
                      strokeWeight: 0,
                      scale: 14
                    }}
                    title={fromLocation.name}
                  />
                  <MarkerF
                    position={{ 
                      lat: toLocation.latitude, 
                      lng: toLocation.longitude 
                    }}
                    label={{
                      text: "B",
                      color: "#FFFFFF",
                      fontWeight: "bold"
                    }}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      fillColor: "#1a73e8",
                      fillOpacity: 1,
                      strokeWeight: 0,
                      scale: 14
                    }}
                    title={toLocation.name}
                  />
                </>
              )}
              
              {!directions && (
                <>
                  <MarkerF
                    position={{ 
                      lat: fromLocation.latitude, 
                      lng: fromLocation.longitude 
                    }}
                    title={fromLocation.name}
                  />
                  <MarkerF
                    position={{ 
                      lat: toLocation.latitude, 
                      lng: toLocation.longitude 
                    }}
                    title={toLocation.name}
                  />
                </>
              )}
              
              {/* Render markers for selected stops if available */}
              {selectedStops && selectedStops.length > 0 && (
                <>
                  {selectedStops.filter(stop => {
                    // Skip stops without location data
                    // This ensures we don't try to render markers for stops without coordinates
                    return stop.hasOwnProperty('latitude') && stop.hasOwnProperty('longitude');
                  }).map((stop: any, index) => (
                    <MarkerF
                      key={`stop-${stop.id || index}`}
                      position={{
                        lat: parseFloat(stop.latitude) || 0,
                        lng: parseFloat(stop.longitude) || 0
                      }}
                      label={{
                        text: `${index + 1}`,
                        color: "#FFFFFF",
                        fontWeight: "bold"
                      }}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        fillColor: "#34A853",
                        fillOpacity: 1,
                        strokeWeight: 0,
                        scale: 12
                      }}
                      title={stop.name}
                    />
                  ))}
                </>
              )}
            </GoogleMap>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteMap;