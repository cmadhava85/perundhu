import L from 'leaflet';
import { getEnv } from '../utils/envUtils';

// Extend the Window interface to include initMap
declare global {
  interface Window {
    initMap: () => void;
  }
}

// Change from enum to object with constants for TypeScript compatibility
export const MapProvider = {
  LEAFLET: 'leaflet',
  GOOGLE: 'google'
} as const;

export type MapProviderType = typeof MapProvider[keyof typeof MapProvider];

export interface MapOptions {
  center?: [number, number]; 
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

export interface RouteOptions {
  color?: string;
  weight?: number;
  opacity?: number;
  dashArray?: string;
}

export interface MarkerOptions {
  icon?: L.Icon | L.DivIcon;
  title?: string;
  alt?: string;
  zIndexOffset?: number;
  opacity?: number;
}

export interface IMapService {
  init(): Promise<void>;
  createMap(elementId: string, options?: MapOptions): void;
  drawRoute(points: [number, number][], options?: RouteOptions): L.Polyline | google.maps.Polyline | null;
  addMarker(position: [number, number], options?: MarkerOptions): L.Marker | google.maps.Marker | null;
  clearMarkers(): void;
  clearRoutes(): void;
  cleanup(): void;
  fitBounds(points: [number, number][]): void;
  setView(position: [number, number], zoom?: number): void;
  getProvider(): MapProviderType;
}

class LeafletMapService implements IMapService {
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];
  private routes: L.Polyline[] = [];
  
  async init(): Promise<void> {
    // No special initialization needed for Leaflet
    return Promise.resolve();
  }
  
  createMap(elementId: string, options: MapOptions = {}): void {
    try {
      // Get the element and validate it exists
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID '${elementId}' not found.`);
      }
      
      // Check if element has dimensions
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        throw new Error(`Element with ID '${elementId}' has no dimensions (${rect.width}x${rect.height}). Ensure the container has explicit width and height.`);
      }
      
      // Ensure element is properly positioned and stable
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.position === 'static') {
        element.style.position = 'relative';
      }
      
      // Add a small delay to ensure DOM stability
      if (element.offsetParent === null && element !== document.body) {
        console.warn('Map container may not be properly attached to DOM');
      }
      
      // Clean up any existing map with better error handling
      if (this.map) {
        try {
          this.cleanup();
        } catch (cleanupError) {
          console.warn('Error during cleanup before creating new map:', cleanupError);
        }
      }
      
      // Wait for any pending DOM updates
      requestAnimationFrame(() => {
        // Double-check that element still exists after async operation
        const elementCheck = document.getElementById(elementId);
        if (elementCheck) {
          this.initializeLeafletMap(elementCheck, options);
        } else {
          console.error('Element disappeared during map initialization');
        }
      });
      
    } catch (error) {
      console.error('Error creating Leaflet map:', error);
      throw error;
    }
  }
  
  private initializeLeafletMap(element: HTMLElement, options: MapOptions): void {
    try {
      // Additional DOM stability checks
      if (!element.isConnected) {
        throw new Error('Element is not connected to DOM');
      }
      
      // Check if element is visible
      const isVisible = element.offsetWidth > 0 && element.offsetHeight > 0;
      if (!isVisible) {
        throw new Error('Element is not visible');
      }
      
      // Create map instance with better error handling
      this.map = L.map(element, {
        center: options.center || [13.0827, 80.2707], // Default to Chennai
        zoom: options.zoom || 10,
        minZoom: options.minZoom || 5,
        maxZoom: options.maxZoom || 18,
        // Add these options to prevent positioning issues
        preferCanvas: false,
        attributionControl: true,
        zoomControl: true,
        // Additional options to prevent _leaflet_pos errors
        trackResize: true,
        boxZoom: true,
        doubleClickZoom: true,
        dragging: true
      });
      
      // Add tile layer (OpenStreetMap by default)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.map);
      
      // Add scale control
      L.control.scale().addTo(this.map);
      
      // Add error handling for map events
      this.map.on('error', (e: L.LeafletEvent) => {
        console.error('Leaflet map error:', e);
      });
      
      // Ensure proper sizing with multiple attempts
      this.ensureMapSizing();
      
    } catch (error) {
      console.error('Error initializing Leaflet map instance:', error);
      this.map = null;
      throw error;
    }
  }
  
  private ensureMapSizing(): void {
    if (!this.map) return;
    
    // Multiple resize attempts with increasing delays
    const resizeAttempts = [50, 100, 200, 500];
    
    resizeAttempts.forEach((delay, index) => {
      setTimeout(() => {
        if (this.map) {
          try {
            this.map.invalidateSize();
            console.log(`Map resize attempt ${index + 1} completed`);
          } catch (error) {
            console.warn(`Map resize attempt ${index + 1} failed:`, error);
          }
        }
      }, delay);
    });
  }
  
  drawRoute(points: [number, number][], options: RouteOptions = {}): L.Polyline {
    if (!this.map) {
      throw new Error('Map not initialized. Call createMap first.');
    }
    
    const route = L.polyline(points, {
      color: options.color || '#3B82F6', // Default blue
      weight: options.weight || 5,
      opacity: options.opacity || 0.8,
      dashArray: options.dashArray
    }).addTo(this.map);
    
    this.routes.push(route);
    return route;
  }
  
  addMarker(position: [number, number], options: MarkerOptions = {}): L.Marker {
    if (!this.map) {
      throw new Error('Map not initialized. Call createMap first.');
    }
    
    const marker = L.marker(position, {
      icon: options.icon,
      title: options.title,
      alt: options.alt,
      zIndexOffset: options.zIndexOffset,
      opacity: options.opacity || 1
    }).addTo(this.map);
    
    this.markers.push(marker);
    return marker;
  }
  
  clearMarkers(): void {
    this.markers.forEach(marker => {
      marker.remove();
    });
    this.markers = [];
  }
  
  clearRoutes(): void {
    this.routes.forEach(route => {
      route.remove();
    });
    this.routes = [];
  }
  
  cleanup(): void {
    console.log('Cleaning up Leaflet map...');
    
    // Clear markers
    this.clearMarkers();
    
    // Clear routes
    this.clearRoutes();
    
    // Remove map instance
    if (this.map) {
      try {
        // Remove all event listeners
        this.map.off();
        
        // Remove the map
        this.map.remove();
        this.map = null;
        console.log('Leaflet map cleaned up successfully');
      } catch (error) {
        console.error('Error during Leaflet cleanup:', error);
        this.map = null; // Force cleanup even if error occurs
      }
    }
  }
  
  fitBounds(points: [number, number][]): void {
    if (!this.map) {
      throw new Error('Map not initialized. Call createMap first.');
    }
    
    if (points.length > 0) {
      this.map.fitBounds(points);
    }
  }
  
  setView(position: [number, number], zoom?: number): void {
    if (!this.map) {
      throw new Error('Map not initialized. Call createMap first.');
    }
    
    this.map.setView(position, zoom || this.map.getZoom());
  }
  
  getProvider(): MapProviderType {
    return MapProvider.LEAFLET;
  }
}

class GoogleMapsService implements IMapService {
  private map: google.maps.Map | null = null;
  private markers: google.maps.Marker[] = [];
  private routes: google.maps.Polyline[] = [];
  private apiKey: string;
  private isLoaded: boolean = false;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async init(): Promise<void> {
    // Skip if already loaded
    if (this.isLoaded) {
      return Promise.resolve();
    }
    
    // Load Google Maps API
    return new Promise<void>((resolve, reject) => {
      // Define callback for when API loads
      window.initMap = () => {
        this.isLoaded = true;
        resolve();
      };
      
      // Create script element to load API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&callback=initMap`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Google Maps failed to load'));
      document.head.appendChild(script);
    });
  }
  
  createMap(elementId: string, options: MapOptions = {}): void {
    if (!this.isLoaded) {
      throw new Error('Google Maps API not loaded. Call init first.');
    }
    
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID '${elementId}' not found.`);
    }
    
    this.map = new google.maps.Map(element, {
      center: { 
        lat: options.center?.[0] || 13.0827, 
        lng: options.center?.[1] || 80.2707 
      },
      zoom: options.zoom || 10,
      minZoom: options.minZoom || 5,
      maxZoom: options.maxZoom || 18
    });
  }
  
  drawRoute(points: [number, number][], options: RouteOptions = {}): google.maps.Polyline {
    if (!this.map) {
      throw new Error('Map not initialized. Call createMap first.');
    }
    
    // Convert points to Google LatLng objects
    const path = points.map(point => ({
      lat: point[0],
      lng: point[1]
    }));
    
    const route = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: options.color || '#3B82F6',
      strokeOpacity: options.opacity || 0.8,
      strokeWeight: options.weight || 5
    });
    
    route.setMap(this.map);
    this.routes.push(route);
    return route;
  }
  
  addMarker(position: [number, number], options: MarkerOptions = {}): google.maps.Marker {
    if (!this.map) {
      throw new Error('Map not initialized. Call createMap first.');
    }
    
    const marker = new google.maps.Marker({
      position: { lat: position[0], lng: position[1] },
      map: this.map,
      title: options.title,
      opacity: options.opacity || 1
    });
    
    this.markers.push(marker);
    return marker;
  }
  
  clearMarkers(): void {
    this.markers.forEach(marker => {
      marker.setMap(null);
    });
    this.markers = [];
  }
  
  clearRoutes(): void {
    this.routes.forEach(route => {
      route.setMap(null);
    });
    this.routes = [];
  }
  
  cleanup(): void {
    this.clearMarkers();
    this.clearRoutes();
    this.map = null;
  }
  
  fitBounds(points: [number, number][]): void {
    if (!this.map || points.length === 0) {
      return;
    }
    
    const bounds = new google.maps.LatLngBounds();
    
    points.forEach(point => {
      bounds.extend({ lat: point[0], lng: point[1] });
    });
    
    this.map.fitBounds(bounds);
  }
  
  setView(position: [number, number], zoom?: number): void {
    if (!this.map) {
      throw new Error('Map not initialized. Call createMap first.');
    }
    
    this.map.setCenter({ lat: position[0], lng: position[1] });
    if (zoom) {
      this.map.setZoom(zoom);
    }
  }
  
  getProvider(): MapProviderType {
    return MapProvider.GOOGLE;
  }
}

// Factory to create the appropriate map service
export const createMapService = (): IMapService => {
  // Get provider from environment or configuration
  const preferredProvider = getEnv('VITE_MAP_PROVIDER', 'leaflet');
  const googleMapsApiKey = getEnv('VITE_GOOGLE_MAPS_API_KEY', '');
  
  if (preferredProvider === MapProvider.GOOGLE && googleMapsApiKey) {
    return new GoogleMapsService(googleMapsApiKey);
  } else {
    return new LeafletMapService();
  }
};

// Export a singleton instance
const mapService: IMapService = createMapService();
export default mapService;