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
  private static readonly MIN_QUERY_LENGTH = 2; // Reduced from 3 to 2
  private static readonly DEBOUNCE_DELAY = 100; // Reduced from 200ms to 100ms
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
    // Return empty for very short queries
    if (query.length < LocationAutocompleteService.MIN_QUERY_LENGTH) {
      return [];
    }

    try {
      console.log(`FastAutocomplete: Searching for "${query}"`);
      
      // For short queries (2 chars), use instant suggestions only
      if (query.length === 2) {
        const instantResults = GeocodingService.getInstantSuggestions(query, 10);
        return this.convertToSuggestions(instantResults);
      }
      
      // For 3+ chars, use smart search (instant + background API)
      const locations = await GeocodingService.smartSearch(query, 10);
      return this.convertToSuggestions(locations);
      
    } catch (error) {
      console.error('Error in fast autocomplete:', error);
      
      // Fallback to instant suggestions
      const instantResults = GeocodingService.getInstantSuggestions(query, 10);
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
    language: string = 'en',
    callback: (suggestions: LocationSuggestion[]) => void
  ): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Use different debounce delays based on query length
    const delay = query.length <= 2 ? 
      LocationAutocompleteService.INSTANT_DEBOUNCE : 
      LocationAutocompleteService.DEBOUNCE_DELAY;

    this.debounceTimeout = setTimeout(async () => {
      const suggestions = await this.getLocationSuggestions(query, language);
      callback(suggestions);
    }, delay);
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