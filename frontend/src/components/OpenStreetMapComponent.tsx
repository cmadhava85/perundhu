import React, { useEffect, useRef, useMemo, memo, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { logDebug, logWarn } from '../utils/logger';
import type { Location, Stop } from '../types/index';
import { getStopCoordinates, getStopCoordinatesAsync, getCoordinateSource } from '../utils/cityCoordinates';
import '../styles/OpenStreetMapComponent.css';

// Fix Leaflet default icons for bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface OpenStreetMapComponentProps {
  fromLocation: Location;
  toLocation: Location;
  selectedStops?: Stop[];
  buses?: unknown[];
  onBusClick?: (bus: unknown) => void;
  className?: string;
  style?: React.CSSProperties;
  mapId?: string;
}

/**
 * OpenStreetMap Component using Leaflet
 * Provides interactive maps with route visualization, markers, and popups
 */
const OpenStreetMapComponent: React.FC<OpenStreetMapComponentProps> = memo(({
  fromLocation,
  toLocation,
  selectedStops = [],
  buses = [],
  onBusClick,
  className = 'map-container',
  style = { height: '350px', width: '100%', minHeight: '300px' },
  mapId = 'osm-map'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const initializedForRef = useRef<string>('');
  const resizeHandlerRef = useRef<(() => void) | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Center on route handler
  const handleCenterOnRoute = useCallback(() => {
    if (mapInstanceRef.current && fromLocation && toLocation) {
      const bounds = new L.LatLngBounds([
        [fromLocation.latitude, fromLocation.longitude],
        [toLocation.latitude, toLocation.longitude]
      ]);
      
      // Add stops to bounds
      selectedStops.forEach(stop => {
        const coords = getStopCoordinates(stop);
        if (coords) {
          bounds.extend([coords.latitude, coords.longitude]);
        }
      });
      
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }, [fromLocation, toLocation, selectedStops]);

  // Memoize stable keys to prevent unnecessary re-renders
  const stableMapKey = useMemo(() => {
    const fromKey = `${fromLocation?.id || fromLocation?.name}-${fromLocation?.latitude?.toFixed(4)}-${fromLocation?.longitude?.toFixed(4)}`;
    const toKey = `${toLocation?.id || toLocation?.name}-${toLocation?.latitude?.toFixed(4)}-${toLocation?.longitude?.toFixed(4)}`;
    const stopsKey = selectedStops.map(s => s.id || s.name).join(',');
    return `${fromKey}|${toKey}|${stopsKey}|${buses.length}`;
  }, [fromLocation?.id, fromLocation?.name, fromLocation?.latitude, fromLocation?.longitude,
      toLocation?.id, toLocation?.name, toLocation?.latitude, toLocation?.longitude,
      selectedStops, buses.length]);

  useEffect(() => {
    // Skip if already initialized for same data
    if (initializedForRef.current === stableMapKey && mapInstanceRef.current) {
      logDebug('Map already initialized for this data, skipping', {
        component: 'OpenStreetMapComponent',
        mapId
      });
      return;
    }

    // Dynamic import to avoid SSR issues
    const initializeMap = async () => {
      try {
        // Prevent multiple simultaneous initializations
        if (isInitializingRef.current) {
          logDebug('Map initialization already in progress, skipping', {
            component: 'OpenStreetMapComponent'
          });
          return;
        }
        
        isInitializingRef.current = true;

        if (mapRef.current) {
          // Clean up existing map first
          if (mapInstanceRef.current) {
            try {
              mapInstanceRef.current.remove();
              mapInstanceRef.current = null;
            } catch (error) {
              logWarn('Error cleaning up previous map', {
                component: 'OpenStreetMapComponent',
                error
              });
              mapInstanceRef.current = null;
            }
          }
          
          // Wait a bit for DOM to settle after cleanup
          await new Promise(resolve => setTimeout(resolve, 100));
          // Calculate center point between origin and destination
          const centerLat = (fromLocation.latitude + toLocation.latitude) / 2;
          const centerLng = (fromLocation.longitude + toLocation.longitude) / 2;

          // Initialize map with error handling
          const map = L.map(mapRef.current, {
            // Add options to prevent _leaflet_pos errors
            preferCanvas: false,
            attributionControl: true,
            zoomControl: true,
              trackResize: true,
              boxZoom: true,
              doubleClickZoom: true,
              dragging: true
            }).setView([centerLat, centerLng], 8);

            // Map loaded successfully
            setIsLoading(false);

            // Add error handler
            map.on('error', (e: L.LeafletEvent) => {
              void e; // Acknowledge error event
              setIsLoading(false);
            });

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19,
            }).addTo(map);

            // Custom icon for bus stops
            const busStopIcon = L.divIcon({
              html: '<div class="bus-stop-marker">🚌</div>',
              className: 'custom-bus-marker',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            });

            // Origin marker
            const originMarker = L.marker([fromLocation.latitude, fromLocation.longitude], {
              icon: L.divIcon({
                html: '<div class="origin-marker">📍</div>',
                className: 'custom-origin-marker',
                iconSize: [35, 35],
                iconAnchor: [17, 17]
              })
            }).addTo(map);

            originMarker.bindPopup(`
              <div class="map-popup">
                <h3>Origin</h3>
                <p><strong>${fromLocation.name}</strong></p>
                <small>${fromLocation.latitude.toFixed(4)}, ${fromLocation.longitude.toFixed(4)}</small>
              </div>
            `);

            // Destination marker
            const destinationMarker = L.marker([toLocation.latitude, toLocation.longitude], {
              icon: L.divIcon({
                html: '<div class="destination-marker">🎯</div>',
                className: 'custom-destination-marker',
                iconSize: [35, 35],
                iconAnchor: [17, 17]
              })
            }).addTo(map);

            destinationMarker.bindPopup(`
              <div class="map-popup">
                <h3>Destination</h3>
                <p><strong>${toLocation.name}</strong></p>
                <small>${toLocation.latitude.toFixed(4)}, ${toLocation.longitude.toFixed(4)}</small>
              </div>
            `);

            // Add intermediate stops with coordinate fallback and async geocoding
            logDebug('OpenStreetMapComponent: Selected stops', {
              component: 'OpenStreetMapComponent',
              count: selectedStops.length
            });
            
            const stopsWithCoordinates: Array<{stop: Stop, coords: {latitude: number, longitude: number}, source: string}> = [];
            
            // Process stops in parallel with async geocoding fallback
            const stopPromises = selectedStops.map(async (stop, index) => {
              try {
                // First try synchronous lookup
                const coords = getStopCoordinates(stop);
                if (coords) {
                  const source = getCoordinateSource(stop, coords);
                  return { stop, coords, source, index };
                }
                
                // If no coordinates found, try async geocoding
                logDebug(`Attempting geocoding for stop: "${stop.name}"`, {
                  component: 'OpenStreetMapComponent',
                  stopName: stop.name
                });
                const asyncResult = await getStopCoordinatesAsync(stop);
                if (asyncResult) {
                  return { 
                    stop, 
                    coords: { latitude: asyncResult.latitude, longitude: asyncResult.longitude }, 
                    source: asyncResult.source, 
                    index 
                  };
                }
                
                logWarn(`No coordinates found for stop "${stop.name}" even after geocoding`, {
                  component: 'OpenStreetMapComponent',
                  stopName: stop.name
                });
                return null;
              } catch (error) {
                logWarn(`Error processing coordinates for stop "${stop.name}"`, {
                  component: 'OpenStreetMapComponent',
                  stopName: stop.name,
                  error
                });
                return null;
              }
            });
            
            // Wait for all geocoding to complete
            const resolvedStops = await Promise.all(stopPromises);
            
            // Filter out null results and sort by original index
            resolvedStops
              .filter((result): result is NonNullable<typeof result> => result !== null)
              .sort((a, b) => a.index - b.index)
              .forEach((result) => {
                const { stop, coords, source } = result;
                stopsWithCoordinates.push({ stop, coords, source });
                logDebug(`Stop "${stop.name}": ${source} at coordinates`, {
                  component: 'OpenStreetMapComponent',
                  stopName: stop.name,
                  source,
                  latitude: coords.latitude,
                  longitude: coords.longitude
                });
              });
            
            logDebug('Stops with coordinates summary', {
              component: 'OpenStreetMapComponent',
              withCoords: stopsWithCoordinates.length,
              total: selectedStops.length
            });
            
            // Show notification if some stops couldn't be located
            if (stopsWithCoordinates.length < selectedStops.length) {
              // Some stops could not be located on the map
              // Optionally show a notification to the user via toast system
            }
            
            stopsWithCoordinates.forEach((stopData, index) => {
              const { stop, coords, source } = stopData;
              const isApproximate = source !== 'Exact stop location';
              
              const stopMarker = L.marker([coords.latitude, coords.longitude], {
                icon: L.divIcon({
                  html: `<div class="stop-marker ${isApproximate ? 'approximate' : ''}">${index + 1}</div>`,
                  className: 'custom-stop-marker',
                  iconSize: [25, 25],
                  iconAnchor: [12, 12]
                })
              }).addTo(map);

              stopMarker.bindPopup(`
                <div class="map-popup">
                  <h4>Stop ${index + 1}</h4>
                  <p><strong>${stop.name}</strong></p>
                  ${stop.arrivalTime ? `<p>Arrival: ${stop.arrivalTime}</p>` : ''}
                  <small>${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}</small>
                  <div style="margin-top: 8px; font-size: 11px; color: #666;">
                    📍 ${source}
                  </div>
                </div>
              `);
            });

            // Draw route line with fallback coordinates
            const routePoints = [
              [fromLocation.latitude, fromLocation.longitude],
              ...stopsWithCoordinates.map(stopData => [stopData.coords.latitude, stopData.coords.longitude]),
              [toLocation.latitude, toLocation.longitude]
            ];

            if (routePoints.length >= 2) {
              const routeLine = L.polyline(routePoints as [number, number][], {
                color: '#3b82f6',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 5'
              }).addTo(map);

              // Fit map to show entire route
              map.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
            }

            // Add buses if provided
            buses.forEach((bus, _index) => {
              const typedBus = bus as { latitude?: number; longitude?: number; busName?: string; busNumber?: string };
              if (typedBus.latitude && typedBus.longitude) {
                const busMarker = L.marker([typedBus.latitude, typedBus.longitude], {
                  icon: busStopIcon
                }).addTo(map);

                busMarker.bindPopup(`
                  <div class="map-popup">
                    <h4>${typedBus.busName || 'Bus Service'}</h4>
                    <p>Number: ${typedBus.busNumber}</p>
                    <p>Status: Live</p>
                  </div>
                `);

                if (onBusClick) {
                  busMarker.on('click', () => onBusClick(bus));
                }
              }
            });

            mapInstanceRef.current = map;
            initializedForRef.current = stableMapKey;
            
            // Ensure proper sizing after initialization with multiple attempts for mobile
            const resizeAttempts = [100, 300, 500, 1000];
            resizeAttempts.forEach((delay) => {
              setTimeout(() => {
                if (map && mapRef.current) {
                  try {
                    map.invalidateSize({ animate: false, pan: false });
                  } catch (_error) {
                    // Error invalidating map size
                  }
                }
              }, delay);
            });
            
            // Also handle orientation change on mobile
            const handleResize = () => {
              if (map) {
                setTimeout(() => {
                  try {
                    map.invalidateSize({ animate: false, pan: false });
                  } catch (_error) {
                    // Error during resize
                  }
                }, 100);
              }
            };
            resizeHandlerRef.current = handleResize;
            window.addEventListener('resize', handleResize);
            window.addEventListener('orientationchange', handleResize);
          }
      } catch (_error) {
        // Error initializing OpenStreetMap
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeMap();

    // Cleanup function - remove event listeners when effect re-runs
    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        window.removeEventListener('orientationchange', resizeHandlerRef.current);
      }
    };
  }, [stableMapKey, mapId]);

  // Separate cleanup effect for unmount only
  useEffect(() => {
    return () => {
      isInitializingRef.current = false;
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        window.removeEventListener('orientationchange', resizeHandlerRef.current);
        resizeHandlerRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_error) {
          // Error during map cleanup
        } finally {
          mapInstanceRef.current = null;
          initializedForRef.current = '';
        }
      }
    };
  }, []);

  // Fallback content when Leaflet is not available
  const _FallbackContent = () => (
    <div className="osm-fallback">
      <div className="fallback-content">
        <div className="fallback-header">
          <div className="map-icon">🗺️</div>
          <div className="header-text">
            <h3>Loading Interactive Map...</h3>
            <p>OpenStreetMap is initializing</p>
          </div>
        </div>
        
        <div className="route-info">
          <div className="route-point">
            <span className="point-icon">📍</span>
            <div>
              <h4>From</h4>
              <p>{fromLocation.name}</p>
            </div>
          </div>
          
          <div className="route-line">
            <div className="line"></div>
            {selectedStops.length > 0 && (
              <div className="stops-count">{selectedStops.length} stops</div>
            )}
          </div>
          
          <div className="route-point">
            <span className="point-icon">🎯</span>
            <div>
              <h4>To</h4>
              <p>{toLocation.name}</p>
            </div>
          </div>
        </div>
        
        <div className="loading-actions">
          <button 
            className="action-button"
            onClick={() => window.location.reload()}
          >
            🔄 Retry Loading Map
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${className} osm-map-wrapper`} style={style}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="map-skeleton">
          <div className="map-skeleton-content">
            <div className="map-skeleton-icon" />
            <div className="map-skeleton-text">Loading map...</div>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        id={mapId}
        className="leaflet-map-container"
        style={{ height: '100%', width: '100%', opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease' }}
      />
      
      {/* Map Controls Overlay */}
      <div className="map-controls">
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-icon">📍</span>
            <span>Origin</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🎯</span>
            <span>Destination</span>
          </div>
          {selectedStops.length > 0 && (
            <div className="legend-item">
              <span className="legend-icon">🚏</span>
              <span>{selectedStops.length} Stops</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Center on Route Button - Phase 3.5 */}
      {!isLoading && (
        <button 
          className="map-center-button"
          onClick={handleCenterOnRoute}
          aria-label="Center map on route"
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M1 12h6m6 0h6"/>
          </svg>
          <span>Center Route</span>
        </button>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  const fromSame = prevProps.fromLocation?.id === nextProps.fromLocation?.id &&
                   prevProps.fromLocation?.name === nextProps.fromLocation?.name;
  const toSame = prevProps.toLocation?.id === nextProps.toLocation?.id &&
                 prevProps.toLocation?.name === nextProps.toLocation?.name;
  const stopsSame = prevProps.selectedStops?.length === nextProps.selectedStops?.length;
  const busesSame = prevProps.buses?.length === nextProps.buses?.length;
  const mapIdSame = prevProps.mapId === nextProps.mapId;
  
  return fromSame && toSame && stopsSame && busesSame && mapIdSame;
});

export default OpenStreetMapComponent;