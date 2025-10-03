import React, { useEffect, useRef } from 'react';
import type { Location, Stop } from '../types/index';
import { getStopCoordinates, getStopCoordinatesAsync, getCoordinateSource } from '../utils/cityCoordinates';
import '../styles/OpenStreetMapComponent.css';

interface OpenStreetMapComponentProps {
  fromLocation: Location;
  toLocation: Location;
  selectedStops?: Stop[];
  buses?: any[];
  onBusClick?: (bus: any) => void;
  className?: string;
  style?: React.CSSProperties;
  mapId?: string;
}

/**
 * OpenStreetMap Component using Leaflet
 * Provides interactive maps with route visualization, markers, and popups
 */
const OpenStreetMapComponent: React.FC<OpenStreetMapComponentProps> = ({
  fromLocation,
  toLocation,
  selectedStops = [],
  buses = [],
  onBusClick,
  className = 'map-container',
  style = { height: '450px', width: '100%' },
  mapId = 'osm-map'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const isInitializingRef = useRef<boolean>(false);
  const lastPropsRef = useRef<any>(null);

  useEffect(() => {
    // Check if props have actually changed to avoid unnecessary re-renders
    const currentProps = { fromLocation, toLocation, selectedStops, buses };
    const propsChanged = !lastPropsRef.current || 
      JSON.stringify(lastPropsRef.current) !== JSON.stringify(currentProps);
    
    if (!propsChanged && mapInstanceRef.current) {
      return; // No changes, keep existing map
    }
    
    lastPropsRef.current = currentProps;

    // Dynamic import to avoid SSR issues
    const initializeMap = async () => {
      try {
        // Prevent multiple simultaneous initializations
        if (isInitializingRef.current) {
          console.log('Map initialization already in progress, skipping');
          return;
        }
        
        isInitializingRef.current = true;
        
        // Check if Leaflet is available
        if (typeof window !== 'undefined') {
          // Try to load Leaflet dynamically
          const L = (window as any).L;
          
          if (!L) {
            console.warn('Leaflet not loaded, showing fallback');
            isInitializingRef.current = false;
            return;
          }

          if (mapRef.current) {
            // Clean up existing map first
            if (mapInstanceRef.current) {
              try {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
              } catch (error) {
                console.warn('Error cleaning up previous map:', error);
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

            // Add error handler
            map.on('error', (e: any) => {
              console.error('Leaflet map error:', e);
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
            console.log('OpenStreetMapComponent: Selected stops:', selectedStops.length);
            
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
                console.log(`Attempting geocoding for stop: "${stop.name}"`);
                const asyncResult = await getStopCoordinatesAsync(stop);
                if (asyncResult) {
                  return { 
                    stop, 
                    coords: { latitude: asyncResult.latitude, longitude: asyncResult.longitude }, 
                    source: asyncResult.source, 
                    index 
                  };
                }
                
                console.warn(`OpenStreetMapComponent: No coordinates found for stop "${stop.name}" even after geocoding`);
                return null;
              } catch (error) {
                console.error(`Error processing coordinates for stop "${stop.name}":`, error);
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
                console.log(`OpenStreetMapComponent: Stop "${stop.name}": ${source} at (${coords.latitude}, ${coords.longitude})`);
              });
            
            console.log(`OpenStreetMapComponent: ${stopsWithCoordinates.length}/${selectedStops.length} stops have coordinates`);
            
            // Show warning if some stops couldn't be located
            if (stopsWithCoordinates.length < selectedStops.length) {
              const missingStops = selectedStops.filter(stop => 
                !stopsWithCoordinates.some(swc => swc.stop.name === stop.name)
              );
              console.warn('Some stops could not be located on the map:', missingStops.map(s => s.name));
              
              // Optionally show a notification to the user
              // You could integrate with a toast notification system here
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
            buses.forEach((bus, index) => {
              if ('latitude' in bus && 'longitude' in bus) {
                const busMarker = L.marker([bus.latitude, bus.longitude], {
                  icon: busStopIcon
                }).addTo(map);

                busMarker.bindPopup(`
                  <div class="map-popup">
                    <h4>${bus.busName || 'Bus Service'}</h4>
                    <p>Number: ${bus.busNumber}</p>
                    <p>Status: Live</p>
                  </div>
                `);

                if (onBusClick) {
                  busMarker.on('click', () => onBusClick(bus));
                }
              }
            });

            mapInstanceRef.current = map;
            
            // Ensure proper sizing after initialization
            setTimeout(() => {
              if (map) {
                try {
                  map.invalidateSize();
                } catch (error) {
                  console.warn('Error invalidating map size:', error);
                }
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error initializing OpenStreetMap:', error);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      isInitializingRef.current = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error during map cleanup:', error);
        } finally {
          mapInstanceRef.current = null;
        }
      }
    };
  }, [fromLocation?.id, toLocation?.id, selectedStops?.length, buses?.length]);

  // Fallback content when Leaflet is not available
  const FallbackContent = () => (
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
      <div 
        ref={mapRef} 
        id={mapId}
        className="leaflet-map-container"
        style={{ height: '100%', width: '100%' }}
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
    </div>
  );
};

export default OpenStreetMapComponent;