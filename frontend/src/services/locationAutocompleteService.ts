import { api } from './api';
import { GeocodingService } from './geocodingService';
import { logger } from '../utils/logger';

export interface LocationSuggestion {
  id: number;
  name: string;
  translatedName?: string;
  latitude?: number;
  longitude?: number;
  source?: string;
}

/**
 * Ultra-fast location autocomplete service with instant suggestions
 */
export class LocationAutocompleteService {
  private static readonly MIN_QUERY_LENGTH = 3; // Check database after 3 characters as per requirement
  private static readonly DEBOUNCE_DELAY = 100; // Reduced for faster response
  private static readonly INSTANT_DEBOUNCE = 50; // Ultra-fast for instant suggestions
  
  private debounceTimeout: NodeJS.Timeout | null = null;

  /**
   * Get ultra-fast location suggestions with instant responses
   * @param query The search query (minimum 2 characters)
   * @param language The language code for localized names
   * @returns Promise<LocationSuggestion[]>
   */
  async getLocationSuggestions(
    query: string, 
    language: string = 'en'
  ): Promise<LocationSuggestion[]> {
    // Return empty for very short queries (less than 3 characters)
    if (query.length < LocationAutocompleteService.MIN_QUERY_LENGTH) {
      return [];
    }

    try {
      logger.debug(`🚀 FastAutocomplete: Searching for "${query}" (${query.length} chars)`);
      
      // Use fast parallel search for better performance
      const locations = await this.searchDatabaseAndNominatimParallel(query, 10);
      
      if (!locations || !Array.isArray(locations)) {
        logger.error(`❌ Invalid locations result:`, locations);
        return [];
      }
      
      // Prioritize bus stands for better user experience
      const prioritizedLocations = this.prioritizeBusStands(locations);
      const suggestions = this.convertToSuggestions(prioritizedLocations);
      logger.debug(`✅ Converted to ${suggestions.length} suggestions (bus stands prioritized)`);
      
      return suggestions;
      
    } catch (error) {
      logger.error('Error in fast autocomplete:', error);
      
      // Fallback to instant suggestions
      const instantResults = GeocodingService.getInstantSuggestions(query, 10);
      logger.debug(`🔄 Fallback instant results for "${query}": ${instantResults.map(r => r.name).join(', ')}`);
      if (instantResults.length > 0) {
        return this.convertToSuggestions(instantResults);
      }
      
      // Final fallback to original API
      try {
        const response = await api.get('/api/v1/bus-schedules/locations/autocomplete', {
          params: {
            q: query.trim(),
            language: language
          }
        });

        return (response.data || []).map((item: LocationSuggestion) => ({
          id: item.id,
          name: item.name,
          translatedName: item.translatedName,
          latitude: item.latitude,
          longitude: item.longitude,
          source: 'database'
        }));
      } catch (fallbackError) {
        logger.error('All autocomplete methods failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Database-first search: prioritize database, then local cities, then Nominatim
   * This prevents unnecessary Nominatim API calls when we have data locally
   */
  private async searchDatabaseAndNominatimParallel(query: string, limit: number): Promise<LocationSuggestion[]> {
    logger.debug(`🚀 Starting database-first search for "${query}"`);
    
    try {
      // Try database first
      const databaseResults = await this.searchDatabase(query);
      
      logger.debug(`📊 Database results: ${databaseResults.length}`);
      
      // If database has results, use them and skip Nominatim
      if (databaseResults.length > 0) {
        logger.debug(`✅ Using database results (${databaseResults.length}) - skipping Nominatim`);
        return databaseResults.map(loc => ({ ...loc, source: 'database' }));
      }
      
      // Check instant suggestions (local cities list) before Nominatim
      const instantResults = GeocodingService.getInstantSuggestions(query, limit);
      if (instantResults.length > 0) {
        logger.debug(`⚡ Using instant suggestions (${instantResults.length}) - skipping Nominatim`);
        return this.convertToSuggestions(instantResults).map(loc => ({ ...loc, source: 'local' }));
      }
      
      // Only call Nominatim if database and local are empty
      logger.debug(`⚠️ Database empty, falling back to Nominatim for "${query}"`);
      const nominatimResults = await this.searchNominatimFast(query, limit);
      
      if (nominatimResults.length > 0) {
        logger.debug(`🌍 Using Nominatim results (${nominatimResults.length})`);
        return nominatimResults.map(loc => ({ ...loc, source: 'nominatim' }));
      }
      
      logger.debug(`❌ No results found from database, local, or Nominatim`);
      return [];
      
    } catch (error) {
      logger.error('Database-first search failed:', error);
      // Fallback to instant suggestions, then Nominatim
      const instantResults = GeocodingService.getInstantSuggestions(query, limit);
      if (instantResults.length > 0) {
        return this.convertToSuggestions(instantResults).map(loc => ({ ...loc, source: 'local' }));
      }
      
      try {
        logger.debug(`🔄 Fallback: Trying Nominatim only for "${query}"`);
        const nominatimFallback = await this.searchNominatimFast(query, limit);
        return nominatimFallback.map(loc => ({ ...loc, source: 'nominatim' }));
      } catch (nominatimError) {
        logger.error('Nominatim fallback also failed:', nominatimError);
        return [];
      }
    }
  }
  
  /**
   * Fast database search with timeout
   */
  private async searchDatabase(query: string): Promise<LocationSuggestion[]> {
    try {
      logger.debug(`📊 Fast database search for "${query}"`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // Reduced to 1.5 seconds
      
      const response = await api.get('/api/v1/bus-schedules/locations/autocomplete', {
        params: { q: query.trim(), language: 'en' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const results = response.data || [];
      logger.debug(`📊 Database returned ${results.length} results`);
      
      if (results.length === 0) {
        logger.debug(`⚠️ Database empty for "${query}" - this is expected during development`);
      }
      
      return results;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('Database search timed out - using Nominatim fallback');
      } else {
        logger.warn(`Database search error: ${error instanceof Error ? error.message : String(error)} - using Nominatim fallback`);
      }
      return [];
    }
  }
  
  /**
   * Fast Nominatim search with minimal delays and single query
   */
  private async searchNominatimFast(query: string, limit: number): Promise<LocationSuggestion[]> {
    try {
      logger.debug(`🌍 Fast Nominatim search for "${query}"`);
      
      // Use a single, optimized query instead of multiple attempts
      const searchQuery = `${query}, Tamil Nadu, India`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
          q: searchQuery,
          format: 'json',
          countrycodes: 'in',
          limit: String(Math.min(limit, 5)), // Reduced limit for speed
          addressdetails: '1'
        }),
        {
          headers: { 'User-Agent': 'Perundhu Bus App (https://perundhu.com)' },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        logger.warn(`Nominatim error: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      logger.debug(`🌍 Nominatim returned ${data.length} results`);
      
      // Extended interface for Nominatim results
      interface NominatimResult {
        type: string;
        addresstype: string;
        class: string;
        address?: { state_district?: string };
        display_name: string;
        lat: string;
        lon: string;
        name?: string;
      }
      
      // Filter for valid places including bus stations and bus stops
      const validResults = data.filter((result: NominatimResult) => {
        // Accept bus stations and bus stops with high priority
        const isBusStationOrStop = result.type === 'bus_station' || 
                                    result.type === 'bus_stop' || 
                                    result.class === 'amenity' ||
                                    result.class === 'highway'; // bus_stop is often under highway class
        
        // Accept various place types
        const isValidPlace = (
          ['city', 'town', 'village', 'hamlet'].includes(result.type) ||
          ['city', 'town', 'village', 'state_district', 'county'].includes(result.addresstype) ||
          (result.class === 'boundary' && result.type === 'administrative' && result.address?.state_district)
        );
        
        // Exclude roads and highways
        const isNotRoad = (
          result.class !== 'highway' && 
          result.class !== 'landuse' &&
          !result.type.includes('road') && 
          !result.type.includes('street') &&
          result.type !== 'industrial'
        );
        
        return (isBusStationOrStop || isValidPlace) && isNotRoad;
      });
      
      // Sort results: bus stations/stops first, then other places
      const sortedResults = validResults.sort((a: NominatimResult, b: NominatimResult) => {
        const aIsBusStationOrStop = a.type === 'bus_station' || a.type === 'bus_stop';
        const bIsBusStationOrStop = b.type === 'bus_station' || b.type === 'bus_stop';
        if (aIsBusStationOrStop && !bIsBusStationOrStop) return -1;
        if (!aIsBusStationOrStop && bIsBusStationOrStop) return 1;
        return 0;
      });
      
      logger.debug(`🌍 Filtered to ${sortedResults.length} results (bus stations prioritized)`);
      
      return sortedResults.map((result: NominatimResult) => ({
        id: -(Math.random() * 1000000), // Unique negative ID
        name: result.name || this.formatLocationNameSimple(result.display_name),
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        source: 'nominatim'
      }));
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('Nominatim search timed out');
      } else {
        logger.error('Nominatim search error:', error);
      }
      return [];
    }
  }

  /**
   * Remove duplicate locations based on name similarity
   */
  private deduplicateResults(locations: LocationSuggestion[]): LocationSuggestion[] {
    const filtered: LocationSuggestion[] = [];
    
    for (const location of locations) {
      const isDuplicate = filtered.some(existing => {
        const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
        const name1 = normalize(location.name);
        const name2 = normalize(existing.name);
        
        return name1 === name2 || name1.includes(name2) || name2.includes(name1);
      });
      
      if (!isDuplicate) {
        filtered.push(location);
      }
    }
    
    return filtered;
  }

  /**
   * Sort results to prioritize bus stands and bus stops first.
   * Bus stands are identified by having " - " in their name (e.g., "Madurai - Mattuthavani").
   * Bus stops are identified by "Bus Stop" suffix (e.g., "Srivilliputhur - Bus Stop").
   * For Nominatim results, bus_station and bus_stop types are prioritized.
   * Also prioritizes exact name matches for better user experience.
   */
  private prioritizeBusStands(locations: LocationSuggestion[]): LocationSuggestion[] {
    return [...locations].sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Priority 1: Bus stands with " - " pattern (e.g., "Madurai - Mattuthavani")
      const aIsBusStand = a.name.includes(' - ');
      const bIsBusStand = b.name.includes(' - ');
      
      // Priority 2: Bus stop/stand keywords
      const aHasBusKeyword = aName.includes('bus stop') || 
                              aName.includes('bus stand') ||
                              aName.includes('bus station') ||
                              aName.includes('bus terminus');
      const bHasBusKeyword = bName.includes('bus stop') || 
                              bName.includes('bus stand') ||
                              bName.includes('bus station') ||
                              bName.includes('bus terminus');
      
      // Calculate priority score (lower = higher priority)
      const getScore = (isBusStand: boolean, hasBusKeyword: boolean, source?: string): number => {
        let score = 100;
        if (isBusStand) score -= 50;  // Highest priority for bus stands
        if (hasBusKeyword) score -= 30;  // Second priority for bus keywords
        if (source === 'database') score -= 10;  // Prefer database results
        return score;
      };
      
      const aScore = getScore(aIsBusStand, aHasBusKeyword, a.source);
      const bScore = getScore(bIsBusStand, bHasBusKeyword, b.source);
      
      if (aScore !== bScore) return aScore - bScore;
      
      // If scores equal, sort alphabetically
      return aName.localeCompare(bName);
    });
  }

  /**
   * Convert Location objects to LocationSuggestion format
   */
  private convertToSuggestions(locations: LocationSuggestion[]): LocationSuggestion[] {
    return locations.map(location => ({
      id: location.id,
      name: location.name,
      translatedName: location.translatedName,
      latitude: location.latitude,
      longitude: location.longitude,
      source: location.source
    }));
  }

  /**
   * Get ultra-fast debounced suggestions with different delays for different query lengths
   * @param query The search query
   * @param language The language code
   * @param callback Callback function to handle results
   */
  getDebouncedSuggestions(
    query: string,
    callback: (suggestions: LocationSuggestion[]) => void,
    language: string = 'en'
  ): void {
    // Clear previous timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Use faster debounce delays for better UX
    const delay = query.length <= 3 ? 
      LocationAutocompleteService.INSTANT_DEBOUNCE : 
      LocationAutocompleteService.DEBOUNCE_DELAY;

    this.debounceTimeout = setTimeout(async () => {
      try {
        const suggestions = await this.getLocationSuggestions(query, language);
        // Use requestIdleCallback to prevent blocking UI updates
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => callback(suggestions));
        } else {
          callback(suggestions);
        }
      } catch (error) {
        logger.error(`❌ Error in debounced search for "${query}":`, error);
        callback([]); // Call callback with empty results on error
      }
    }, delay);
  }

  /**
   * Simple location name formatter (city first)
   */
  private formatLocationNameSimple(displayName: string): string {
    if (!displayName?.includes(',')) {
      return displayName || '';
    }
    
    const parts = displayName.split(',').map(part => part.trim());
    const cityName = parts[0];
    
    // Find district (skip state/country)
    const districtName = parts.find(part => 
      !/(tamil nadu|india|\d{5,6})/i.test(part) && 
      part !== cityName && 
      part.length > 2
    );
    
    return districtName ? `${cityName}, ${districtName}` : cityName;
  }

  /**
   * Clear any pending debounced requests
   */
  clearDebounce(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }
}

// Export singleton instance
export const locationAutocompleteService = new LocationAutocompleteService();