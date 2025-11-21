import { api } from './api';
import { GeocodingService } from './geocodingService';

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
      console.log(`🚀 FastAutocomplete: Searching for "${query}" (${query.length} chars)`);
      
      // Use fast parallel search for better performance
      const locations = await this.searchDatabaseAndNominatimParallel(query, 10);
      
      if (!locations || !Array.isArray(locations)) {
        console.error(`❌ Invalid locations result:`, locations);
        return [];
      }
      
      const suggestions = this.convertToSuggestions(locations);
      console.log(`✅ Converted to ${suggestions.length} suggestions in fast mode`);
      
      return suggestions;
      
    } catch (error) {
      console.error('Error in fast autocomplete:', error);
      
      // Fallback to instant suggestions
      const instantResults = GeocodingService.getInstantSuggestions(query, 10);
      console.log(`🔄 Fallback instant results for "${query}":`, instantResults.map(r => r.name));
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

        return (response.data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          translatedName: item.translatedName,
          latitude: item.latitude,
          longitude: item.longitude,
          source: 'database'
        }));
      } catch (fallbackError) {
        console.error('All autocomplete methods failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Database-first search: prioritize database, only use Nominatim if DB returns no results
   * This prevents unnecessary Nominatim API calls when we have data in the database
   */
  private async searchDatabaseAndNominatimParallel(query: string, limit: number): Promise<any[]> {
    console.log(`🚀 Starting database-first search for "${query}"`);
    
    try {
      // Try database first
      const databaseResults = await this.searchDatabase(query);
      
      console.log(`📊 Database results: ${databaseResults.length}`);
      
      // If database has results, use them and skip Nominatim
      if (databaseResults.length > 0) {
        console.log(`✅ Using database results (${databaseResults.length}) - skipping Nominatim`);
        return databaseResults.map(loc => ({ ...loc, source: 'database' }));
      }
      
      // Only call Nominatim if database is empty
      console.log(`⚠️ Database empty, falling back to Nominatim for "${query}"`);
      const nominatimResults = await this.searchNominatimFast(query, limit);
      
      if (nominatimResults.length > 0) {
        console.log(`🌍 Using Nominatim results (${nominatimResults.length})`);
        return nominatimResults.map(loc => ({ ...loc, source: 'nominatim' }));
      }
      
      console.log(`❌ No results found from database or Nominatim`);
      return [];
      
    } catch (error) {
      console.error('Database-first search failed:', error);
      // Fallback to Nominatim only if database completely fails
      try {
        console.log(`🔄 Fallback: Trying Nominatim only for "${query}"`);
        const nominatimFallback = await this.searchNominatimFast(query, limit);
        return nominatimFallback.map(loc => ({ ...loc, source: 'nominatim' }));
      } catch (nominatimError) {
        console.error('Nominatim fallback also failed:', nominatimError);
        return [];
      }
    }
  }
  
  /**
   * Fast database search with timeout
   */
  private async searchDatabase(query: string): Promise<any[]> {
    try {
      console.log(`📊 Fast database search for "${query}"`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // Reduced to 1.5 seconds
      
      const response = await api.get('/api/v1/bus-schedules/locations/autocomplete', {
        params: { q: query.trim(), language: 'en' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const results = response.data || [];
      console.log(`📊 Database returned ${results.length} results`);
      
      if (results.length === 0) {
        console.log(`⚠️ Database empty for "${query}" - this is expected during development`);
      }
      
      return results;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Database search timed out - using Nominatim fallback');
      } else {
        console.warn('Database search error:', error, '- using Nominatim fallback');
      }
      return [];
    }
  }
  
  /**
   * Fast Nominatim search with minimal delays and single query
   */
  private async searchNominatimFast(query: string, limit: number): Promise<any[]> {
    try {
      console.log(`🌍 Fast Nominatim search for "${query}"`);
      
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
        console.warn(`Nominatim error: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`🌍 Nominatim returned ${data.length} results`);
      
      // Quick filtering for cities/towns only
      const cityResults = data.filter((result: any) => {
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
        
        return isValidPlace && isNotRoad;
      });
      
      console.log(`🌍 Filtered to ${cityResults.length} city results`);
      
      return cityResults.map((result: any) => ({
        id: -(Math.random() * 1000000), // Unique negative ID
        name: this.formatLocationNameSimple(result.display_name),
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        source: 'nominatim'
      }));
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Nominatim search timed out');
      } else {
        console.error('Nominatim search error:', error);
      }
      return [];
    }
  }

  /**
   * Remove duplicate locations based on name similarity
   */
  private deduplicateResults(locations: any[]): any[] {
    const filtered: any[] = [];
    
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
   * Convert Location objects to LocationSuggestion format
   */
  private convertToSuggestions(locations: any[]): LocationSuggestion[] {
    return locations.map(location => ({
      id: location.id,
      name: location.name,
      translatedName: location.translatedName || location.taName,
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
        console.error(`❌ Error in debounced search for "${query}":`, error);
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