import type { Location } from '../types';
import { api } from './api';
import { logger, LogCategory } from '../utils/logger';

// Add caching interface
interface CacheEntry {
  results: Location[];
  timestamp: number;
}

/**
 * Database-only geocoding service with instant suggestions fallback
 * Simplified to remove external API dependencies (Overpass, Nominatim)
 */
export class GeocodingService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  
  // Add simple in-memory cache
  private static cache = new Map<string, CacheEntry>();
  
  // Enhanced list of Indian cities for instant suggestions (Tamil Nadu cities prioritized)
  private static readonly COMMON_CITIES = [
    // PRIORITY 0: Chennai Neighborhoods & Localities (For better UX)
    'Adyar', 'Besant Nagar', 'Velachery', 'Madipakkam', 'Perambur', 'Thiruvanmiyur', 
    'Mylapore', 'Teynampet', 'T. Nagar', 'Kodambakkam', 'Nungambakkam', 'Chetpet', 
    'Alwarpet', 'Mandaveli', 'Santhome', 'Tiruvanmiyur', 'Palavakkam', 'Kovalam',
    'Kannagi Nagar', 'Srinivasa Nagar', 'Medavakkam', 'Kottivakkam', 'Thiruvanmiyur',
    'Ramakrishnapuram', 'Virugambakkam', 'Kilpauk', 'Vepery', 'Chepauk', 'Royapettah',
    'Egmore', 'George Town', 'Purasavakkam', 'Chetpet', 'Nolambur', 'Mogappair',
    'Ambattur', 'Avadi', 'Vandalur', 'Padur', 'Thiruporur', 'Mahabalipuram',
    
    // PRIORITY 1: Tamil Nadu Cities (Most Comprehensive)
    'Chennai', 'Madurai', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 
    'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 
    'Nagercoil', 'Kanchipuram', 'Erode', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam', 'Arcot', 
    'Dharmapuri', 'Chidambaram', 'Ambur', 'Nagapattinam', 'Arakkonam', 'Kumbakonam', 'Neyveli', 
    'Cuddalore', 'Mayiladuthurai', 'Pallavaram', 'Pudukkottai', 'Aruppukottai', 'Aruppukkottai', 'Virudhunagar', 
    'Kodaikanal', 'Yercaud', 'Kanyakumari', 'Srivilliputhur', 'Ramanathapuram', 'Tenkasi', 
    'Theni', 'Palani', 'Krishnagiri', 'Namakkal', 'Tiruchirapalli', 'Villupuram', 'Vellore',
    'Tiruvallur', 'Kancheepuram', 'Thiruvallur', 'Tirupattur', 'Kallakurichi', 'Chengalpattu',
    'Thoothukudi', 'Tiruvarur', 'Perambalur', 'Ariyalur', 'Nilgiris', 'Thenkasi',
    
    // PRIORITY 2: Major Metro Cities (Other States)
    'Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad',
    
    // PRIORITY 3: Neighboring States (Karnataka, Kerala, Andhra Pradesh)
    'Mysore', 'Mangalore', 'Hubli', 'Belgaum', 'Davangere', 'Bellary', 'Bijapur', 'Shimoga',
    'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha',
    'Vijayawada', 'Visakhapatnam', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Kadapa',
    'Tirupati', 'Anantapur', 'Chittoor', 'Eluru', 'Ongole', 'Nizamabad', 'Karimnagar',
    'Warangal', 'Khammam', 'Mahbubnagar',
    
    // PRIORITY 4: Other Major Indian Cities
    'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar',
    'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Indore', 'Bhopal', 'Jabalpur',
    'Gwalior', 'Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad',
    'Patna', 'Gaya', 'Bhagalpur', 'Bhubaneswar', 'Cuttack', 'Rourkela', 'Chandigarh', 'Ludhiana',
    'Amritsar', 'Jalandhar', 'Dehradun', 'Haridwar', 'Ranchi', 'Jamshedpur', 'Dhanbad',
    'Raipur', 'Bhilai', 'Guwahati', 'Dibrugarh', 'Shillong', 'Imphal', 'Aizawl', 'Kohima',
    'Dimapur', 'Agartala', 'Gangtok'
  ];

  /**
   * Get instant city suggestions based on local filtering
   */
  static getInstantSuggestions(query: string, limit: number = 10): Location[] {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    const matches: Location[] = [];
    
    // Filter through common cities first
    GeocodingService.COMMON_CITIES.forEach((city, index) => {
      if (city.toLowerCase().includes(lowerQuery)) {
        matches.push({
          id: -(1000 + index), // Negative ID for instant suggestions
          name: city,
          latitude: 0, // Will be filled by subsequent API call if needed
          longitude: 0,
          source: 'local' as const
        });
      }
    });
    
    return matches.slice(0, limit);
  }

  /**
   * Get the list of common cities (for external use like validation)
   */
  static getCommonCities(): readonly string[] {
    return GeocodingService.COMMON_CITIES;
  }

  /**
   * Smart search that uses instant suggestions first, then API calls
   */
  static async smartSearch(query: string, limit: number = 10): Promise<Location[]> {
    // Smart search for query
    
    // For short queries (1-2 chars), return instant suggestions only
    if (query.length <= 2) {
      return GeocodingService.getInstantSuggestions(query, limit);
    }
    
    // For 3+ chars, check cache first
    const cacheKey = `${query.toLowerCase().trim()}_${limit}`;
    const cached = GeocodingService.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < GeocodingService.CACHE_DURATION) {
      logger.debug(`Returning cached results for "${query}"`);
      return cached.results;
    }
    
    // Get instant suggestions first for immediate feedback
    const instantResults = GeocodingService.getInstantSuggestions(query, Math.min(3, limit));
    
    // Start API search in background for better results
    GeocodingService.searchInBackground(query, limit, cacheKey);
    
    return instantResults;
  }
  
  /**
   * Background API search with optimized caching (database-only)
   */
  private static async searchInBackground(query: string, limit: number, cacheKey: string): Promise<void> {
    try {
      // Try database search
      const response = await api.get('/v1/bus-schedules/locations/autocomplete', {
        params: {
          q: query.trim(),
          language: 'en'
        }
      });
      
      const databaseResults = response.data || [];
      logger.debug(`Background: Database returned ${databaseResults.length} results for "${query}"`, { category: LogCategory.SEARCH });
      
      // Cache database results
      if (databaseResults.length > 0) {
        const results = databaseResults.slice(0, limit).map((loc: Location) => ({ ...loc, source: 'database' as const }));
        GeocodingService.cache.set(cacheKey, { results, timestamp: Date.now() });
      }
    } catch (error) {
      logger.error('Background database search failed', error, { category: LogCategory.SEARCH });
    }
  }

  /**
   * Search locations using database only (no external APIs)
   */
  static async searchLocations(query: string, limit: number = 10): Promise<Location[]> {
    // Check cache first
    const cacheKey = `${query.toLowerCase().trim()}_${limit}`;
    const cached = GeocodingService.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < GeocodingService.CACHE_DURATION) {
      logger.debug(`Returning cached results for "${query}"`);
      return cached.results;
    }
    
    try {
      // Search database
      const response = await api.get('/v1/bus-schedules/locations/autocomplete', {
        params: {
          q: query.trim(),
          language: 'en'
        }
      });
      
      const databaseResults = response.data || [];
      
      if (databaseResults.length > 0) {
        const results = databaseResults.slice(0, limit).map((loc: Location) => ({ ...loc, source: 'database' as const }));
        GeocodingService.cache.set(cacheKey, { results, timestamp: Date.now() });
        logger.debug(`Returning ${results.length} database results for "${query}"`, { category: LogCategory.SEARCH });
        return results;
      }
      
      logger.debug(`No results found for "${query}" in database`, { category: LogCategory.SEARCH });
      return [];
      
    } catch (error) {
      logger.error('Database search failed', error, { category: LogCategory.API });
      return [];
    }
  }

  /**
   * Generate query variations to handle spelling differences (e.g., Aruppukottai vs Aruppukkottai)
   */
  private static generateQueryVariations(query: string): string[] {
    const variations = [query];
    
    // Handle Aruppukottai spelling variations for partial matches
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.startsWith('arup')) {
      variations.push(
        'Aruppukottai',
        'Aruppukkottai',  // OpenStreetMap spelling with double 'k'
        query.replace(/arup/i, 'Arupp'),  // Add extra 'p'
        query + 'p',  // For "arup" -> "arupp"
        query + 'ukottai'  // For "arup" -> "arupukottai"
      );
    }
    
    return [...new Set(variations)]; // Remove duplicates
  }

  /**
   * Format Nominatim display name to prioritize town/city name first
   */
  private static formatLocationName(displayName: string): string {
    logger.debug(`Formatting Nominatim result: "${displayName}"`);
    
    // Split the display name by commas and clean up each part
    const parts = displayName.split(',').map(part => part.trim());
    
    // Remove common suffixes and prefixes that aren't the main location
    const cleanPart = (part: string): string => {
      return part
        .replace(/\b(bus stand|railway station|bus stop|junction|depot)\b/gi, '')
        .replace(/\b(new|old)\s+/gi, '')
        .trim();
    };
    
    // Normalize spelling variations
    const normalizeSpelling = (name: string): string => {
      return name
        .replace(/\bAruppukkottai\b/gi, 'Aruppukottai')  // OpenStreetMap -> Standard spelling
        .replace(/\bArupukkottai\b/gi, 'Aruppukottai')   // Other variations
        .trim();
    };
    
    // Find the main city/town name
    let cityName = '';
    let districtName = '';
    
    // Look for Tamil Nadu locations - the structure is usually:
    // [Landmark/Station], [City/Town], [District], [State], [Country]
    for (let i = 0; i < Math.min(parts.length, 4); i++) {
      const part = parts[i];
      const cleanedPart = cleanPart(part);
      
      // Skip empty parts after cleaning
      if (!cleanedPart) continue;
      
      // Skip if it's clearly a landmark/station (contains certain keywords)
      if (/(bus stand|railway station|bus stop|junction|depot|terminal)/i.test(part)) {
        continue;
      }
      
      // Skip state and country
      if (/(tamil nadu|india)/i.test(part)) {
        continue;
      }
      
      // The first meaningful part should be the city/town
      if (!cityName) {
        cityName = normalizeSpelling(cleanedPart);
      } else if (!districtName && cleanedPart !== cityName) {
        // Second meaningful part is likely the district
        districtName = normalizeSpelling(cleanedPart);
        break;
      }
    }
    
    // Format the result to show city first
    let formattedName = cityName;
    
    // Add district if it's different from city and adds value
    if (districtName && 
        districtName !== cityName && 
        !cityName.toLowerCase().includes(districtName.toLowerCase()) &&
        !districtName.toLowerCase().includes(cityName.toLowerCase())) {
      formattedName = `${cityName}, ${districtName}`;
    }
    
    // Fallback to first part if we couldn't extract a good city name
    if (!formattedName) {
      formattedName = normalizeSpelling(cleanPart(parts[0])) || parts[0];
    }
    
    logger.debug(`Formatted "${displayName}" -> "${formattedName}"`);
    return formattedName;
  }

  /**
   * Format any location name to prioritize city name first (universal formatter)
   * This ensures consistent display across all location sources
   */
  static formatLocationNameUniversal(name: string): string {
    if (!name || typeof name !== 'string') {
      return name || '';
    }

    logger.debug(`Formatting location name: "${name}"`);
    
    // If it's already a simple city name without commas, return as-is
    if (!name.includes(',')) {
      return name.trim();
    }
    
    // Split by comma and process each part
    const parts = name.split(',').map(part => part.trim());
    
    // Remove common suffixes and prefixes that aren't the main location
    const cleanPart = (part: string): string => {
      return part
        .replace(/\b(bus stand|railway station|bus stop|junction|depot|terminal|station)\b/gi, '')
        .replace(/\b(new|old)\s+/gi, '')
        .replace(/\b(district|taluk|block)\b$/gi, '') // Remove administrative suffixes
        .trim();
    };
    
    let cityName = '';
    let districtName = '';
    
    // Process parts to extract city and district
    for (let i = 0; i < Math.min(parts.length, 4); i++) {
      const part = parts[i];
      const cleanedPart = cleanPart(part);
      
      // Skip empty parts after cleaning
      if (!cleanedPart) continue;
      
      // Skip if it's clearly a landmark/station (contains certain keywords)
      if (/(bus stand|railway station|bus stop|junction|depot|terminal|station)/i.test(part)) {
        continue;
      }
      
      // Skip state, country, and postal codes
      if (/(tamil nadu|india|karnataka|kerala|andhra pradesh|\d{5,6})/i.test(part)) {
        continue;
      }
      
      // Skip very generic location terms
      if (/(road|street|area|sector|phase|extension)/i.test(part)) {
        continue;
      }
      
      // The first meaningful part should be the city/town
      if (!cityName) {
        cityName = cleanedPart;
      } else if (!districtName && cleanedPart !== cityName && cleanedPart.length > 2) {
        // Second meaningful part is likely the district
        districtName = cleanedPart;
        break;
      }
    }
    
    // Format the result to show city first
    let formattedName = cityName;
    
    // Add district if it's different from city and adds value
    if (districtName && 
        districtName !== cityName && 
        !cityName.toLowerCase().includes(districtName.toLowerCase()) &&
        !districtName.toLowerCase().includes(cityName.toLowerCase()) &&
        districtName.length > 2) {
      formattedName = `${cityName}, ${districtName}`;
    }
    
    // Fallback to first part if we couldn't extract a good city name
    if (!formattedName) {
      formattedName = cleanPart(parts[0]) || parts[0];
    }
    
    logger.debug(`Formatted "${name}" -> "${formattedName}"`);
    return formattedName;
  }

  /**
   * Remove duplicate locations based on name similarity and proximity
   */
  private static deduplicateResults(locations: Location[]): Location[] {
    const filtered: Location[] = [];
    
    for (const location of locations) {
      const isDuplicate = filtered.some(existing => {
        // Check name similarity
        const nameSimilar = GeocodingService.areNamesSimilar(location.name, existing.name);
        
        // Check geographic proximity (within 5km)
        const distanceKm = GeocodingService.calculateDistance(
          location.latitude, location.longitude,
          existing.latitude, existing.longitude
        );
        
        return nameSimilar || distanceKm < 5;
      });
      
      if (!isDuplicate) {
        filtered.push(location);
      }
    }
    
    return filtered;
  }

  /**
   * Check if two location names are similar
   */
  private static areNamesSimilar(name1: string, name2: string): boolean {
    const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const n1 = normalize(name1);
    const n2 = normalize(name2);
    
    // Exact match
    if (n1 === n2) return true;
    
    // One name contains the other
    if (n1.includes(n2) || n2.includes(n1)) return true;
    
    return false;
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
   * Clear cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    GeocodingService.cache.clear();
    logger.debug('Geocoding cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: GeocodingService.cache.size,
      keys: Array.from(GeocodingService.cache.keys())
    };
  }
}

// Export the main search function
export const searchLocationsWithGeocoding = GeocodingService.searchLocations;

// Export the universal location name formatter for consistent display
export const formatLocationNameUniversal = GeocodingService.formatLocationNameUniversal;

/**
 * Check if a location name is a known/recognized city
 * This helps reduce false "location not recognized" warnings
 */
export const isKnownLocation = (locationName: string): boolean => {
  if (!locationName || locationName.trim().length < 2) return false;
  
  const normalizedName = locationName.toLowerCase().trim();
  
  // Check against common cities list
  const isKnownCity = GeocodingService.getCommonCities().some(city => {
    const normalizedCity = city.toLowerCase();
    // Exact match or close match (handles variations like Aruppukottai/Aruppukkottai)
    return normalizedName === normalizedCity || 
           normalizedName.includes(normalizedCity) || 
           normalizedCity.includes(normalizedName);
  });
  
  if (isKnownCity) return true;
  
  // Also check for bus stand patterns that indicate known locations
  if (normalizedName.includes(' - ') || 
      normalizedName.includes('bus stand') || 
      normalizedName.includes('bus station')) {
    return true;
  }
  
  return false;
};