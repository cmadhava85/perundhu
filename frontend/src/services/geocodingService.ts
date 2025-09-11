import type { Location } from '../types';
import { api } from './api';

// Add caching interface
interface CacheEntry {
  results: Location[];
  timestamp: number;
}

/**
 * Hybrid geocoding service that uses database first, then external APIs
 * Enhanced to support all Indian cities with improved city name formatting
 */
export class GeocodingService {
  private static readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
  private static readonly REQUEST_DELAY = 1100; // Nominatim rate limit: 1 req/sec
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  private static lastRequestTime = 0;
  
  // Add simple in-memory cache
  private static cache = new Map<string, CacheEntry>();
  
  // Enhanced list of Indian cities for instant suggestions (Tamil Nadu cities prioritized)
  private static readonly COMMON_CITIES = [
    // PRIORITY 1: Tamil Nadu Cities (Most Comprehensive)
    'Chennai', 'Madurai', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 
    'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 
    'Nagercoil', 'Kanchipuram', 'Erode', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam', 'Arcot', 
    'Dharmapuri', 'Chidambaram', 'Ambur', 'Nagapattinam', 'Arakkonam', 'Kumbakonam', 'Neyveli', 
    'Cuddalore', 'Mayiladuthurai', 'Pallavaram', 'Pudukkottai', 'Aruppukottai', 'Virudhunagar', 
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
   * Smart search that uses instant suggestions first, then API calls
   */
  static async smartSearch(query: string, limit: number = 10): Promise<Location[]> {
    console.log(`Smart search for: "${query}"`);
    
    // For short queries (1-2 chars), return instant suggestions only
    if (query.length <= 2) {
      return GeocodingService.getInstantSuggestions(query, limit);
    }
    
    // For 3+ chars, check cache first
    const cacheKey = `${query.toLowerCase().trim()}_${limit}`;
    const cached = GeocodingService.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < GeocodingService.CACHE_DURATION) {
      console.log(`Returning cached results for "${query}"`);
      return cached.results;
    }
    
    // Get instant suggestions first for immediate feedback
    const instantResults = GeocodingService.getInstantSuggestions(query, Math.min(3, limit));
    
    // Start API search in background for better results
    GeocodingService.searchInBackground(query, limit, cacheKey);
    
    return instantResults;
  }
  
  /**
   * Background API search with optimized caching
   */
  private static async searchInBackground(query: string, limit: number, cacheKey: string): Promise<void> {
    try {
      let databaseResults: Location[] = [];
      
      // Try database first
      try {
        const response = await api.get('/api/v1/bus-schedules/locations/autocomplete', {
          params: {
            q: query.trim(),
            language: 'en'
          }
        });
        
        databaseResults = response.data || [];
        console.log(`Background: Database returned ${databaseResults.length} results for "${query}"`);
        
        // If we have good database results, cache and return
        if (databaseResults.length >= Math.min(limit, 5)) {
          const results = databaseResults.slice(0, limit).map(loc => ({ ...loc, source: 'database' as const }));
          GeocodingService.cache.set(cacheKey, { results, timestamp: Date.now() });
          return;
        }
      } catch (error) {
        console.error('Background database search failed:', error);
      }
      
      // Only use external API if database results are insufficient
      if (databaseResults.length < 3) {
        const nominatimResults = await GeocodingService.searchNominatimOptimized(query, Math.max(3, limit - databaseResults.length));
        const googleResults = await GeocodingService.searchGooglePlaces(query, Math.max(3, limit - databaseResults.length));

        const combinedResults = [
          ...databaseResults.map(loc => ({ ...loc, source: 'database' as const })),
          ...nominatimResults.map(loc => ({ ...loc, source: 'nominatim' as const })),
          ...googleResults.map(loc => ({ ...loc, source: 'google' as const }))
        ];
        
        const finalResults = GeocodingService.deduplicateResults(combinedResults).slice(0, limit);
        GeocodingService.cache.set(cacheKey, { results: finalResults, timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Background search failed:', error);
    }
  }

  /**
   * Search locations using database first, then Nominatim fallback with caching
   */
  static async searchLocations(query: string, limit: number = 10): Promise<Location[]> {
    console.log(`Geocoding search for: "${query}"`);
    
    // Check cache first
    const cacheKey = `${query.toLowerCase().trim()}_${limit}`;
    const cached = GeocodingService.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < GeocodingService.CACHE_DURATION) {
      console.log(`Returning cached results for "${query}"`);
      return cached.results;
    }
    
    let databaseResults: Location[] = [];
    
    try {
      // 1. First try database (your existing implementation)
      const response = await api.get('/api/v1/bus-schedules/locations/autocomplete', {
        params: {
          q: query.trim(),
          language: 'en'
        }
      });
      
      databaseResults = response.data || [];
      console.log(`Database returned ${databaseResults.length} results for "${query}"`);
      
      // If database has enough results, return early to improve performance
      if (databaseResults.length >= limit) {
        const results = databaseResults.slice(0, limit).map(loc => ({ ...loc, source: 'database' as const }));
        GeocodingService.cache.set(cacheKey, { results, timestamp: Date.now() });
        return results;
      }
      
    } catch (error) {
      console.error('Database search failed:', error);
      // Continue with empty database results, will fallback to Nominatim
    }
    
    // 2. Only use Nominatim if database results are insufficient
    let nominatimResults: Location[] = [];
    try {
      const nominatimLimit = Math.max(3, limit - databaseResults.length);
      console.log(`Fetching ${nominatimLimit} results from Nominatim for "${query}"`);
      
      // Use optimized Nominatim search
      nominatimResults = await GeocodingService.searchNominatimOptimized(query, nominatimLimit);
      console.log(`Nominatim returned ${nominatimResults.length} results for "${query}"`);
    } catch (error) {
      console.error('Nominatim search failed:', error);
    }

    // 3. Use Google Places API if other results are insufficient
    let googleResults: Location[] = [];
    try {
      const googleLimit = Math.max(3, limit - databaseResults.length - nominatimResults.length);
      console.log(`Fetching ${googleLimit} results from Google Places for "${query}"`);
      
      googleResults = await GeocodingService.searchGooglePlaces(query, googleLimit);
      console.log(`Google Places returned ${googleResults.length} results for "${query}"`);
    } catch (error) {
      console.error('Google Places search failed:', error);
    }
    
    // 4. Combine and deduplicate results
    const combinedResults = [
      ...databaseResults.map(loc => ({ ...loc, source: 'database' as const })),
      ...nominatimResults.map(loc => ({ ...loc, source: 'nominatim' as const })),
      ...googleResults.map(loc => ({ ...loc, source: 'google' as const }))
    ];
    
    if (combinedResults.length === 0) {
      console.log(`No results found for "${query}" in database, Nominatim, or Google Places`);
      return [];
    }
    
    const deduplicatedResults = GeocodingService.deduplicateResults(combinedResults);
    const finalResults = deduplicatedResults.slice(0, limit);
    
    // Cache the results
    GeocodingService.cache.set(cacheKey, { results: finalResults, timestamp: Date.now() });
    
    console.log(`Returning ${finalResults.length} deduplicated results for "${query}"`);
    return finalResults;
  }

  /**
   * Optimized Nominatim search with reduced API calls
   */
  public static async searchNominatimOptimized(query: string, limit: number): Promise<Location[]> {
    // Rate limiting: wait if last request was too recent
    const now = Date.now();
    const timeSinceLastRequest = now - GeocodingService.lastRequestTime;
    if (timeSinceLastRequest < GeocodingService.REQUEST_DELAY) {
      await new Promise(resolve => setTimeout(resolve, GeocodingService.REQUEST_DELAY - timeSinceLastRequest));
    }
    GeocodingService.lastRequestTime = Date.now();

    try {
      // Simplified search strategy - only try 2 queries max instead of 4+ 
      const searchQueries = [
        `${query}, Tamil Nadu, India`,  // Primary search
        `${query} city, Tamil Nadu, India`  // Backup search for cities
      ];

      let allResults: any[] = [];

      for (const searchQuery of searchQueries) {
        const params = new URLSearchParams({
          q: searchQuery,
          format: 'json',
          countrycodes: 'in',
          limit: String(Math.min(limit, 5)), // Reduce API response size
          addressdetails: '1',
          bounded: '1',
          viewbox: '76.0,8.0,80.5,13.5' // Tamil Nadu bounding box
        });

        const response = await fetch(`${GeocodingService.NOMINATIM_BASE_URL}/search?${params}`, {
          headers: {
            'User-Agent': 'Perundhu Bus App (https://perundhu.com)'
          }
        });

        if (!response.ok) {
          console.warn(`Nominatim query failed for "${searchQuery}": ${response.status}`);
          continue;
        }

        const data = await response.json();
        if (data.length > 0) {
          console.log(`Found ${data.length} results for "${searchQuery}"`);
          allResults = allResults.concat(data);
          
          // Stop early if we have enough good results
          if (allResults.length >= limit) {
            break;
          }
        }

        // Reduced delay between queries
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Filter and prioritize results (simplified)
      const filteredResults = allResults
        .filter(result => {
          const displayName = result.display_name.toLowerCase();
          return displayName.includes('india') || displayName.includes('tamil nadu');
        })
        .sort((a, b) => {
          // Simple priority scoring
          const getScore = (result: any) => {
            let score = 0;
            if (result.type === 'city' || result.addresstype === 'city') score += 100;
            if (result.type === 'town' || result.addresstype === 'town') score += 90;
            if (result.class === 'highway' || result.addresstype === 'road') score -= 50;
            score += (result.importance || 0) * 10;
            return score;
          };
          return getScore(b) - getScore(a);
        });

      return filteredResults.slice(0, limit).map((result, index) => ({
        id: -(index + 1),
        name: GeocodingService.formatLocationName(result.display_name),
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        source: 'nominatim' as const
      }));

    } catch (error) {
      console.error('Nominatim search failed:', error);
      return [];
    }
  }

  /**
   * Google Places API integration for enhanced location coverage
   */
  private static async searchGooglePlaces(query: string, limit: number): Promise<Location[]> {
    // Only use if Google Maps API key is available
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Places API key not configured');
      return [];
    }

    try {
      const params = new URLSearchParams({
        input: query,
        types: 'establishment|transit_station|bus_station',
        components: 'country:in|administrative_area:tamil nadu',
        key: apiKey
      });

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
      );

      if (!response.ok) return [];

      const data = await response.json();
      
      return data.predictions?.slice(0, limit).map((prediction: any, index: number) => ({
        id: -(2000 + index), // Unique negative ID for Google results
        name: GeocodingService.formatLocationNameUniversal(prediction.description),
        latitude: 0, // Would need Place Details API for coordinates
        longitude: 0,
        source: 'google' as const
      })) || [];

    } catch (error) {
      console.error('Google Places search failed:', error);
      return [];
    }
  }

  /**
   * Format Nominatim display name to prioritize town/city name first
   */
  private static formatLocationName(displayName: string): string {
    console.log(`Formatting Nominatim result: "${displayName}"`);
    
    // Split the display name by commas and clean up each part
    const parts = displayName.split(',').map(part => part.trim());
    
    // Remove common suffixes and prefixes that aren't the main location
    const cleanPart = (part: string): string => {
      return part
        .replace(/\b(bus stand|railway station|bus stop|junction|depot)\b/gi, '')
        .replace(/\b(new|old)\s+/gi, '')
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
        cityName = cleanedPart;
      } else if (!districtName && cleanedPart !== cityName) {
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
        !districtName.toLowerCase().includes(cityName.toLowerCase())) {
      formattedName = `${cityName}, ${districtName}`;
    }
    
    // Fallback to first part if we couldn't extract a good city name
    if (!formattedName) {
      formattedName = cleanPart(parts[0]) || parts[0];
    }
    
    console.log(`Formatted "${displayName}" -> "${formattedName}"`);
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

    console.log(`Formatting location name: "${name}"`);
    
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
    
    console.log(`Formatted "${name}" -> "${formattedName}"`);
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
    console.log('Geocoding cache cleared');
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

// Test function for Srivilliputhur geocoding - add this at the end of the file for debugging
export const testSrivilliputhurGeocoding = async (): Promise<void> => {
  console.log('🔍 Testing Srivilliputhur geocoding...');
  
  try {
    // Clear cache first to ensure fresh results
    GeocodingService.clearCache();
    
    // Test the search function
    const results = await GeocodingService.searchLocations('Srivilliputhur', 5);
    
    console.log(`✅ Found ${results.length} results for "Srivilliputhur":`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name} (${result.source}) - Lat: ${result.latitude}, Lng: ${result.longitude}`);
    });
    
    if (results.length === 0) {
      console.log('❌ No results found. Testing direct Nominatim call...');
      
      // Test direct Nominatim call
      const directResults = await GeocodingService.searchNominatimOptimized('Srivilliputhur', 3);
      console.log(`Direct Nominatim results: ${directResults.length}`);
      directResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.name} - Lat: ${result.latitude}, Lng: ${result.longitude}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Make test function available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testSrivilliputhurGeocoding = testSrivilliputhurGeocoding;
}