import { api } from './api';

interface Location {
  id: number;
  name: string;
  translatedName?: string;
  taName?: string;
  latitude: number;
  longitude: number;
  source?: string;
}

interface CacheEntry {
  results: Location[];
  timestamp: number;
}

export class GeocodingService {
  private static readonly NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
  private static readonly REQUEST_DELAY = 1000; // 1 second between Nominatim requests
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  private static lastRequestTime = 0;
  
  // Use better cache management
  private static cache = new Map<string, CacheEntry>();
  private static activeRequests = new Map<string, Promise<Location[]>>();
  
  // Common Tamil Nadu cities for instant suggestions
  private static readonly COMMON_CITIES = [
    'Chennai', 'Madurai', 'Coimbatore', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur',
    'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur',
    'Nagercoil', 'Kanchipuram', 'Erode', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam',
    'Arcot', 'Dharmapuri', 'Chidambaram', 'Ambur', 'Nagapattinam', 'Arakkonam', 'Kumbakonam', 'Neyveli', 
    'Cuddalore', 'Mayiladuthurai', 'Pallavaram', 'Pudukkottai', 'Aruppukottai',
    'Virudhunagar', 'Kodaikanal', 'Yercaud', 'Kanyakumari', 'Srivilliputhur', 'Ramanathapuram',
    'Tenkasi', 'Theni', 'Palani', 'Krishnagiri', 'Namakkal', 'Villupuram', 'Vellore',
    'Tiruvallur', 'Tirupattur', 'Kallakurichi', 'Chengalpattu', 'Thoothukudi', 'Tiruvarur',
    'Perambalur', 'Ariyalur', 'Nilgiris', 'Thenkasi'
  ];

  /**
   * Get instant city suggestions based on local filtering (no API calls)
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
   * Smart search that uses instant suggestions first, then API calls with deduplication
   */
  static async smartSearch(query: string, limit: number = 10): Promise<Location[]> {
    console.log(`Smart search for: "${query}"`);
    
    // For very short queries, return instant suggestions only
    if (query.length <= 2) {
      return GeocodingService.getInstantSuggestions(query, limit);
    }
    
    // Check cache first
    const cacheKey = `smart_${query.toLowerCase().trim()}_${limit}`;
    const cached = GeocodingService.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < GeocodingService.CACHE_DURATION) {
      console.log(`Returning cached smart results for "${query}"`);
      return cached.results;
    }
    
    // Check if we already have an active request for this query
    if (GeocodingService.activeRequests.has(cacheKey)) {
      console.log(`Waiting for active request for "${query}"`);
      return GeocodingService.activeRequests.get(cacheKey)!;
    }
    
    // Get instant suggestions first for immediate feedback
    const instantResults = GeocodingService.getInstantSuggestions(query, Math.min(3, limit));
    
    // Create and track the search promise
    const searchPromise = GeocodingService.performSearchWithFallback(query, limit).then(results => {
      // Combine instant + API results and deduplicate
      const combined = [...instantResults, ...results];
      const deduplicated = GeocodingService.deduplicateResults(combined);
      const final = deduplicated.slice(0, limit);
      
      // Cache the results
      GeocodingService.cache.set(cacheKey, { results: final, timestamp: Date.now() });
      
      // Clean up active request
      GeocodingService.activeRequests.delete(cacheKey);
      
      return final;
    }).catch(error => {
      console.error('Smart search failed, returning instant results only:', error);
      GeocodingService.activeRequests.delete(cacheKey);
      return instantResults;
    });
    
    // Track the active request
    GeocodingService.activeRequests.set(cacheKey, searchPromise);
    
    return searchPromise;
  }

  /**
   * Perform search with database first, then Nominatim fallback
   */
  private static async performSearchWithFallback(query: string, limit: number): Promise<Location[]> {
    let databaseResults: Location[] = [];
    
    try {
      // 1. Try database first
      const response = await api.get('/api/v1/bus-schedules/locations/autocomplete', {
        params: {
          q: query.trim(),
          language: 'en'
        }
      });
      
      databaseResults = response.data || [];
      console.log(`Database returned ${databaseResults.length} results for "${query}"`);
      
      // If database has enough results, return early
      if (databaseResults.length >= limit) {
        return databaseResults.slice(0, limit).map(loc => ({ ...loc, source: 'database' as const }));
      }
      
    } catch (error) {
      console.error('Database search failed:', error);
    }
    
    // 2. Only use Nominatim if database results are insufficient
    let nominatimResults: Location[] = [];
    if (databaseResults.length < Math.min(limit, 5)) {
      try {
        const nominatimLimit = Math.max(3, limit - databaseResults.length);
        console.log(`Fetching ${nominatimLimit} results from Nominatim for "${query}"`);
        
        nominatimResults = await GeocodingService.searchNominatimOptimized(query, nominatimLimit);
        console.log(`Nominatim returned ${nominatimResults.length} results for "${query}"`);
      } catch (error) {
        console.error('Nominatim search failed:', error);
      }
    }

    // 3. Combine results
    return [
      ...databaseResults.map(loc => ({ ...loc, source: 'database' as const })),
      ...nominatimResults.map(loc => ({ ...loc, source: 'nominatim' as const }))
    ];
  }

  /**
   * Main search method with comprehensive caching and error handling
   */
  static async searchLocations(query: string, limit: number = 10): Promise<Location[]> {
    console.log(`Geocoding search for: "${query}"`);
    
    // Validation
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    // Check cache first
    const cacheKey = `${query.toLowerCase().trim()}_${limit}`;
    const cached = GeocodingService.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < GeocodingService.CACHE_DURATION) {
      console.log(`Returning cached results for "${query}"`);
      return cached.results;
    }
    
    // Check if we already have an active request for this query
    if (GeocodingService.activeRequests.has(cacheKey)) {
      console.log(`Waiting for active request for "${query}"`);
      return GeocodingService.activeRequests.get(cacheKey)!;
    }
    
    // Create and track the search promise
    const searchPromise = GeocodingService.performSearchWithFallback(query, limit).then(results => {
      const deduplicated = GeocodingService.deduplicateResults(results);
      const final = deduplicated.slice(0, limit);
      
      // Cache the results
      GeocodingService.cache.set(cacheKey, { results: final, timestamp: Date.now() });
      
      // Clean up active request
      GeocodingService.activeRequests.delete(cacheKey);
      
      console.log(`Returning ${final.length} deduplicated results for "${query}"`);
      return final;
    }).catch(error => {
      console.error('Search completely failed:', error);
      GeocodingService.activeRequests.delete(cacheKey);
      return [];
    });
    
    // Track the active request
    GeocodingService.activeRequests.set(cacheKey, searchPromise);
    
    return searchPromise;
  }

  /**
   * Optimized Nominatim search with rate limiting and error handling
   */
  private static async searchNominatimOptimized(query: string, limit: number): Promise<Location[]> {
    // Rate limiting: wait if last request was too recent
    const now = Date.now();
    const timeSinceLastRequest = now - GeocodingService.lastRequestTime;
    if (timeSinceLastRequest < GeocodingService.REQUEST_DELAY) {
      await new Promise(resolve => setTimeout(resolve, GeocodingService.REQUEST_DELAY - timeSinceLastRequest));
    }
    GeocodingService.lastRequestTime = Date.now();

    try {
      // Simplified search strategy - only try 2 queries max
      const searchQueries = [
        `${query}, Tamil Nadu, India`,
        `${query} city, Tamil Nadu, India`
      ];

      let allResults: any[] = [];

      for (const searchQuery of searchQueries) {
        try {
          const params = new URLSearchParams({
            q: searchQuery,
            format: 'json',
            countrycodes: 'in',
            limit: String(Math.min(limit, 5)),
            addressdetails: '1',
            bounded: '1',
            viewbox: '76.0,8.0,80.5,13.5' // Tamil Nadu bounding box
          });

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch(`${GeocodingService.NOMINATIM_BASE_URL}/search?${params}`, {
            headers: {
              'User-Agent': 'Perundhu Bus App (https://perundhu.com)'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

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
        } catch (error) {
          console.warn(`Nominatim request failed for "${searchQuery}":`, error);
          continue;
        }
      }

      // Filter and prioritize results
      const filteredResults = allResults
        .filter(result => {
          const displayName = result.display_name.toLowerCase();
          return displayName.includes('india') || displayName.includes('tamil nadu');
        })
        .sort((a, b) => {
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
   * Format Nominatim display name to be user-friendly
   */
  private static formatLocationName(displayName: string): string {
    const parts = displayName.split(',').map(part => part.trim());
    
    // Clean up parts
    const cleanPart = (part: string): string => {
      return part
        .replace(/\b(bus stand|railway station|bus stop|junction|depot)\b/gi, '')
        .replace(/\b(new|old)\s+/gi, '')
        .trim();
    };
    
    // Find the main city/town name
    let cityName = '';
    let districtName = '';
    
    for (let i = 0; i < Math.min(parts.length, 4); i++) {
      const part = parts[i];
      const cleanedPart = cleanPart(part);
      
      if (!cleanedPart) continue;
      
      // Skip landmarks/stations
      if (/(bus stand|railway station|bus stop|junction|depot|terminal)/i.test(part)) {
        continue;
      }
      
      // Skip state and country
      if (/(tamil nadu|india)/i.test(part)) {
        continue;
      }
      
      if (!cityName) {
        cityName = cleanedPart;
      } else if (!districtName && cleanedPart !== cityName) {
        districtName = cleanedPart;
        break;
      }
    }
    
    // Format result
    let formattedName = cityName;
    
    if (districtName && 
        districtName !== cityName && 
        !cityName.toLowerCase().includes(districtName.toLowerCase()) &&
        !districtName.toLowerCase().includes(cityName.toLowerCase())) {
      formattedName = `${cityName}, ${districtName}`;
    }
    
    return formattedName || displayName.split(',')[0].trim();
  }

  /**
   * Remove duplicate locations based on name and coordinates
   */
  private static deduplicateResults(locations: Location[]): Location[] {
    const seen = new Set<string>();
    const unique: Location[] = [];
    
    for (const location of locations) {
      // Create a key based on normalized name and approximate coordinates
      const normalizedName = location.name.toLowerCase().trim();
      const latRounded = Math.round(location.latitude * 1000); // 3 decimal places
      const lonRounded = Math.round(location.longitude * 1000);
      const key = `${normalizedName}_${latRounded}_${lonRounded}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(location);
      }
    }
    
    return unique;
  }

  /**
   * Universal location name formatter for consistent display
   */
  static formatLocationNameUniversal(name: string): string {
    if (!name) return '';
    
    const parts = name.split(',').map(part => part.trim());
    
    // For simple names (no commas), return as-is
    if (parts.length === 1) {
      return parts[0];
    }
    
    // For complex names, take the first meaningful part
    let mainName = parts[0];
    
    // If first part is too generic, try the second part
    if (mainName.length <= 2 || /^(new|old|north|south|east|west)$/i.test(mainName)) {
      mainName = parts[1] || mainName;
    }
    
    return mainName;
  }

  /**
   * Clear cache and active requests (useful for cleanup)
   */
  static clearCache(): void {
    GeocodingService.cache.clear();
    GeocodingService.activeRequests.clear();
  }
}

// Export default formatter function
export const formatLocationNameUniversal = GeocodingService.formatLocationNameUniversal;