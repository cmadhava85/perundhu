/**
 * City Bus Stand Coordinates Mapping
 * Maps city names to their main bus stand coordinates
 */

export interface CityCoordinates {
  name: string;
  latitude: number;
  longitude: number;
  busStandName: string;
}

export const CITY_BUS_STANDS: Record<string, CityCoordinates> = {
  // Tamil Nadu Major Cities
  'chennai': {
    name: 'Chennai',
    latitude: 13.0827,
    longitude: 80.2707,
    busStandName: 'Chennai Central Bus Terminus'
  },
  'coimbatore': {
    name: 'Coimbatore',
    latitude: 11.0168,
    longitude: 76.9558,
    busStandName: 'Coimbatore Central Bus Stand'
  },
  'madurai': {
    name: 'Madurai',
    latitude: 9.9252,
    longitude: 78.1198,
    busStandName: 'Madurai Central Bus Stand'
  },
  'tiruchirappalli': {
    name: 'Tiruchirappalli',
    latitude: 10.7905,
    longitude: 78.7047,
    busStandName: 'Trichy Central Bus Stand'
  },
  'trichy': {
    name: 'Tiruchirappalli',
    latitude: 10.7905,
    longitude: 78.7047,
    busStandName: 'Trichy Central Bus Stand'
  },
  'salem': {
    name: 'Salem',
    latitude: 11.6643,
    longitude: 78.1460,
    busStandName: 'Salem Central Bus Stand'
  },
  'tirunelveli': {
    name: 'Tirunelveli',
    latitude: 8.7139,
    longitude: 77.7567,
    busStandName: 'Tirunelveli Junction Bus Stand'
  },
  'erode': {
    name: 'Erode',
    latitude: 11.3410,
    longitude: 77.7172,
    busStandName: 'Erode Central Bus Stand'
  },
  'vellore': {
    name: 'Vellore',
    latitude: 12.9165,
    longitude: 79.1325,
    busStandName: 'Vellore New Bus Stand'
  },
  'thoothukudi': {
    name: 'Thoothukudi',
    latitude: 8.7642,
    longitude: 78.1348,
    busStandName: 'Thoothukudi Bus Stand'
  },
  'tuticorin': {
    name: 'Thoothukudi',
    latitude: 8.7642,
    longitude: 78.1348,
    busStandName: 'Thoothukudi Bus Stand'
  },
  'thanjavur': {
    name: 'Thanjavur',
    latitude: 10.7870,
    longitude: 79.1378,
    busStandName: 'Thanjavur New Bus Stand'
  },
  'dindigul': {
    name: 'Dindigul',
    latitude: 10.3673,
    longitude: 77.9803,
    busStandName: 'Dindigul Bus Stand'
  },
  'karur': {
    name: 'Karur',
    latitude: 10.9601,
    longitude: 78.0766,
    busStandName: 'Karur Bus Stand'
  },
  'sivakasi': {
    name: 'Sivakasi',
    latitude: 9.4531,
    longitude: 77.7974,
    busStandName: 'Sivakasi Bus Stand'
  },
  'krishnagiri': {
    name: 'Krishnagiri',
    latitude: 12.5186,
    longitude: 78.2137,
    busStandName: 'Krishnagiri Bus Stand'
  },
  'tiruvannamalai': {
    name: 'Tiruvannamalai',
    latitude: 12.2253,
    longitude: 79.0747,
    busStandName: 'Tiruvannamalai Bus Stand'
  },
  'cuddalore': {
    name: 'Cuddalore',
    latitude: 11.7480,
    longitude: 79.7714,
    busStandName: 'Cuddalore Bus Stand'
  },
  'kanchipuram': {
    name: 'Kanchipuram',
    latitude: 12.8342,
    longitude: 79.7036,
    busStandName: 'Kanchipuram Bus Stand'
  },
  'kumbakonam': {
    name: 'Kumbakonam',
    latitude: 10.9601,
    longitude: 79.3788,
    busStandName: 'Kumbakonam Bus Stand'
  },
  'villupuram': {
    name: 'Villupuram',
    latitude: 11.9401,
    longitude: 79.4861,
    busStandName: 'Villupuram Bus Stand'
  },
  'pondicherry': {
    name: 'Pondicherry',
    latitude: 11.9416,
    longitude: 79.8083,
    busStandName: 'Pondicherry Bus Stand'
  },
  'puducherry': {
    name: 'Pondicherry',
    latitude: 11.9416,
    longitude: 79.8083,
    busStandName: 'Pondicherry Bus Stand'
  },
  'chidambaram': {
    name: 'Chidambaram',
    latitude: 11.3996,
    longitude: 79.6914,
    busStandName: 'Chidambaram Bus Stand'
  },
  'nagapattinam': {
    name: 'Nagapattinam',
    latitude: 10.7667,
    longitude: 79.8420,
    busStandName: 'Nagapattinam Bus Stand'
  },
  'mayiladuthurai': {
    name: 'Mayiladuthurai',
    latitude: 11.1021,
    longitude: 79.6530,
    busStandName: 'Mayiladuthurai Bus Stand'
  },
  'mayiladuturai': {
    name: 'Mayiladuthurai',
    latitude: 11.1021,
    longitude: 79.6530,
    busStandName: 'Mayiladuthurai Bus Stand'
  },
  'sirkazhi': {
    name: 'Sirkazhi',
    latitude: 11.2379,
    longitude: 79.7373,
    busStandName: 'Sirkazhi Bus Stand'
  },

  // Other South Indian Cities
  'bangalore': {
    name: 'Bangalore',
    latitude: 12.9716,
    longitude: 77.5946,
    busStandName: 'Bangalore City Bus Station'
  },
  'bengaluru': {
    name: 'Bangalore',
    latitude: 12.9716,
    longitude: 77.5946,
    busStandName: 'Bangalore City Bus Station'
  },
  'mysore': {
    name: 'Mysore',
    latitude: 12.2958,
    longitude: 76.6394,
    busStandName: 'Mysore Central Bus Stand'
  },
  'mysuru': {
    name: 'Mysore',
    latitude: 12.2958,
    longitude: 76.6394,
    busStandName: 'Mysore Central Bus Stand'
  },
  'kochi': {
    name: 'Kochi',
    latitude: 9.9312,
    longitude: 76.2673,
    busStandName: 'Kochi Central Bus Station'
  },
  'thiruvananthapuram': {
    name: 'Thiruvananthapuram',
    latitude: 8.5241,
    longitude: 76.9366,
    busStandName: 'Thiruvananthapuram Central Bus Station'
  },
  'trivandrum': {
    name: 'Thiruvananthapuram',
    latitude: 8.5241,
    longitude: 76.9366,
    busStandName: 'Thiruvananthapuram Central Bus Station'
  },
  'kozhikode': {
    name: 'Kozhikode',
    latitude: 11.2588,
    longitude: 75.7804,
    busStandName: 'Kozhikode Bus Stand'
  },
  'calicut': {
    name: 'Kozhikode',
    latitude: 11.2588,
    longitude: 75.7804,
    busStandName: 'Kozhikode Bus Stand'
  },
  'hubli': {
    name: 'Hubli',
    latitude: 15.3647,
    longitude: 75.1240,
    busStandName: 'Hubli Central Bus Stand'
  },
  'mangalore': {
    name: 'Mangalore',
    latitude: 12.9141,
    longitude: 74.8560,
    busStandName: 'Mangalore Central Bus Stand'
  },
  'vijayawada': {
    name: 'Vijayawada',
    latitude: 16.5062,
    longitude: 80.6480,
    busStandName: 'Vijayawada Bus Station'
  },
  'visakhapatnam': {
    name: 'Visakhapatnam',
    latitude: 17.6868,
    longitude: 83.2185,
    busStandName: 'Visakhapatnam Bus Complex'
  },
  'vizag': {
    name: 'Visakhapatnam',
    latitude: 17.6868,
    longitude: 83.2185,
    busStandName: 'Visakhapatnam Bus Complex'
  },
  'hyderabad': {
    name: 'Hyderabad',
    latitude: 17.3850,
    longitude: 78.4867,
    busStandName: 'Hyderabad Mahatma Gandhi Bus Station'
  },
  'warangal': {
    name: 'Warangal',
    latitude: 17.9689,
    longitude: 79.5941,
    busStandName: 'Warangal Bus Station'
  }
};

/**
 * Get city coordinates from city name
 * Performs fuzzy matching and handles common variations
 */
export function getCityCoordinates(cityName: string): CityCoordinates | null {
  if (!cityName) return null;
  
  // Normalize city name for lookup
  const normalized = cityName.toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize spaces
  
  // Direct lookup
  if (CITY_BUS_STANDS[normalized]) {
    return CITY_BUS_STANDS[normalized];
  }
  
  // Fuzzy matching for partial names
  for (const [key, coords] of Object.entries(CITY_BUS_STANDS)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return coords;
    }
    
    // Check if the display name matches
    if (coords.name.toLowerCase().includes(normalized) || 
        normalized.includes(coords.name.toLowerCase())) {
      return coords;
    }
  }
  
  return null;
}

/**
 * Extract city name from stop name
 * Handles common patterns like "Stop Name - City" or "City Stop Name"
 */
export function extractCityFromStopName(stopName: string): string {
  if (!stopName) return '';
  
  // Common patterns to extract city names
  const patterns = [
    /^(.+?)\s*-\s*(.+)$/, // "Stop Name - City"
    /^(.+?)\s+bus\s+stand/i, // "City Bus Stand"
    /^(.+?)\s+central/i, // "City Central"
    /^(.+?)\s+junction/i, // "City Junction"
    /^(.+?)\s+terminus/i, // "City Terminus"
  ];
  
  for (const pattern of patterns) {
    const match = stopName.match(pattern);
    if (match) {
      // Try the second capture group first (after dash), then first
      const cityCandidate = match[2] || match[1];
      if (getCityCoordinates(cityCandidate)) {
        return cityCandidate;
      }
    }
  }
  
  // If no pattern matches, try the whole name
  if (getCityCoordinates(stopName)) {
    return stopName;
  }
  
  // Try first word
  const firstWord = stopName.split(/\s+/)[0];
  if (getCityCoordinates(firstWord)) {
    return firstWord;
  }
  
  return stopName; // Return original if no city found
}

/**
 * Geocode a city name using Nominatim OpenStreetMap API
 * @param cityName - Name of the city to geocode
 * @returns Promise with coordinates or null if not found
 */
export async function geocodeCity(cityName: string): Promise<{ latitude: number; longitude: number; busStandName: string } | null> {
  if (!cityName) return null;
  
  try {
    // Use Nominatim API for geocoding
    const searchQuery = encodeURIComponent(`${cityName}, Tamil Nadu, India`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1&countrycodes=in`,
      {
        headers: {
          'User-Agent': 'Perundhu Bus Tracker (contact: admin@perundhu.com)'
        }
      }
    );
    
    if (!response.ok) {
      console.warn('Geocoding API request failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        busStandName: `${cityName} (Geocoded Location)`
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error geocoding city:', cityName, error);
    return null;
  }
}

/**
 * Get coordinates for a stop, with fallback to city coordinates if stop coordinates are null
 * @param stop - Stop object that might have null coordinates
 * @returns Coordinates object with latitude and longitude, or null if not found
 */
export function getStopCoordinates(stop: { name: string; latitude?: number | null; longitude?: number | null }): { latitude: number; longitude: number } | null {
  // Use stop coordinates if available
  if (stop.latitude && stop.longitude) {
    return { latitude: stop.latitude, longitude: stop.longitude };
  }
  
  // Fall back to city coordinates
  const cityCoords = getCityCoordinates(stop.name);
  if (cityCoords) {
    return { latitude: cityCoords.latitude, longitude: cityCoords.longitude };
  }
  
  return null;
}

/**
 * Get coordinates for a stop with async geocoding fallback
 * @param stop - Stop object that might have null coordinates
 * @returns Promise with coordinates object or null if not found
 */
export async function getStopCoordinatesAsync(stop: { name: string; latitude?: number | null; longitude?: number | null }): Promise<{ latitude: number; longitude: number; source: string } | null> {
  // Use stop coordinates if available
  if (stop.latitude && stop.longitude) {
    return { 
      latitude: stop.latitude, 
      longitude: stop.longitude, 
      source: 'Exact stop location' 
    };
  }
  
  // Fall back to city coordinates
  const cityCoords = getCityCoordinates(stop.name);
  if (cityCoords) {
    return { 
      latitude: cityCoords.latitude, 
      longitude: cityCoords.longitude, 
      source: cityCoords.busStandName 
    };
  }
  
  // Final fallback: try geocoding
  console.log(`Attempting to geocode unknown location: "${stop.name}"`);
  const geocodedCoords = await geocodeCity(stop.name);
  if (geocodedCoords) {
    return {
      latitude: geocodedCoords.latitude,
      longitude: geocodedCoords.longitude,
      source: geocodedCoords.busStandName
    };
  }
  
  return null;
}

/**
 * Create a descriptive label for coordinate source
 * @param stop - Stop object
 * @param coordinates - Coordinates being used
 * @returns Description of coordinate source
 */
export function getCoordinateSource(stop: { name: string; latitude?: number | null; longitude?: number | null }, coordinates: { latitude: number; longitude: number }): string {
  if (stop.latitude && stop.longitude) {
    return 'Exact stop location';
  }
  
  const cityCoords = getCityCoordinates(stop.name);
  if (cityCoords && cityCoords.latitude === coordinates.latitude && cityCoords.longitude === coordinates.longitude) {
    return `${cityCoords.busStandName} (city center)`;
  }
  
  return 'Approximate location';
}