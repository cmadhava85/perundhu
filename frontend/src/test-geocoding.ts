// Simple test script for geocoding functionality
import { getCityCoordinates, getStopCoordinatesAsync } from './utils/cityCoordinates';

async function testGeocodingFunctionality() {
  console.log('=== Testing Geocoding Functionality ===\n');
  
  // Test 1: Direct lookup for Villupuram
  console.log('Test 1: Direct lookup for Villupuram');
  const viluppuramCoords = getCityCoordinates('Villupuram');
  if (viluppuramCoords) {
    console.log('✅ Found Villupuram coordinates:', {
      name: viluppuramCoords.name,
      latitude: viluppuramCoords.latitude,
      longitude: viluppuramCoords.longitude,
      busStand: viluppuramCoords.busStandName
    });
  } else {
    console.log('❌ Villupuram not found in direct lookup');
  }
  
  // Test 2: Case insensitive lookup
  console.log('\nTest 2: Case insensitive lookup');
  const viluppuramLower = getCityCoordinates('villupuram');
  const viluppuramUpper = getCityCoordinates('VILLUPURAM');
  console.log('✅ Lower case found:', !!viluppuramLower);
  console.log('✅ Upper case found:', !!viluppuramUpper);
  
  // Test 3: Async geocoding for stop with known city
  console.log('\nTest 3: Async geocoding for stop with known city');
  const testStop = {
    name: 'Villupuram',
    latitude: null,
    longitude: null
  };
  
  try {
    const asyncResult = await getStopCoordinatesAsync(testStop);
    if (asyncResult) {
      console.log('✅ Async geocoding result:', {
        latitude: asyncResult.latitude,
        longitude: asyncResult.longitude,
        source: asyncResult.source
      });
    } else {
      console.log('❌ Async geocoding failed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ Error in async geocoding:', errorMessage);
  }
  
  // Test 4: Stop with exact coordinates
  console.log('\nTest 4: Stop with exact coordinates');
  const exactStop = {
    name: 'Test Stop',
    latitude: 12.345,
    longitude: 78.901
  };
  
  try {
    const exactResult = await getStopCoordinatesAsync(exactStop);
    if (exactResult) {
      console.log('✅ Exact coordinates preserved:', {
        latitude: exactResult.latitude,
        longitude: exactResult.longitude,
        source: exactResult.source
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('❌ Error with exact coordinates:', errorMessage);
  }
  
  console.log('\n=== Testing Complete ===');
}

// Export for manual testing
if (typeof window !== 'undefined') {
  (window as any).testGeocoding = testGeocodingFunctionality;
}

export { testGeocodingFunctionality };