import { api } from './api';
import type { Location } from '../types/index';
import { getLocationsOffline } from './offlineService';
import i18n from '../i18n';

/**
 * Fetch all available locations from the database
 * Used for populating location dropdowns
 */
export const getAllLocations = async (): Promise<Location[]> => {
  try {
    // Using the existing API endpoint from api.ts that retrieves all locations
    const response = await api.get('/api/v1/bus-schedules/locations');
    return response.data;
  } catch (error) {
    console.error('Error fetching all locations:', error);
    
    // Fall back to offline locations
    try {
      const offlineLocations = await getLocationsOffline();
      return offlineLocations || [];
    } catch (offlineError) {
      console.error('Error getting offline locations:', offlineError);
      return [];
    }
  }
};

/**
 * Filter locations locally based on a query string
 */
export const filterLocations = (locations: Location[], query: string, limit = 10): Location[] => {
  if (!query) return locations.slice(0, limit);
  
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Add weights to results for better sorting
  const weightedResults = locations.map(location => {
    const name = location.name?.toLowerCase() || '';
    const translatedName = location.translatedName?.toLowerCase() || '';
    let weight = 0;
    
    // Exact match is highest priority
    if (name === lowercaseQuery || translatedName === lowercaseQuery) {
      weight = 100;
    }
    // Starts with query is high priority
    else if (name.startsWith(lowercaseQuery) || translatedName.startsWith(lowercaseQuery)) {
      weight = 75;
    }
    // Contains query is medium priority
    else if (name.includes(lowercaseQuery) || translatedName.includes(lowercaseQuery)) {
      weight = 50;
    }
    // No match
    else {
      weight = 0;
    }
    
    return { location, weight };
  });
  
  // Filter out non-matches and sort by weight
  return weightedResults
    .filter(item => item.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .map(item => item.location)
    .slice(0, limit);
};

/**
 * Search for locations using a combination of API and local filtering
 */
export const searchLocations = async (
  query: string, 
  limit = 10, 
  localLocations: Location[] = []
): Promise<Location[]> => {
  // For very short queries, just filter locally for performance
  if (query.length < 2 && localLocations.length > 0) {
    return filterLocations(localLocations, query, limit).map(location => ({
      ...location,
      source: 'local'
    }));
  }

  // Get the current language from i18n
  const currentLanguage = i18n.language || 'en';
  console.log(`Searching with language: ${currentLanguage}`);

  try {
    // First search in database
    console.log(`Searching for "${query}" in database`);
    const dbResponse = await api.get('/api/v1/locations/search', {
      params: { 
        query, 
        limit,
        source: 'database', // Explicitly request database search first
        language: currentLanguage // Send the current language preference
      }
    });

    // Ensure database results have source property
    const dbResults = Array.isArray(dbResponse.data) ? 
      dbResponse.data.map(location => ({
        ...location,
        source: 'database'
      })) : [];
    
    console.log(`Found ${dbResults.length} database results for "${query}"`);
    
    // If we have enough results from DB, return them
    if (dbResults.length >= limit) {
      return dbResults;
    }
    
    // If database has insufficient results, check map API
    try {
      console.log(`Not enough database results, trying map API for "${query}" with language: ${currentLanguage}`);
      const mapResponse = await api.get('/api/v1/locations/search', {
        params: { 
          query,
          limit: limit - dbResults.length, // Only get what we still need
          source: 'map', // Explicitly request map API search
          language: currentLanguage // Send the current language preference
        }
      });
      
      // Ensure map results have all necessary properties and are properly marked as API results
      let mapResults = Array.isArray(mapResponse.data) ? mapResponse.data : [];
      console.log(`Found ${mapResults.length} map API results for "${query}"`);
      
      mapResults = mapResults.map(location => ({
        ...location,
        // Ensure map results have properly formatted names
        name: location.name || (location.display_name ? location.display_name.split(',')[0] : 'Unknown'),
        // If no ID is provided from the map API, generate one to distinguish it
        id: location.id || `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        // Add source property for better identification
        source: 'map'
      }));
      
      // Combine results, preserving source properties
      const combinedResults = [...dbResults, ...mapResults].slice(0, limit);
      return combinedResults;
    } catch (mapError) {
      console.warn('Map API search failed, returning database results only:', mapError);
      return dbResults;
    }
  } catch (error) {
    console.error('Error searching locations:', error);
    
    // First try offline locations as fallback
    try {
      const offlineLocations = await getLocationsOffline();
      if (offlineLocations && offlineLocations.length > 0) {
        const offlineResults = offlineLocations.filter(location => 
          location.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, limit).map(location => ({
          ...location,
          source: 'offline' as const // Use 'as const' to constrain the string type
        }));
        console.log(`Using ${offlineResults.length} offline results for "${query}"`);
        return offlineResults;
      }
    } catch (offlineError) {
      console.error('Error getting offline locations:', offlineError);
    }
    
    // Use local results if API and offline both failed
    console.log(`Using ${localLocations.length} local results for "${query}" after API failure`);
    return filterLocations(localLocations, query, limit)
      .map(location => ({
        ...location,
        source: 'local'
      }));
  }
};

/**
 * Validate a location name or coordinates to ensure it represents a real place
 * Uses the API if available, with fallbacks for offline operation
 */
export const validateLocation = async (
  locationName: string,
  latitude?: number,
  longitude?: number
): Promise<boolean> => {
  if (!locationName && !latitude && !longitude) {
    return false;
  }
  
  try {
    // Try to validate through the API first
    const response = await api.post('/api/v1/locations/validate', {
      name: locationName,
      latitude: latitude,
      longitude: longitude
    });
    
    return response.data.valid;
  } catch (error) {
    console.error('Error validating location:', error);
    
    // If API fails, check offline locations as a fallback
    try {
      const offlineLocations = await getLocationsOffline();
      if (offlineLocations && offlineLocations.length > 0) {
        // Try to find the location by name in offline data
        const normalizedName = locationName.toLowerCase().trim();
        return offlineLocations.some(loc => 
          loc.name.toLowerCase().trim() === normalizedName
        );
      }
    } catch (offlineError) {
      console.error('Error checking offline locations:', offlineError);
    }
    
    // If all validation methods fail, be lenient and return true
    // This allows users to enter new locations that may not be in our database yet
    return true;
  }
};