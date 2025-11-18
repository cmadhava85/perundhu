import { api } from './api';
import type { Location } from '../types';
import { logDebug, logError } from '../utils/logger';

/**
 * OSM Bus Stop with enhanced facility information
 */
export interface OSMBusStop {
  osmId: number;
  name: string;
  latitude: number;
  longitude: number;
  stopType: 'bus_stop' | 'platform' | 'station';
  hasShelter: boolean;
  hasBench: boolean;
  network?: string;
  operator?: string;
  accessibility?: string;
  surface?: string;
  distanceFromRoute?: number;
}

/**
 * OSM Bus Route information
 */
export interface OSMBusRoute {
  osmId: number;
  routeRef: string;
  routeName: string;
  network?: string;
  operator?: string;
  fromLocation?: string;
  toLocation?: string;
  relevanceScore: number;
  stops?: OSMBusStop[];
  routeType?: string;
  frequency?: string;
  operatingHours?: string;
  estimatedDuration?: number;
  estimatedDistance?: number;
}

/**
 * Enhanced OSM service for bus stop and route discovery
 */
export class OSMDiscoveryService {
  
  /**
   * Discover intermediate bus stops between two locations using OSM data
   */
  static async discoverIntermediateStops(
    fromLocation: Location,
    toLocation: Location,
    radiusKm: number = 25.0
  ): Promise<OSMBusStop[]> {
    try {
      logDebug(`Discovering OSM stops between ${fromLocation.name} and ${toLocation.name}`, {
        component: 'OSMDiscoveryService',
        action: 'discoverIntermediateStops'
      });
      
      const response = await api.get('/api/v1/bus-schedules/discover-stops', {
        params: {
          fromLocationId: fromLocation.id,
          toLocationId: toLocation.id,
          radiusKm
        }
      });
      
      logDebug(`Found ${response.data.length} intermediate stops from OSM`, {
        component: 'OSMDiscoveryService',
        count: response.data.length
      });
      return response.data;
    } catch (error) {
      logError('Error discovering intermediate stops', error, {
        component: 'OSMDiscoveryService'
      });
      throw error;
    }
  }

  /**
   * Discover actual bus routes using OSM data
   */
  static async discoverOSMRoutes(
    fromLocation: Location,
    toLocation: Location
  ): Promise<OSMBusRoute[]> {
    try {
      logDebug(`Discovering OSM routes between ${fromLocation.name} and ${toLocation.name}`, {
        component: 'OSMDiscoveryService',
        action: 'discoverOSMRoutes'
      });
      
      const response = await api.get('/api/v1/bus-schedules/discover-routes', {
        params: {
          fromLocationId: fromLocation.id,
          toLocationId: toLocation.id
        }
      });
      
      logDebug(`Found ${response.data.length} OSM routes`, {
        component: 'OSMDiscoveryService',
        count: response.data.length
      });
      return response.data;
    } catch (error) {
      logError('Error discovering OSM routes', error, {
        component: 'OSMDiscoveryService'
      });
      throw error;
    }
  }

  /**
   * Find bus stops along a specific route corridor
   * This is a placeholder for future enhancement
   */
  static async findStopsAlongRoute(): Promise<OSMBusStop[]> {
    // This would require a new backend endpoint for corridor-based search
    // For now, we'll use the existing discovery method with expanded search
    logDebug('Finding stops along route corridor - feature coming soon', {
      component: 'OSMDiscoveryService'
    });
    return [];
  }

  /**
   * Validate if a stop is relevant to the route
   */
  static isStopRelevantToRoute(
    stop: OSMBusStop,
    fromLocation: Location,
    toLocation: Location,
    maxDeviationKm: number = 10.0
  ): boolean {
    // Calculate if the stop is reasonably close to the direct route
    const directDistance = this.calculateDistance(
      fromLocation.latitude, fromLocation.longitude,
      toLocation.latitude, toLocation.longitude
    );
    
    const viaStopDistance = 
      this.calculateDistance(fromLocation.latitude, fromLocation.longitude, stop.latitude, stop.longitude) +
      this.calculateDistance(stop.latitude, stop.longitude, toLocation.latitude, toLocation.longitude);
    
    const deviation = viaStopDistance - directDistance;
    return deviation <= maxDeviationKm;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Filter stops by facilities (shelter, bench, accessibility)
   */
  static filterStopsByFacilities(
    stops: OSMBusStop[],
    requireShelter: boolean = false,
    requireBench: boolean = false,
    requireAccessibility: boolean = false
  ): OSMBusStop[] {
    return stops.filter(stop => {
      if (requireShelter && !stop.hasShelter) return false;
      if (requireBench && !stop.hasBench) return false;
      if (requireAccessibility && !stop.accessibility) return false;
      return true;
    });
  }

  /**
   * Group stops by network/operator
   */
  static groupStopsByNetwork(stops: OSMBusStop[]): Record<string, OSMBusStop[]> {
    const grouped: Record<string, OSMBusStop[]> = {};
    
    stops.forEach(stop => {
      const key = stop.network || stop.operator || 'Unknown';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(stop);
    });
    
    return grouped;
  }

  /**
   * Sort stops by relevance to route
   */
  static sortStopsByRelevance(
    stops: OSMBusStop[],
    fromLocation: Location,
    toLocation: Location
  ): OSMBusStop[] {
    return stops.sort((a, b) => {
      const aRelevant = this.isStopRelevantToRoute(a, fromLocation, toLocation);
      const bRelevant = this.isStopRelevantToRoute(b, fromLocation, toLocation);
      
      if (aRelevant && !bRelevant) return -1;
      if (!aRelevant && bRelevant) return 1;
      
      // If both are relevant or both irrelevant, sort by distance from route
      const aDistance = a.distanceFromRoute || 0;
      const bDistance = b.distanceFromRoute || 0;
      return aDistance - bDistance;
    });
  }
}