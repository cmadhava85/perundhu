# Overpass API Integration Testing Guide

## Quick Test Commands

### 1. Backend Service Test

Start the backend in development mode:
```bash
cd /Users/mchand69/Documents/perundhu/backend
./gradlew bootRun
```

Test the location autocomplete endpoint:
```bash
# Test 1: Search for Chennai (major city)
curl -X GET "http://localhost:8080/api/v1/bus-schedules/locations/autocomplete?q=Chennai&language=en" | jq '.'

# Test 2: Search for Madurai (secondary city)
curl -X GET "http://localhost:8080/api/v1/bus-schedules/locations/autocomplete?q=Madurai&language=en" | jq '.'

# Test 3: Search for Aruppukottai (smaller town, tests Overpass API)
curl -X GET "http://localhost:8080/api/v1/bus-schedules/locations/autocomplete?q=Aruppukottai&language=en" | jq '.'

# Test 4: Search for partial match (tests fuzzy matching)
curl -X GET "http://localhost:8080/api/v1/bus-schedules/locations/autocomplete?q=Tiruppur&language=en" | jq '.'

# Test 5: Search for bus stop (tests amenity search)
curl -X GET "http://localhost:8080/api/v1/bus-schedules/locations/autocomplete?q=bus+station&language=en" | jq '.'
```

### 2. Frontend Service Test

Open browser console and run:
```javascript
// Test 1: Basic location search
import { GeocodingService } from './src/services/geocodingService';
GeocodingService.searchLocations('Chennai', 10)
  .then(results => console.log('Chennai results:', results));

// Test 2: Search specific city
GeocodingService.searchLocations('Aruppukottai', 5)
  .then(results => console.log('Aruppukottai results:', results));

// Test 3: Get instant suggestions
const suggestions = GeocodingService.getInstantSuggestions('Mad', 10);
console.log('Instant suggestions for "Mad":', suggestions);

// Test 4: Check cache statistics
const stats = GeocodingService.getCacheStats();
console.log('Cache stats:', stats);

// Test 5: Clear cache and test fresh search
GeocodingService.clearCache();
GeocodingService.searchLocations('Madurai', 10)
  .then(results => console.log('Fresh search results:', results));
```

## Expected Results

### For "Chennai" Query
- **Expected Results:** 26,138+ locations from Overpass API
- **Source:** 'overpass' (API), 'database' (if enabled)
- **Top Results:** 
  - Chennai (city)
  - Chennai metropolitan areas
  - Chennai neighborhoods

### For "Madurai" Query
- **Expected Results:** Multiple Madurai locations
- **Location Details:** Latitude, longitude, source attribution
- **Source:** 'overpass' or 'database'

### For "Aruppukottai" Query
- **Expected Results:** 1-5 results
- **Spelling Handling:** Both "Aruppukottai" and "Aruppukkottai" accepted
- **Location:** Virudhunagar district, Tamil Nadu

## Performance Metrics to Monitor

1. **Response Time**
   - Database search: < 100ms
   - Overpass API search: 1000-2000ms (includes rate limiting)
   - Combined search: < 2500ms

2. **Cache Hit Rate**
   - First search: Cache miss (API call)
   - Repeated searches within 5 minutes: Cache hit (instant)
   - Cache duration: 5 minutes

3. **Result Accuracy**
   - All results within Tamil Nadu bounding box [8.0, 76.0, 13.5, 80.5]
   - Proper name formatting (city first, then district)
   - Coordinates within expected ranges

## Debugging

Enable detailed logging:
```javascript
// In browser console
// Enable all debug logs
localStorage.setItem('debug-log-category', 'SEARCH');

// View cache contents
GeocodingService.getCacheStats();

// Clear cache for fresh test
GeocodingService.clearCache();
```

Backend logging (check application logs):
```
[DEBUG] GeocodingService: Overpass API query for "Chennai"
[DEBUG] LocationResolutionService: New location from Overpass API - please verify
[INFO] BusScheduleController: Location autocomplete search
```

## Success Criteria Checklist

### Backend Tests
- [ ] OverpassGeocodingService instantiated successfully
- [ ] Overpass API responds to queries
- [ ] Results include Tamil Nadu locations only
- [ ] Circuit breaker works when API is unavailable
- [ ] Rate limiting (1100ms between requests) respected
- [ ] Results properly parsed from Overpass JSON format

### Frontend Tests
- [ ] searchOverpassOptimized() returns Location[] objects
- [ ] Location objects have: id, name, latitude, longitude, source
- [ ] source field contains 'overpass' for API results
- [ ] Cache mechanism works (duplicate queries return cached results)
- [ ] Deduplication removes similar location duplicates
- [ ] Distance calculation correct (Haversine formula)

### Integration Tests
- [ ] Database + Overpass results combined correctly
- [ ] Deduplication removes duplicates across sources
- [ ] Fallback to Overpass when database results insufficient
- [ ] User sees consistent location names
- [ ] Instant suggestions appear immediately (from COMMON_CITIES)

## Known Limitations

1. **Rate Limiting:** Overpass API enforces 1100ms minimum delay between requests
   - Acceptable for production use (user-level requests are sequential)
   - May need optimization for batch operations

2. **Network Dependency:** Overpass API requires internet connectivity
   - Graceful fallback to database results if API unavailable
   - Circuit breaker prevents cascading failures

3. **Tamil Nadu Only:** Query restricted to Tamil Nadu bounding box
   - Design choice for focused data
   - Can be extended to other states in future

## Next Steps

1. **Deploy to Staging Environment**
   - Test with real traffic patterns
   - Monitor API response times
   - Verify no regression in existing functionality

2. **Production Deployment**
   - Roll out with feature flag (if available)
   - Monitor error rates and API availability
   - Set up alerting for Overpass API outages

3. **Optimization (Optional)**
   - Consider caching entire location dataset locally
   - Pre-load common searches on app startup
   - Implement batch geocoding for routes

4. **Documentation**
   - Update API documentation with Overpass details
   - Document QL query format and limits
   - Create Overpass API troubleshooting guide

