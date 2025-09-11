import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, MarkerF, InfoWindowF, PolylineF } from '@react-google-maps/api';
import { useTranslation } from 'react-i18next';
import type { Location, Stop } from '../types';
import { OSMDiscoveryService, type OSMBusStop, type OSMBusRoute } from '../services/osmDiscoveryService';
import '../styles/components/enhanced-route-map.css';

interface EnhancedRouteMapProps {
  fromLocation: Location;
  toLocation: Location;
  selectedStops?: Stop[];
  onStopClick?: (stop: Stop | OSMBusStop) => void;
  showOSMStops?: boolean;
  showOSMRoutes?: boolean;
}

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "transit.station.bus",
      elementType: "all",
      stylers: [{ visibility: "on" }]
    }
  ]
};

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '12px',
  border: '1px solid #e5e7eb'
};

const EnhancedRouteMap: React.FC<EnhancedRouteMapProps> = ({
  fromLocation,
  toLocation,
  selectedStops = [],
  onStopClick,
  showOSMStops = true,
  showOSMRoutes = false
}) => {
  const { t } = useTranslation();
  
  // State for OSM data
  const [osmStops, setOsmStops] = useState<OSMBusStop[]>([]);
  const [osmRoutes, setOsmRoutes] = useState<OSMBusRoute[]>([]);
  const [selectedOSMStop, setSelectedOSMStop] = useState<OSMBusStop | null>(null);
  const [selectedOSMRoute, setSelectedOSMRoute] = useState<OSMBusRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map center calculation
  const mapCenter = useMemo(() => {
    if (!fromLocation || !toLocation) return { lat: 11.0168, lng: 76.9558 }; // Default to Coimbatore
    
    return {
      lat: (fromLocation.latitude + toLocation.latitude) / 2,
      lng: (fromLocation.longitude + toLocation.longitude) / 2
    };
  }, [fromLocation, toLocation]);

  // Load OSM data when locations change
  useEffect(() => {
    if (!fromLocation || !toLocation) return;

    const loadOSMData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load OSM stops if enabled
        if (showOSMStops) {
          const stops = await OSMDiscoveryService.discoverIntermediateStops(
            fromLocation, 
            toLocation,
            25.0 // 25km radius
          );
          
          // Filter and sort stops by relevance
          const relevantStops = OSMDiscoveryService.sortStopsByRelevance(
            stops, 
            fromLocation, 
            toLocation
          ).slice(0, 50); // Limit to 50 most relevant stops
          
          setOsmStops(relevantStops);
        }

        // Load OSM routes if enabled
        if (showOSMRoutes) {
          const routes = await OSMDiscoveryService.discoverOSMRoutes(
            fromLocation,
            toLocation
          );
          setOsmRoutes(routes.slice(0, 10)); // Limit to 10 routes
        }
      } catch (err) {
        console.error('Error loading OSM data:', err);
        setError('Failed to load additional route information');
      } finally {
        setLoading(false);
      }
    };

    loadOSMData();
  }, [fromLocation, toLocation, showOSMStops, showOSMRoutes]);

  // Get stop location coordinates
  const getStopLocation = useCallback((stop: Stop): { lat: number; lng: number } | null => {
    if (stop.latitude !== null && stop.longitude !== null && 
        stop.latitude !== undefined && stop.longitude !== undefined) {
      return { lat: stop.latitude, lng: stop.longitude };
    }
    return null;
  }, []);

  // Handle OSM stop click
  const handleOSMStopClick = useCallback((stop: OSMBusStop) => {
    setSelectedOSMStop(stop);
    onStopClick?.(stop);
  }, [onStopClick]);

  // Handle OSM route click
  const handleOSMRouteClick = useCallback((route: OSMBusRoute) => {
    setSelectedOSMRoute(route);
  }, []);

  // Render route polyline for OSM routes
  const renderOSMRoutePolylines = () => {
    return osmRoutes.map((route) => {
      if (!route.stops || route.stops.length < 2) return null;
      
      const path = route.stops.map(stop => ({
        lat: stop.latitude,
        lng: stop.longitude
      }));

      return (
        <PolylineF
          key={`osm-route-${route.osmId}`}
          path={path}
          options={{
            strokeColor: '#FF6B35',
            strokeOpacity: 0.8,
            strokeWeight: 3,
            clickable: true
          }}
          onClick={() => handleOSMRouteClick(route)}
        />
      );
    });
  };

  // Filter OSM stops to avoid overcrowding
  const relevantOSMStops = useMemo(() => {
    return osmStops.filter(stop => 
      OSMDiscoveryService.isStopRelevantToRoute(stop, fromLocation, toLocation, 15.0)
    );
  }, [osmStops, fromLocation, toLocation]);

  return (
    <div className="enhanced-route-map">
      <div className="map-header">
        <h3 className="map-title">
          {t('routeMap.enhancedTitle', 'Enhanced Route Map with OpenStreetMap Data')}
        </h3>
        
        {loading && (
          <div className="map-loading">
            <span className="loading-spinner"></span>
            {t('routeMap.loadingOSM', 'Loading additional route data...')}
          </div>
        )}
        
        {error && (
          <div className="map-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-color database-stop"></span>
            {t('routeMap.databaseStops', 'Database Stops')}
          </div>
          <div className="legend-item">
            <span className="legend-color osm-stop"></span>
            {t('routeMap.osmStops', 'OpenStreetMap Stops')}
          </div>
          <div className="legend-item">
            <span className="legend-color osm-route"></span>
            {t('routeMap.osmRoutes', 'Discovered Routes')}
          </div>
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={10}
        options={mapOptions}
      >
        {/* Origin marker */}
        <MarkerF
          position={{ lat: fromLocation.latitude, lng: fromLocation.longitude }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#22c55e',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 12
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
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 12
          }}
          label={{
            text: "B",
            color: "#FFFFFF",
            fontWeight: "bold",
            fontSize: "14px"
          }}
          title={toLocation.name}
        />

        {/* Database stops */}
        {selectedStops.map((stop, index) => {
          const location = getStopLocation(stop);
          if (!location) return null;

          return (
            <MarkerF
              key={`db-stop-${index}`}
              position={location}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#3b82f6',
                fillOpacity: 0.8,
                strokeColor: '#1e40af',
                strokeWeight: 2,
                scale: 8
              }}
              title={stop.name}
              onClick={() => onStopClick?.(stop)}
            />
          );
        })}

        {/* OSM bus stops */}
        {showOSMStops && relevantOSMStops.map((stop) => (
          <MarkerF
            key={`osm-stop-${stop.osmId}`}
            position={{ lat: stop.latitude, lng: stop.longitude }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: stop.hasShelter ? '#f59e0b' : '#8b5cf6',
              fillOpacity: 0.7,
              strokeColor: '#ffffff',
              strokeWeight: 1,
              scale: 6
            }}
            title={`${stop.name} (${stop.stopType})`}
            onClick={() => handleOSMStopClick(stop)}
          />
        ))}

        {/* OSM route polylines */}
        {showOSMRoutes && renderOSMRoutePolylines()}

        {/* Main route line */}
        <PolylineF
          path={[
            { lat: fromLocation.latitude, lng: fromLocation.longitude },
            { lat: toLocation.latitude, lng: toLocation.longitude }
          ]}
          options={{
            strokeColor: '#1e40af',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            geodesic: true
          }}
        />

        {/* Info window for selected OSM stop */}
        {selectedOSMStop && (
          <InfoWindowF
            position={{ lat: selectedOSMStop.latitude, lng: selectedOSMStop.longitude }}
            onCloseClick={() => setSelectedOSMStop(null)}
          >
            <div className="osm-stop-info">
              <h4>{selectedOSMStop.name}</h4>
              <div className="stop-details">
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{selectedOSMStop.stopType}</span>
                </div>
                {selectedOSMStop.network && (
                  <div className="detail-row">
                    <span className="label">Network:</span>
                    <span className="value">{selectedOSMStop.network}</span>
                  </div>
                )}
                {selectedOSMStop.operator && (
                  <div className="detail-row">
                    <span className="label">Operator:</span>
                    <span className="value">{selectedOSMStop.operator}</span>
                  </div>
                )}
                <div className="facilities">
                  {selectedOSMStop.hasShelter && (
                    <span className="facility">🏠 Shelter</span>
                  )}
                  {selectedOSMStop.hasBench && (
                    <span className="facility">🪑 Bench</span>
                  )}
                </div>
              </div>
            </div>
          </InfoWindowF>
        )}

        {/* Info window for selected OSM route */}
        {selectedOSMRoute && (
          <InfoWindowF
            position={mapCenter}
            onCloseClick={() => setSelectedOSMRoute(null)}
          >
            <div className="osm-route-info">
              <h4>{selectedOSMRoute.routeName}</h4>
              <div className="route-details">
                <div className="detail-row">
                  <span className="label">Route:</span>
                  <span className="value">{selectedOSMRoute.routeRef}</span>
                </div>
                {selectedOSMRoute.operator && (
                  <div className="detail-row">
                    <span className="label">Operator:</span>
                    <span className="value">{selectedOSMRoute.operator}</span>
                  </div>
                )}
                {selectedOSMRoute.estimatedDuration && (
                  <div className="detail-row">
                    <span className="label">Duration:</span>
                    <span className="value">{Math.round(selectedOSMRoute.estimatedDuration)} min</span>
                  </div>
                )}
                <div className="relevance-score">
                  Relevance: {Math.round(selectedOSMRoute.relevanceScore * 100)}%
                </div>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>

      {/* OSM Data Summary */}
      {(osmStops.length > 0 || osmRoutes.length > 0) && (
        <div className="osm-data-summary">
          <h4>{t('routeMap.osmDataSummary', 'OpenStreetMap Discoveries')}</h4>
          <div className="summary-stats">
            {osmStops.length > 0 && (
              <div className="stat">
                <span className="stat-number">{osmStops.length}</span>
                <span className="stat-label">{t('routeMap.busStopsFound', 'Bus Stops Found')}</span>
              </div>
            )}
            {osmRoutes.length > 0 && (
              <div className="stat">
                <span className="stat-number">{osmRoutes.length}</span>
                <span className="stat-label">{t('routeMap.routesFound', 'Routes Discovered')}</span>
              </div>
            )}
            <div className="stat">
              <span className="stat-number">
                {OSMDiscoveryService.filterStopsByFacilities(osmStops, true).length}
              </span>
              <span className="stat-label">{t('routeMap.withShelter', 'With Shelter')}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedRouteMap;