import { logger } from '../utils/logger';
import type { Location } from '../types';
import { getLocationsOffline } from './offlineService';
import { searchLocationsWithGeocoding } from './geocodingService';

/**
 * Search for locations by name using the autocomplete endpoint
 * This endpoint searches the database first (3+ characters), then falls back to geocoding APIs
 */
export const searchLocations = async (query: string, limit: number = 10, localLocations?: Location[]): Promise<Location[]> => {
  logger.debug(`searchLocations called with query: "${query}", limit: ${limit}`);
  
  // If query is short and we have local locations, filter locally first
  if (query.length <= 2 && localLocations && localLocations.length > 0) {
    const filtered = localLocations
      .filter((location: Location) => location.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit)
      .map((loc: Location) => ({ ...loc, source: 'local' as const })) as unknown as Location[];
    
    logger.debug(`Short query "${query}" - using local filtering, found ${filtered.length} results`);
    return filtered;
  }

  try {
    logger.debug('Making API call to autocomplete endpoint');
    
    // Use the new hybrid geocoding service that combines database + Nominatim
    const results = await searchLocationsWithGeocoding(query, limit);
    
    logger.debug(`Hybrid search for "${query}" returned ${results.length} results`);
    return results;
    
  } catch (error) {
    logger.error('Hybrid search failed, falling back to offline locations:', error);
    
    // Final fallback to offline locations
    try {
      const offlineLocations = (await getLocationsOffline()) as Location[];
      const filtered = offlineLocations
        .filter((location) => location.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit)
        .map((loc) => ({ ...loc, source: 'offline' as const }));
      
      logger.debug(`Offline fallback for "${query}" returned ${filtered.length} results`);
      return filtered;
    } catch (offlineError) {
      logger.error('Offline fallback also failed:', offlineError);
      return [];
    }
  }
};