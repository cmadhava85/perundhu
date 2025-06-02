import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { BusRoute, BusSchedule, BusStop } from '../types/busTypes';

const DB_NAME = 'perundhuOfflineDB';
const DB_VERSION = 1;

// Database stores
const STORES = {
  ROUTES: 'routes',
  SCHEDULES: 'schedules',
  STOPS: 'stops',
  USER_SEARCHES: 'userSearches',
  SYNC_QUEUE: 'syncQueue',
  LOCATIONS: 'locations',
  BUSES: 'buses',
  CONNECTING_ROUTES: 'connectingRoutes',
  BUS_LOCATIONS: 'busLocations',
  SYNC_TIMESTAMPS: 'syncTimestamps'
};

interface PerundhuDB extends IDBPDatabase {
  [key: string]: any;
}

class OfflineService {
  private db: PerundhuDB | null = null;

  async initDB(): Promise<PerundhuDB> {
    if (this.db) return this.db;

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains(STORES.ROUTES)) {
            db.createObjectStore(STORES.ROUTES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.SCHEDULES)) {
            db.createObjectStore(STORES.SCHEDULES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.STOPS)) {
            db.createObjectStore(STORES.STOPS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.USER_SEARCHES)) {
            const userSearchStore = db.createObjectStore(STORES.USER_SEARCHES, { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            userSearchStore.createIndex('timestamp', 'timestamp');
          }
          if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
            db.createObjectStore(STORES.SYNC_QUEUE, { 
              keyPath: 'id', 
              autoIncrement: true 
            });
          }
          if (!db.objectStoreNames.contains(STORES.LOCATIONS)) {
            db.createObjectStore(STORES.LOCATIONS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.BUSES)) {
            db.createObjectStore(STORES.BUSES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.CONNECTING_ROUTES)) {
            db.createObjectStore(STORES.CONNECTING_ROUTES, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.BUS_LOCATIONS)) {
            db.createObjectStore(STORES.BUS_LOCATIONS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.SYNC_TIMESTAMPS)) {
            db.createObjectStore(STORES.SYNC_TIMESTAMPS, { keyPath: 'id' });
          }
        }
      });
      
      console.log('Offline database initialized successfully');
      return this.db;
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
      throw error;
    }
  }

  // Routes methods
  async saveRoutes(routes: BusRoute[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction(STORES.ROUTES, 'readwrite');
    const store = tx.objectStore(STORES.ROUTES);
    
    for (const route of routes) {
      await store.put(route);
    }
  }

  async getRoute(id: string): Promise<BusRoute | undefined> {
    const db = await this.initDB();
    return db.get(STORES.ROUTES, id);
  }

  async getAllRoutes(): Promise<BusRoute[]> {
    const db = await this.initDB();
    return db.getAll(STORES.ROUTES);
  }

  // Schedules methods
  async saveSchedules(schedules: BusSchedule[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction(STORES.SCHEDULES, 'readwrite');
    const store = tx.objectStore(STORES.SCHEDULES);
    
    for (const schedule of schedules) {
      await store.put(schedule);
    }
  }

  async getSchedule(id: string): Promise<BusSchedule | undefined> {
    const db = await this.initDB();
    return db.get(STORES.SCHEDULES, id);
  }

  async getSchedulesByRouteId(routeId: string): Promise<BusSchedule[]> {
    const db = await this.initDB();
    const schedules = await db.getAll(STORES.SCHEDULES);
    return schedules.filter(schedule => schedule.routeId === routeId);
  }

  // Bus stops methods
  async saveStops(stops: BusStop[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction(STORES.STOPS, 'readwrite');
    const store = tx.objectStore(STORES.STOPS);
    
    for (const stop of stops) {
      await store.put(stop);
    }
  }

  async getStop(id: string): Promise<BusStop | undefined> {
    const db = await this.initDB();
    return db.get(STORES.STOPS, id);
  }

  async getAllStops(): Promise<BusStop[]> {
    const db = await this.initDB();
    return db.getAll(STORES.STOPS);
  }

  // User search history methods
  async saveSearch(search: { from: string, to: string, timestamp: number }): Promise<void> {
    const db = await this.initDB();
    await db.add(STORES.USER_SEARCHES, search);
  }

  async getRecentSearches(limit = 5): Promise<any[]> {
    const db = await this.initDB();
    const tx = db.transaction(STORES.USER_SEARCHES, 'readonly');
    const store = tx.objectStore(STORES.USER_SEARCHES);
    const index = store.index('timestamp');
    
    // Get the most recent searches
    const searches = await index.getAll(undefined, limit);
    return searches.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Sync queue methods for operations that need to be synchronized when back online
  async addToSyncQueue(operation: { type: string, data: any }): Promise<void> {
    const db = await this.initDB();
    await db.add(STORES.SYNC_QUEUE, {
      ...operation,
      timestamp: Date.now()
    });
  }

  async getSyncQueue(): Promise<any[]> {
    const db = await this.initDB();
    return db.getAll(STORES.SYNC_QUEUE);
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    await tx.objectStore(STORES.SYNC_QUEUE).clear();
  }

  // Cache management
  async clearAllData(): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction(
      [STORES.ROUTES, STORES.SCHEDULES, STORES.STOPS, STORES.USER_SEARCHES],
      'readwrite'
    );

    await Promise.all([
      tx.objectStore(STORES.ROUTES).clear(),
      tx.objectStore(STORES.SCHEDULES).clear(),
      tx.objectStore(STORES.STOPS).clear(),
      tx.objectStore(STORES.USER_SEARCHES).clear()
    ]);
  }

  // Check cache status
  async getCacheStatus(): Promise<{
    routesCount: number;
    schedulesCount: number;
    stopsCount: number;
    searchesCount: number;
    syncQueueCount: number;
    lastUpdated?: Date;
  }> {
    const db = await this.initDB();

    // Get counts
    const [routes, schedules, stops, searches, syncQueue] = await Promise.all([
      db.getAll(STORES.ROUTES),
      db.getAll(STORES.SCHEDULES),
      db.getAll(STORES.STOPS),
      db.getAll(STORES.USER_SEARCHES),
      db.getAll(STORES.SYNC_QUEUE)
    ]);

    // Find the latest timestamp from all data
    const allTimestamps = [
      ...routes.map(r => r.updatedAt || 0),
      ...schedules.map(s => s.updatedAt || 0),
      ...stops.map(s => s.updatedAt || 0)
    ].filter(Boolean);

    const lastUpdated = allTimestamps.length > 0 
      ? new Date(Math.max(...allTimestamps))
      : undefined;

    return {
      routesCount: routes.length,
      schedulesCount: schedules.length,
      stopsCount: stops.length,
      searchesCount: searches.length,
      syncQueueCount: syncQueue.length,
      lastUpdated
    };
  }

  // New methods required by api.ts
  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  async saveLocationsOffline(locations: any[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction(STORES.LOCATIONS, 'readwrite');
    const store = tx.objectStore(STORES.LOCATIONS);

    await store.put({ id: 'allLocations', data: locations, timestamp: new Date().toISOString() });
  }

  async getLocationsOffline(): Promise<any[]> {
    try {
      const db = await this.initDB();
      const result = await db.get(STORES.LOCATIONS, 'allLocations');
      return result?.data || [];
    } catch (error) {
      console.error('Error getting offline locations:', error);
      return [];
    }
  }

  async saveBusesOffline(fromLocationId: number, toLocationId: number, buses: any[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction(STORES.BUSES, 'readwrite');
    const store = tx.objectStore(STORES.BUSES);

    const key = `${fromLocationId}_${toLocationId}`;
    await store.put({ id: key, data: buses, timestamp: new Date().toISOString() });
  }

  async getBusesOffline(fromLocationId: number, toLocationId: number): Promise<any[]> {
    try {
      const db = await this.initDB();
      const key = `${fromLocationId}_${toLocationId}`;
      const result = await db.get(STORES.BUSES, key);
      return result?.data || [];
    } catch (error) {
      console.error('Error getting offline buses:', error);
      return [];
    }
  }

  async saveStopsOffline(busId: number, stops: any[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction(STORES.STOPS, 'readwrite');
    const store = tx.objectStore(STORES.STOPS);

    await store.put({ id: busId.toString(), data: stops, timestamp: new Date().toISOString() });
  }

  async getStopsOffline(busId: number): Promise<any[]> {
    try {
      const db = await this.initDB();
      const result = await db.get(STORES.STOPS, busId.toString());
      return result?.data || [];
    } catch (error) {
      console.error('Error getting offline stops:', error);
      return [];
    }
  }

  async saveConnectingRoutesOffline(fromLocationId: number, toLocationId: number, routes: any[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction(STORES.CONNECTING_ROUTES, 'readwrite');
    const store = tx.objectStore(STORES.CONNECTING_ROUTES);

    const key = `${fromLocationId}_${toLocationId}`;
    await store.put({ id: key, data: routes, timestamp: new Date().toISOString() });
  }

  async getConnectingRoutesOffline(fromLocationId: number, toLocationId: number): Promise<any[]> {
    try {
      const db = await this.initDB();
      const key = `${fromLocationId}_${toLocationId}`;
      const result = await db.get(STORES.CONNECTING_ROUTES, key);
      return result?.data || [];
    } catch (error) {
      console.error('Error getting offline connecting routes:', error);
      return [];
    }
  }

  async saveBusLocationsOffline(fromLocationId: number, toLocationId: number, locations: any[]): Promise<void> {
    const db = await this.initDB();
    const tx = db.transaction(STORES.BUS_LOCATIONS, 'readwrite');
    const store = tx.objectStore(STORES.BUS_LOCATIONS);

    const key = `${fromLocationId}_${toLocationId}`;
    await store.put({ id: key, data: locations, timestamp: new Date().toISOString() });
  }

  async getBusLocationsOffline(fromLocationId: number, toLocationId: number): Promise<any[]> {
    try {
      const db = await this.initDB();
      const key = `${fromLocationId}_${toLocationId}`;
      const result = await db.get(STORES.BUS_LOCATIONS, key);
      return result?.data || [];
    } catch (error) {
      console.error('Error getting offline bus locations:', error);
      return [];
    }
  }

  async getDataAgeDays(key: string): Promise<number | null> {
    try {
      const db = await this.initDB();
      const result = await db.get(STORES.SYNC_TIMESTAMPS, key);

      if (!result) return null;

      const syncDate = new Date(result.timestamp);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - syncDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (error) {
      console.error('Error getting data age:', error);
      return null;
    }
  }

  async cleanupOldBusLocationData(): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORES.BUS_LOCATIONS, 'readwrite');
      const store = tx.objectStore(STORES.BUS_LOCATIONS);
      const keys = await store.getAllKeys();

      const now = new Date();
      for (const key of keys) {
        const item = await store.get(key);
        if (item) {
          const timestamp = new Date(item.timestamp);
          const diffTime = Math.abs(now.getTime() - timestamp.getTime());
          const diffHours = diffTime / (1000 * 60 * 60);

          // Delete bus location data older than 2 hours
          if (diffHours > 2) {
            await store.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old bus location data:', error);
    }
  }

  async cleanupOldData(maxAgeDays: number = 7): Promise<void> {
    try {
      const db = await this.initDB();
      const stores = [
        STORES.ROUTES,
        STORES.SCHEDULES, 
        STORES.STOPS, 
        STORES.BUSES, 
        STORES.LOCATIONS, 
        STORES.CONNECTING_ROUTES
      ];
      
      const now = new Date();
      
      for (const storeName of stores) {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const keys = await store.getAllKeys();
        
        for (const key of keys) {
          const item = await store.get(key);
          if (item && item.timestamp) {
            const timestamp = new Date(item.timestamp);
            const diffTime = Math.abs(now.getTime() - timestamp.getTime());
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            
            // Delete data older than maxAgeDays
            if (diffDays > maxAgeDays) {
              await store.delete(key);
            }
          }
        }
      }
      
      console.log('Completed cleanup of old offline data');
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }
  
  async getLastSyncTime(key: string): Promise<string | null> {
    try {
      const db = await this.initDB();
      const result = await db.get(STORES.SYNC_TIMESTAMPS, key);
      return result?.timestamp || null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }
  
  async updateSyncTimestamp(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORES.SYNC_TIMESTAMPS, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_TIMESTAMPS);
      
      await store.put({
        id: key,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating sync timestamp:', error);
    }
  }
}

export const offlineService = new OfflineService();
export default offlineService;

// Re-export required methods with the correct signatures for api.ts
export const isOnline = () => offlineService.isOnline();
export const saveLocationsOffline = (locations: any[]) => offlineService.saveLocationsOffline(locations);
export const getLocationsOffline = () => offlineService.getLocationsOffline();
export const saveBusesOffline = (fromLocationId: number, toLocationId: number, buses: any[]) =>
  offlineService.saveBusesOffline(fromLocationId, toLocationId, buses);
export const getBusesOffline = (fromLocationId: number, toLocationId: number) =>
  offlineService.getBusesOffline(fromLocationId, toLocationId);
export const saveStopsOffline = (busId: number, stops: any[]) =>
  offlineService.saveStopsOffline(busId, stops);
export const getStopsOffline = (busId: number) =>
  offlineService.getStopsOffline(busId);
export const saveConnectingRoutesOffline = (fromLocationId: number, toLocationId: number, routes: any[]) =>
  offlineService.saveConnectingRoutesOffline(fromLocationId, toLocationId, routes);
export const getConnectingRoutesOffline = (fromLocationId: number, toLocationId: number) =>
  offlineService.getConnectingRoutesOffline(fromLocationId, toLocationId);
export const saveBusLocationsOffline = (fromLocationId: number, toLocationId: number, locations: any[]) =>
  offlineService.saveBusLocationsOffline(fromLocationId, toLocationId, locations);
export const getBusLocationsOffline = (fromLocationId: number, toLocationId: number) =>
  offlineService.getBusLocationsOffline(fromLocationId, toLocationId);
export const cleanupOldData = (maxAgeDays?: number) => offlineService.cleanupOldData(maxAgeDays);
export const getLastSyncTime = (key: string) => offlineService.getLastSyncTime(key);
export const updateSyncTimestamp = (key: string) => offlineService.updateSyncTimestamp(key);
export const cleanupOldBusLocationData = () => offlineService.cleanupOldBusLocationData();

