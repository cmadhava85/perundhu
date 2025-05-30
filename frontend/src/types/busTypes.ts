import { IDBPDatabase } from 'idb';

/**
 * Type definitions for the Perundhu bus application
 */

// Bus route definition
export interface BusRoute {
  id: string;
  routeNumber: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  duration: number;
  fare: number;
  stops: string[]; // IDs of stops
  scheduleIds?: string[];
}

// Bus stop definition
export interface BusStop {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  facilities: string[];
  routeIds: string[];
  nextBuses?: BusScheduleItem[];
}

// Bus schedule definition
export interface BusSchedule {
  id: string;
  routeId: string;
  weekday: boolean;
  weekend: boolean;
  holiday: boolean;
  departureTime: string;
  arrivalTime: string;
  busNumber: string;
  busType: string;
}

// Schedule item for next buses
export interface BusScheduleItem {
  scheduleId: string;
  routeId: string;
  busNumber: string;
  estimatedArrival: string;
  status: 'on-time' | 'delayed' | 'early' | 'cancelled';
}

// User search history item
export interface SearchHistoryItem {
  id: string;
  fromLocation: string;
  toLocation: string;
  date: string;
  timestamp: number;
}

// Sync queue item for offline operations
export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  entity: 'route' | 'stop' | 'schedule' | 'favorite';
  data: any;
  timestamp: number;
}

// Database type
export interface PerundhuDB extends IDBPDatabase {
  routes: BusRoute[];
  schedules: BusSchedule[];
  stops: BusStop[];
  userSearches: SearchHistoryItem[];
  syncQueue: SyncQueueItem[];
}