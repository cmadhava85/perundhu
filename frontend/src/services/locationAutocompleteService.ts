import { api } from './api';
import { GeocodingService } from './geocodingService';
import { logger } from '../utils/logger';
import type { LocationGroupDTO } from '../types/LocationGroupTypes';

export interface LocationSuggestion {
  id: number;
  name: string;
  translatedName?: string;
  latitude?: number;
  longitude?: number;
  source?: string;
  routeCount?: number;
}

export interface LocationDTO {
  id?: number;
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
  private currentAbortController: AbortController | null = null; // Track active requests

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
    // Return empty for queries shorter than 3 characters
    if (query.length < 3) {
      return [];
    }

    // Cancel any previous request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      logger.debug(`🚫 Aborted previous request for optimization`);
    }

    // Create new abort controller for this request
    this.currentAbortController = new AbortController();
    const signal = this.currentAbortController.signal;

    try {
      logger.debug(`🚀 FastAutocomplete: Searching for "${query}" (${query.length} chars) in ${language}`);
      
      // Use fast parallel search for better performance
      const locations = await this.searchDatabaseAndOverpassParallel(query, 10, language, signal);
      
      if (!locations || !Array.isArray(locations)) {
        logger.error(`❌ Invalid locations result:`, locations);
        return [];
      }
      
      // Remove duplicate locations
      const deduplicatedLocations = this.deduplicateResults(locations);
      logger.debug(`🔍 Deduplication: ${locations.length} -> ${deduplicatedLocations.length} unique results`);
      
      // Prioritize bus stands for better user experience
      const prioritizedLocations = this.prioritizeBusStands(deduplicatedLocations);
      const suggestions = this.convertToSuggestions(prioritizedLocations);
      logger.debug(`✅ Converted to ${suggestions.length} suggestions (bus stands prioritized)`);
      
      return suggestions;
      
    } catch (error) {
      // Ignore abort errors as they're expected when user types quickly
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug(`⏭️ Request aborted for "${query}" - user typing`);
        return [];
      }
      
      logger.error('Error in fast autocomplete:', error);
      
      // Fallback to instant suggestions
      const instantResults = GeocodingService.getInstantSuggestions(query, 10);
      logger.debug(`🔄 Fallback instant results for "${query}": ${instantResults.map(r => r.name).join(', ')}`);
      if (instantResults.length > 0) {
        return this.convertToSuggestions(instantResults);
      }
      
      // Final fallback to original API (without abort since this is last resort)
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
   * Comprehensive search: Use new backend /search-comprehensive endpoint
   * This now searches both database AND locations via Overpass API
   * Falls back to old methods if the new endpoint fails
   * @param signal Optional AbortSignal to cancel the request
   */
  private async searchDatabaseAndOverpassParallel(
    query: string, 
    limit: number, 
    language: string = 'en',
    signal?: AbortSignal
  ): Promise<LocationSuggestion[]> {
    logger.debug(`🚀 Starting comprehensive search for "${query}" (language: ${language})`);
    
    try {
      // Try new comprehensive endpoint first (backend does database + OSM search)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      // Combine the timeout controller with the passed signal
      const combinedSignal = signal || controller.signal;
      
      try {
        const response = await api.get(
          `/api/v1/locations/search-comprehensive?q=${encodeURIComponent(query.trim())}&language=${language}`,
          { signal: combinedSignal }
        );
        
        clearTimeout(timeoutId);
        const results = response.data || [];
        
        if (results.length > 0) {
          logger.debug(`✅ Comprehensive search found ${results.length} results (database + neighborhoods)`);
          return results.map((loc: LocationDTO) => ({
            id: loc.id || -(Math.random() * 1000000),
            name: loc.name,
            translatedName: loc.translatedName,
            latitude: loc.latitude,
            longitude: loc.longitude,
            source: loc.source || 'mixed'
          }));
        }
      } catch (comprehensiveError) {
        clearTimeout(timeoutId);
        // Re-throw if it's an abort error
        if (comprehensiveError instanceof Error && comprehensiveError.name === 'AbortError') {
          throw comprehensiveError;
        }
        logger.error(`Comprehensive endpoint failed, falling back to legacy search`, comprehensiveError);
      }
      
      // Fallback to legacy database-first search
      logger.debug(`⚠️ Comprehensive endpoint unavailable, using legacy database-first search for "${query}"`);
      
      // Try database first
      const databaseResults = await this.searchDatabase(query, language, signal);
      
      logger.debug(`📊 Database results: ${databaseResults.length}`);
      
      // If database has results, use them and skip Nominatim
      if (databaseResults.length > 0) {
        logger.debug(`✅ Using database results (${databaseResults.length})`);
        return databaseResults.map(loc => ({ ...loc, source: 'database' }));
      }
      
      // Check instant suggestions (local cities list) before Nominatim
      const instantResults = GeocodingService.getInstantSuggestions(query, limit);
      if (instantResults.length > 0) {
        logger.debug(`⚡ Using instant suggestions (${instantResults.length})`);
        return this.convertToSuggestions(instantResults).map(loc => ({ ...loc, source: 'local' }));
      }
      
      // Only call Nominatim if database and local are empty
      logger.debug(`🌍 Calling Nominatim for neighborhoods of "${query}"`);
      const nominatimResults = await this.searchNominatimFast(query, limit, language, signal);
      
      if (nominatimResults.length > 0) {
        logger.debug(`🌍 Nominatim found ${nominatimResults.length} results`);
        return nominatimResults.map(loc => ({ ...loc, source: 'nominatim' }));
      }
      
      logger.debug(`❌ No results found from any source`);
      return [];
      
    } catch (error) {
      // Re-throw abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      
      logger.error('Comprehensive search failed:', error);
      // Fallback to instant suggestions
      const instantResults = GeocodingService.getInstantSuggestions(query, 10);
      if (instantResults.length > 0) {
        return this.convertToSuggestions(instantResults).map(loc => ({ ...loc, source: 'local' }));
      }
      
      try {
        logger.debug(`🔄 Final fallback: Trying Nominatim for "${query}"`);
        const nominatimFallback = await this.searchNominatimFast(query, 10, language, signal);
        return nominatimFallback.map(loc => ({ ...loc, source: 'nominatim' }));
      } catch (nominatimError) {
        // Re-throw abort errors
        if (nominatimError instanceof Error && nominatimError.name === 'AbortError') {
          throw nominatimError;
        }
        logger.error('All search methods failed:', nominatimError);
        return [];
      }
    }
  }
  
  /**
   * Fast database search with timeout
   * @param signal Optional AbortSignal to cancel the request
   */
  private async searchDatabase(
    query: string, 
    language: string = 'en',
    signal?: AbortSignal
  ): Promise<LocationSuggestion[]> {
    try {
      logger.debug(`📊 Fast database search for "${query}" (language: ${language})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // Reduced to 1.5 seconds
      
      // Use passed signal if available, otherwise use timeout controller
      const requestSignal = signal || controller.signal;
      
      const response = await api.get('/api/v1/bus-schedules/locations/autocomplete', {
        params: { q: query.trim(), language: language },
        signal: requestSignal
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
        throw error; // Re-throw abort errors for proper handling
      } else {
        logger.warn(`Database search error: ${error instanceof Error ? error.message : String(error)} - using Nominatim fallback`);
      }
      return [];
    }
  }
  
  /**
   * Fast Nominatim search with minimal delays and single query
   * Returns both English and Tamil names when available
   * @param signal Optional AbortSignal to cancel the request
   */
  private async searchNominatimFast(
    query: string, 
    limit: number, 
    language: string = 'en',
    signal?: AbortSignal
  ): Promise<LocationSuggestion[]> {
    try {
      logger.debug(`🌍 Fast Nominatim search for "${query}" (language: ${language})`);
      
      // Use a single, optimized query instead of multiple attempts
      const searchQuery = `${query}, Tamil Nadu, India`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      // Use passed signal if available, otherwise use timeout controller
      const requestSignal = signal || controller.signal;
      
      // Map language code to Nominatim accept-language format
      // When Tamil, request Tamil first so 'name' field returns Tamil
      const acceptLanguage = language === 'ta' ? 'ta,en' : 'en,ta';
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
          q: searchQuery,
          format: 'json',
          countrycodes: 'in',
          limit: String(Math.min(limit, 5)), // Reduced limit for speed
          addressdetails: '1',
          namedetails: '1', // Get all language variants including name:ta
          'accept-language': acceptLanguage
        }),
        {
          headers: { 
            'User-Agent': 'Perundhu Bus App (https://perundhu.com)',
            'Accept-Language': acceptLanguage
          },
          signal: requestSignal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        logger.warn(`Nominatim error: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      logger.debug(`🌍 Nominatim returned ${data.length} results`);
      
      // Extended interface for Nominatim results with namedetails
      interface NominatimResult {
        type: string;
        addresstype: string;
        class: string;
        address?: { state_district?: string };
        display_name: string;
        lat: string;
        lon: string;
        name?: string;
        namedetails?: {
          name?: string;
          'name:ta'?: string;
          'name:en'?: string;
          [key: string]: string | undefined;
        };
      }
      
      // Filter for valid places including bus stations and bus stops
      const validResults = data.filter((result: NominatimResult) => {
        // Accept bus stations and bus stops with high priority
        const isBusStationOrStop = result.type === 'bus_station' || 
                                    result.type === 'bus_stop' ||
                                    (result.class === 'amenity' && 
                                     (result.type === 'bus_station' || 
                                      result.type === 'bus_stop' ||
                                      result.type?.includes('bus')));
        
        // Accept various place types (cities, towns, villages, etc.)
        const isValidPlace = (
          ['city', 'town', 'village', 'hamlet'].includes(result.type) ||
          ['city', 'town', 'village', 'state_district', 'county'].includes(result.addresstype) ||
          (result.class === 'boundary' && result.type === 'administrative' && result.address?.state_district)
        );
        
        // Exclude only pure roads/streets/highways that are NOT bus-related
        const isNotRoad = !(
          (result.class === 'highway' && !result.type?.includes('bus')) ||
          result.class === 'landuse' ||
          (result.type?.includes('road') && !result.type?.includes('bus')) || 
          (result.type?.includes('street') && !result.type?.includes('bus')) ||
          result.type === 'industrial'
        );
        
        return (isBusStationOrStop || isValidPlace) && isNotRoad;
      });
      
      // Sort results: bus stations/stops first, then cities/towns, then other places
      const sortedResults = validResults.sort((a: NominatimResult, b: NominatimResult) => {
        const aIsBusStationOrStop = a.type === 'bus_station' || a.type === 'bus_stop' || a.type?.includes('bus');
        const bIsBusStationOrStop = b.type === 'bus_station' || b.type === 'bus_stop' || b.type?.includes('bus');
        
        const aIsCity = ['city', 'town', 'village'].includes(a.type);
        const bIsCity = ['city', 'town', 'village'].includes(b.type);
        
        // Priority 1: Bus stations/stops
        if (aIsBusStationOrStop && !bIsBusStationOrStop) return -1;
        if (!aIsBusStationOrStop && bIsBusStationOrStop) return 1;
        
        // Priority 2: Cities/towns/villages
        if (aIsCity && !bIsCity) return -1;
        if (!aIsCity && bIsCity) return 1;
        
        return 0;
      });
      
      logger.debug(`🌍 Filtered to ${sortedResults.length} results (bus stations prioritized)`);
      
      return sortedResults.map((result: NominatimResult) => {
        // Extract English name: prefer namedetails['name:en'] or _place_name, fallback to name
        const englishName = result.namedetails?.['name:en'] || 
                           result.namedetails?.['_place_name'] ||
                           result.name || 
                           this.formatLocationNameSimple(result.display_name);
        
        // Extract Tamil name: prefer namedetails['name:ta'], or if accept-language was 'ta', use name
        const tamilName = result.namedetails?.['name:ta'] || 
                         (language === 'ta' && result.name ? result.name : undefined);
        
        // When language is Tamil, swap names so translatedName shows Tamil
        const displayName = language === 'ta' ? (tamilName || englishName) : englishName;
        const translatedDisplayName = language === 'ta' ? englishName : tamilName;
        
        logger.debug(`🌍 Location: ${englishName} -> Tamil: ${tamilName || 'N/A'}`);
        
        return {
          id: -(Math.random() * 1000000), // Unique negative ID
          name: displayName,
          translatedName: translatedDisplayName,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          source: 'nominatim'
        };
      });
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // Re-throw abort errors for proper handling
      } else {
        logger.error('Nominatim search error:', error);
      }
      return [];
    }
  }

  /**
   * Remove duplicate locations based on exact name match only
   * Keep bus stand variants (e.g., "Sivakasi - Bus Stop") separate from generic locations (e.g., "Sivakasi")
   */
  /**
   * Deduplicate location results using intelligent matching
   * Handles exact duplicates and similar base locations
   * Normalizes names to handle "Besant Nagar MTC Terminus" vs "Besant Nagar" variants
   */
  private deduplicateResults(locations: LocationSuggestion[]): LocationSuggestion[] {
    // Import normalization function for better matching
    const normalizeForDedup = (name: string): string => {
      return name
        .toLowerCase()
        .replace(/\s*-\s*(MTC|TNSTC|CMBT|DTC|SETC|KSRTC|KSDC)\s+(Terminus|Stand|Station|Bus Stand|Bus Terminus|Bus Station)?/gi, '')
        .replace(/\s+(MTC|TNSTC)\s+(Terminus|Stand|Station)?$/gi, '')
        .replace(/\s+(Bus\s+(Stand|Stop|Station|Terminus))$/gi, '')
        .replace(/\s*\([^)]*\)$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const filtered: LocationSuggestion[] = [];
    const seen = new Set<string>();
    const baseLocationMap = new Map<string, LocationSuggestion>(); // Track base locations
    
    for (const location of locations) {
      const nameLower = location.name.toLowerCase();
      const normalizedName = normalizeForDedup(location.name);
      
      // Skip if exact duplicate or normalized duplicate
      if (seen.has(nameLower) || seen.has(normalizedName)) {
        logger.debug(`⚠️ Skipping duplicate: "${location.name}" (normalized: "${normalizedName}")`);
        continue;
      }
      
      // Normalize the name for comparison (remove spaces, hyphens, special chars)
      const comparisonName = normalizedName
        .replace(/[-\s()]/g, '')
        .replace(/bus\s*(stop|stand|station|terminus)/gi, '');
      
      // Extract base location name (before " - " separator)
      // E.g., "Chennai - CMBT (Koyambedu)" -> "chennai"
      // E.g., "CHENNAI-KILAMBAKKAM-KCBT - CHENNAI KALAIGNAR CBT" -> "chennaikilambakkamkcbt"
      const baseName = normalizedName.split(' - ')[0].trim().replace(/[-\s()]/g, '');
      
      // Check if this is a simple location name (no suffix/description)
      const isSimpleName = !normalizedName.includes(' - ') && 
                          !normalizedName.includes('(') && 
                          !normalizedName.match(/bus\s*(stop|stand|station)/i);
      
      // If simple name, check against base names of detailed entries
      if (isSimpleName) {
        // Check if we already have a detailed version of this location
        const existingDetailed = baseLocationMap.get(comparisonName);
        if (existingDetailed) {
          logger.debug(`⚠️ Skipping simple name "${location.name}" - already have detailed "${existingDetailed.name}"`);
          continue;
        }
        
        // Mark this simple name as seen
        baseLocationMap.set(comparisonName, location);
      } else {
        // For detailed names, check if we already have this base location
        const existingSimple = baseLocationMap.get(baseName);
        if (existingSimple && !existingSimple.name.includes(' - ')) {
          // Replace simple name with detailed one
          const index = filtered.indexOf(existingSimple);
          if (index !== -1) {
            filtered[index] = location;
            logger.debug(`✅ Replacing simple "${existingSimple.name}" with detailed "${location.name}"`);
          }
          baseLocationMap.set(baseName, location);
          seen.add(nameLower);
          seen.add(normalizedName);
          continue;
        }
        
        // Update base location map with this detailed entry
        if (!baseLocationMap.has(baseName)) {
          baseLocationMap.set(baseName, location);
        }
      }
      
      seen.add(nameLower);
      seen.add(normalizedName);
      filtered.push(location);
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

    // Check minimum query length immediately without waiting for debounce
    if (query.trim().length < 2) {
      logger.debug(`⏭️ Query too short (${query.length} chars) - skipping API call`);
      callback([]); // Immediately return empty results
      return;
    }

    logger.debug(`🔄 Debounced search queued for "${query}" (${query.length} chars)`);

    // Use faster debounce delays for better UX
    const delay = query.length <= 3 ? 
      LocationAutocompleteService.INSTANT_DEBOUNCE : 
      LocationAutocompleteService.DEBOUNCE_DELAY;

    this.debounceTimeout = setTimeout(async () => {
      try {
        logger.debug(`📡 Executing debounced search for "${query}" after ${delay}ms delay`);
        const suggestions = await this.getLocationSuggestions(query, language);
        logger.debug(`✅ Debounced search returned ${suggestions.length} suggestions`);
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
   * Search for neighborhoods and localities within a city
   * This uses the backend endpoint that queries OSM Nominatim API for neighborhood data
   * @param query Neighborhood name (e.g., "Adyar", "Besant Nagar")
   * @param city Optional city name to narrow the search
   * @param language Language code for results
   * @returns Promise with neighborhood suggestions
   */
  async searchNeighborhoods(
    query: string,
    city?: string,
    language: string = 'en'
  ): Promise<LocationSuggestion[]> {
    if (query.length < 2) {
      return [];
    }

    try {
      logger.debug(`🏘️ Neighborhood search for "${query}" in city "${city || 'any'}" (language: ${language})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const searchParams = new URLSearchParams({
        q: query.trim(),
        language: language
      });

      if (city) {
        searchParams.append('city', city.trim());
      }

      const response = await api.get(`/api/v1/locations/neighborhoods?${searchParams}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const results = response.data || [];
      logger.debug(`🏘️ Found ${results.length} neighborhoods for "${query}"`);

      // Convert to LocationSuggestion format
      return results.map((location: LocationDTO) => ({
        id: location.id || -(Math.random() * 1000000),
        name: location.name,
        translatedName: location.translatedName,
        latitude: location.latitude,
        longitude: location.longitude,
        source: 'nominatim-neighborhoods'
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn(`Neighborhood search timed out for "${query}"`);
      } else {
        logger.error(`Error searching neighborhoods for "${query}":`, error);
      }
      return [];
    }
  }

  /**
   * Search locations comprehensively (database + neighborhoods)
   * Combines both database locations and OSM neighborhood results for better coverage
   * @param query Search query
   * @param language Language code
   * @returns Promise with all matching locations and neighborhoods
   */
  async searchComprehensive(
    query: string,
    language: string = 'en'
  ): Promise<LocationSuggestion[]> {
    if (query.length < 2) {
      return [];
    }

    try {
      logger.debug(`🔍 Comprehensive search for "${query}" (language: ${language})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await api.get(
        `/api/v1/locations/search-comprehensive?q=${encodeURIComponent(query.trim())}&language=${language}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const results = response.data || [];
      logger.debug(`🔍 Comprehensive search found ${results.length} results for "${query}"`);

      // Convert to LocationSuggestion format, preserving both database and OSM results
      return results.map((location: LocationDTO) => ({
        id: location.id || -(Math.random() * 1000000),
        name: location.name,
        translatedName: location.translatedName,
        latitude: location.latitude,
        longitude: location.longitude,
        source: location.source || 'mixed'
      }));
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn(`Comprehensive search timed out for "${query}"`);
      } else {
        logger.error(`Error in comprehensive search for "${query}":`, error);
      }
      return [];
    }
  }

  /**
   * Clear any pending debounced requests and abort in-flight requests
   */
  clearDebounce(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    
    // Also abort any in-flight request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
      logger.debug('🚫 Cleared debounce and aborted in-flight request');
    }
  }

  /**
   * Get grouped location suggestions with variants (cities, bus stands, neighborhoods)
   * Better UX for locations with multiple variants like "Salem", "Salem - New Bus Stand", etc.
   * @param query The search query
   * @param language The language code
   * @returns Promise with grouped location suggestions
   */
  async getGroupedLocationSuggestions(
    query: string,
    language: string = 'en'
  ): Promise<LocationGroupDTO[]> {
    if (query.length < 3) {
      return [];
    }

    try {
      logger.debug(`🚀 Grouped autocomplete: Searching for "${query}" (${query.length} chars) in ${language}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await api.get(
        `/api/v1/locations/autocomplete-grouped?q=${encodeURIComponent(query.trim())}&language=${language}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      const groups = response.data || [];
      
      logger.debug(`🎯 Grouped search found ${groups.length} groups for "${query}"`);
      return groups;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('Grouped location search timed out');
      } else {
        logger.error('Grouped location search error:', error);
      }
      return [];
    }
  }

  /**
   * Get debounced grouped suggestions
   * @param query The search query
   * @param callback Callback function to handle results
   * @param language The language code
   */
  getDebouncedGroupedSuggestions(
    query: string,
    callback: (suggestions: LocationGroupDTO[]) => void,
    language: string = 'en'
  ): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    if (query.trim().length < 3) {
      logger.debug(`⏭️ Query too short (${query.length} chars) - skipping grouped search`);
      callback([]);
      return;
    }

    logger.debug(`🔄 Debounced grouped search queued for "${query}" (${query.length} chars)`);

    const delay = query.length <= 3 ? 
      LocationAutocompleteService.INSTANT_DEBOUNCE : 
      LocationAutocompleteService.DEBOUNCE_DELAY;

    this.debounceTimeout = setTimeout(async () => {
      try {
        logger.debug(`📡 Executing debounced grouped search for "${query}" after ${delay}ms delay`);
        const suggestions = await this.getGroupedLocationSuggestions(query, language);
        logger.debug(`✅ Debounced grouped search returned ${suggestions.length} groups`);
        
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => callback(suggestions));
        } else {
          callback(suggestions);
        }
      } catch (error) {
        logger.error(`❌ Error in debounced grouped search for "${query}":`, error);
        callback([]);
      }
    }, delay);
  }
}

// Export singleton instance
export const locationAutocompleteService = new LocationAutocompleteService();