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

  // Add debug logging to check selectedStops
  console.log('RouteMap received selectedStops:', selectedStops);

  const { t } = useTranslation();
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapKey, setMapKey] = useState<number>(0); // Add a key to force re-render

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: getEnv('VITE_GOOGLE_MAPS_API_KEY'),
    libraries,
  });

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Helper function to get location data from a stop
  const getStopLocation = (stop: any): { lat: number, lng: number } | null => {
    // Check if stop has direct lat/lng properties
    if (stop && typeof stop.lat !== 'undefined' && typeof stop.lng !== 'undefined') {
      return {
        lat: parseFloat(stop.lat.toString()),
        lng: parseFloat(stop.lng.toString())
      };
    }
    
    // Check if stop has a location property with latitude/longitude
    if (stop && stop.location && 
        typeof stop.location.latitude !== 'undefined' && 
        typeof stop.location.longitude !== 'undefined') {
      return {
        lat: parseFloat(stop.location.latitude.toString()),
        lng: parseFloat(stop.location.longitude.toString())
      };
    }
    
    // Finally check if stop has latitude/longitude directly
    if (stop && typeof stop.latitude !== 'undefined' && typeof stop.longitude !== 'undefined') {
      return {
        lat: parseFloat(stop.latitude.toString()),
        lng: parseFloat(stop.longitude.toString())
      };
    }
    
    return null;
  };

  // Effect for basic directions between from/to locations
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

  // Add an effect to handle changes in selectedStops
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !selectedStops || selectedStops.length === 0) return;
    
    // Create bounds to include all stops
    const bounds = new google.maps.LatLngBounds();
    
    // Add from and to locations
    bounds.extend({ lat: fromLocation.latitude, lng: fromLocation.longitude });
    bounds.extend({ lat: toLocation.latitude, lng: toLocation.longitude });
    
    // Get stops with coordinates using our helper function
    const stopsWithCoordinates = selectedStops
      .map(stop => ({ stop, location: getStopLocation(stop) }))
      .filter(item => item.location !== null);
    
    if (stopsWithCoordinates.length > 0) {
      // Add all stops with coordinates
      stopsWithCoordinates.forEach(item => {
        if (item.location) {
          bounds.extend(item.location);
        }
      });
      
      // Fit map to include all stops
      if (mapRef.current) {
        mapRef.current.fitBounds(bounds);
        
        // Force map to refresh by updating key
        setMapKey(prev => prev + 1);
        
        // Add a small delay to ensure map is visible
        setTimeout(() => {
          if (mapRef.current) {
            const center = mapRef.current.getCenter();
            if (center) {
              google.maps.event.trigger(mapRef.current, 'resize');
              mapRef.current.setCenter(center);
            }
          }
        }, 200);
      }
    }
  }, [selectedStops, fromLocation, toLocation, isLoaded]);

  if (!isLoaded) return null;

  return (
    <div className="map-section">
      <h2>{t('map.title')}</h2>
      <div className="map-outer-container">
        {error && <div className="map-error">{error}</div>}
        {isLoading && <div className="map-loading">{t('common.loading')}</div>}
        
        {!error && isLoaded && (
          <div style={containerStyle} className="map-container" key={`map-${mapKey}`}>
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
                  {selectedStops
                    .map((stop: any, index) => ({ stop, location: getStopLocation(stop), index }))
                    .filter(item => item.location !== null)
                    .map((item) => (
                      <MarkerF
                        key={`stop-${item.stop.id || item.index}`}
                        position={item.location!}
                        label={{
                          text: `${item.index + 1}`,
                          color: "#FFFFFF",
                          fontWeight: "bold",
                          fontSize: "16px", // Increased font size
                          className: "map-marker-label"
                        }}
                        icon={{
                          url: `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%2334A853" stroke="%23FFFFFF" stroke-width="2"/></svg>`,
                          scaledSize: new window.google.maps.Size(32, 32),
                          anchor: new window.google.maps.Point(16, 16),
                          labelOrigin: new window.google.maps.Point(16, 16)
                        }}
                        title={item.stop.name}
                        zIndex={1000 + item.index}
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