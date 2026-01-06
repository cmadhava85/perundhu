# Phase 4: API Integration Guide for Multi-State Routes

## Overview
This guide covers updating the backend API to fully leverage the new multi-state location search capabilities. No breaking changes - all updates are backward compatible.

---

## Current State

### Location Search Controller (Before)
```java
@RestController
@RequestMapping("/api/bus-routes")
public class BusRouteController {
    
    @GetMapping("/search")
    public ResponseEntity<List<LocationDTO>> searchLocations(
        @RequestParam String query,
        @RequestParam(defaultValue = "10") int limit
    ) {
        // Calls OverpassGeocodingService.searchTamilNaduLocations()
        return ResponseEntity.ok(locationService.searchLocations(query, limit));
    }
}
```

**Issue:** Only searches Tamil Nadu locations

---

## Target State (After)

### Enhanced Location Search Controller
```java
@RestController
@RequestMapping("/api/bus-routes")
public class BusRouteController {
    
    @GetMapping("/search")
    public ResponseEntity<LocationSearchResponse> searchLocations(
        @RequestParam String query,
        @RequestParam(defaultValue = "10") int limit,
        @RequestParam(required = false) String state,
        @RequestParam(required = false, defaultValue = "true") boolean multistate
    ) {
        List<LocationDTO> locations;
        
        if (multistate && state == null) {
            // Multi-state search: all states
            locations = locationService.searchMultiStateLocations(query, limit, "en");
        } else if (state != null) {
            // Single state search
            locations = locationService.searchTamilNaduLocations(query, limit); // Extend to support states
        } else {
            // Fallback to Tamil Nadu only
            locations = locationService.searchTamilNaduLocations(query, limit);
        }
        
        return ResponseEntity.ok(new LocationSearchResponse(locations, multistate));
    }
}
```

---

## Changes Required

### 1. Update LocationDTO (Add State Field)

**File:** `backend/app/src/main/java/com/perundhu/application/dto/LocationDTO.java`

```java
public class LocationDTO {
    private String id;
    private String name;
    private Double latitude;
    private Double longitude;
    private String district;
    private String state;           // ← NEW FIELD
    private int priority;           // ← NEW FIELD (1=Major hub, 2=Secondary)
    private String type;            // ← NEW FIELD (city, town, village)
    
    public LocationDTO() {}
    
    public LocationDTO(String id, String name, Double latitude, Double longitude, 
                      String district, String state, int priority, String type) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.district = district;
        this.state = state;
        this.priority = priority;
        this.type = type;
    }
    
    // Getters and setters
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    
    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
```

### 2. Create LocationSearchResponse

**File:** `backend/app/src/main/java/com/perundhu/application/dto/LocationSearchResponse.java`

```java
public class LocationSearchResponse {
    private List<LocationDTO> locations;
    private boolean multiState;
    private String searchMode;
    private int totalResults;
    private long searchTimeMs;
    
    public LocationSearchResponse(List<LocationDTO> locations, boolean multiState) {
        this.locations = locations;
        this.multiState = multiState;
        this.searchMode = multiState ? "MULTI_STATE" : "SINGLE_STATE";
        this.totalResults = locations != null ? locations.size() : 0;
        this.searchTimeMs = 0;
    }
    
    // Getters and setters
    public List<LocationDTO> getLocations() { return locations; }
    public boolean isMultiState() { return multiState; }
    public String getSearchMode() { return searchMode; }
    public int getTotalResults() { return totalResults; }
    public long getSearchTimeMs() { return searchTimeMs; }
}
```

### 3. Update Bus Route Controller

**File:** `backend/app/src/main/java/com/perundhu/application/controller/BusRouteController.java`

Add new endpoint or modify existing:

```java
@GetMapping("/locations/search")
public ResponseEntity<LocationSearchResponse> searchLocations(
    @RequestParam(required = true) String query,
    @RequestParam(defaultValue = "10") int limit,
    @RequestParam(required = false) String state,
    @RequestParam(defaultValue = "true") boolean multiState
) {
    long startTime = System.currentTimeMillis();
    
    List<LocationDTO> results;
    
    if (!multiState || state != null) {
        // Single state search
        results = overpassGeocodingService.searchTamilNaduLocations(query, limit);
    } else {
        // Multi-state search (default)
        results = overpassGeocodingService.searchMultiStateLocations(query, limit);
    }
    
    LocationSearchResponse response = new LocationSearchResponse(results, multiState);
    response.setSearchTimeMs(System.currentTimeMillis() - startTime);
    
    return ResponseEntity.ok(response);
}

@GetMapping("/locations/by-state/{state}")
public ResponseEntity<List<LocationDTO>> getLocationsByState(
    @PathVariable String state,
    @RequestParam(required = false) String query
) {
    // New endpoint for state-specific searches
    // Calls: overpassGeocodingService.fetchLocationsFromState()
    return ResponseEntity.ok(new ArrayList<>());
}
```

### 4. Update Location Service/Repository

**File:** `backend/app/src/main/java/com/perundhu/persistence/repository/LocationRepository.java`

Add new query methods:

```java
@Repository
public interface LocationRepository extends JpaRepository<Location, String> {
    
    // Existing
    List<Location> findByNameIgnoreContaining(String name);
    
    // NEW - Multi-state queries
    List<Location> findByStateAndNameIgnoreContaining(String state, String name);
    
    List<Location> findByState(String state);
    
    @Query("SELECT l FROM Location l WHERE l.state IN :states AND LOWER(l.name) LIKE LOWER(:query) ORDER BY l.priority ASC, l.name ASC")
    List<Location> findInMultipleStatesByName(@Param("states") List<String> states, @Param("query") String query);
    
    // Search by district within state
    @Query("SELECT l FROM Location l WHERE l.state = :state AND l.district = :district AND LOWER(l.name) LIKE LOWER(:query)")
    List<Location> findByStateAndDistrict(@Param("state") String state, @Param("district") String district, @Param("query") String query);
}
```

---

## API Endpoint Specifications

### Endpoint 1: Multi-State Search (Default)

```http
GET /api/bus-routes/locations/search?query=Bangalore&limit=10&multiState=true
```

**Response:**
```json
{
  "locations": [
    {
      "id": "loc_bangalore_ka",
      "name": "Bangalore",
      "latitude": 12.9716,
      "longitude": 77.5946,
      "district": "Bangalore",
      "state": "karnataka",
      "priority": 2,
      "type": "city"
    },
    {
      "id": "loc_hosur_ka",
      "name": "Hosur",
      "latitude": 12.7431,
      "longitude": 77.8278,
      "district": "Krishnagiri",
      "state": "karnataka",
      "priority": 2,
      "type": "city"
    }
  ],
  "multiState": true,
  "searchMode": "MULTI_STATE",
  "totalResults": 2,
  "searchTimeMs": 145
}
```

### Endpoint 2: State-Specific Search

```http
GET /api/bus-routes/locations/search?query=Chennai&state=tamil_nadu&limit=5&multiState=false
```

**Response:**
```json
{
  "locations": [
    {
      "id": "loc_chennai_tn",
      "name": "Chennai",
      "latitude": 13.0827,
      "longitude": 80.2707,
      "district": "Kancheepuram",
      "state": "tamil_nadu",
      "priority": 1,
      "type": "city"
    }
  ],
  "multiState": false,
  "searchMode": "SINGLE_STATE",
  "totalResults": 1,
  "searchTimeMs": 87
}
```

### Endpoint 3: List All States

```http
GET /api/bus-routes/states
```

**Response:**
```json
{
  "states": [
    {
      "code": "tamil_nadu",
      "name": "Tamil Nadu",
      "locationCount": 15,
      "priority": 1,
      "majorCities": ["Chennai", "Coimbatore", "Madurai"]
    },
    {
      "code": "karnataka",
      "name": "Karnataka",
      "locationCount": 8,
      "priority": 2,
      "majorCities": ["Bangalore", "Mysore"]
    },
    {
      "code": "kerala",
      "name": "Kerala",
      "locationCount": 7,
      "priority": 2,
      "majorCities": ["Kochi", "Thiruvananthapuram"]
    },
    {
      "code": "andhra_pradesh",
      "name": "Andhra Pradesh",
      "locationCount": 5,
      "priority": 2,
      "majorCities": ["Tirupati", "Nellore"]
    }
  ]
}
```

---

## Testing Checklist

### Unit Tests

```java
@SpringBootTest
public class MultiStateSearchIntegrationTest {
    
    @Autowired
    private BusRouteController controller;
    
    @Test
    public void testMultiStateSearchFindsKarnatakaLocations() {
        ResponseEntity<LocationSearchResponse> response = 
            controller.searchLocations("Bangalore", 10, null, true);
        
        assertTrue(response.getStatusCode().is2xxSuccessful());
        assertTrue(response.getBody().getLocations().stream()
            .anyMatch(l -> l.getState().equals("karnataka")));
    }
    
    @Test
    public void testSingleStateSearchFiltersByState() {
        ResponseEntity<LocationSearchResponse> response = 
            controller.searchLocations("Chennai", 10, "tamil_nadu", false);
        
        assertTrue(response.getBody().getLocations().stream()
            .allMatch(l -> l.getState().equals("tamil_nadu")));
    }
}
```

### Integration Tests

```bash
# Test multi-state search
curl -X GET 'http://localhost:8080/api/bus-routes/locations/search?query=Bangalore&multiState=true'

# Test state-specific search
curl -X GET 'http://localhost:8080/api/bus-routes/locations/search?query=Chennai&state=tamil_nadu&multiState=false'

# Test state list
curl -X GET 'http://localhost:8080/api/bus-routes/states'
```

---

## Database Indexing

Ensure these indexes exist for performance:

```sql
-- Indexes for fast multi-state queries
CREATE INDEX idx_state ON locations(state);
CREATE INDEX idx_state_name ON locations(state, name);
CREATE INDEX idx_state_district ON locations(state, district);
CREATE INDEX idx_priority ON locations(priority);
CREATE INDEX idx_coordinates ON locations(latitude, longitude);

-- Verify
SHOW INDEX FROM locations;
```

---

## Performance Considerations

| Query | Expected Time | Index |
|-------|---------------|-------|
| Single state search | < 50ms | idx_state_name |
| Multi-state search | < 150ms | idx_state, idx_priority |
| By coordinates | < 30ms | idx_coordinates |
| Full state list | < 10ms | idx_state |

---

## Deployment Checklist

- [ ] Update LocationDTO with new fields
- [ ] Create LocationSearchResponse class
- [ ] Update BusRouteController with new endpoints
- [ ] Create LocationRepository query methods
- [ ] Add unit tests
- [ ] Run integration tests
- [ ] Verify database indexes exist
- [ ] Update API documentation (Swagger/OpenAPI)
- [ ] Test with real multi-state data (after Overpass API available)
- [ ] Deploy to staging environment
- [ ] Performance test with 28,000+ locations
- [ ] Deploy to production

---

## Rollback Plan

If issues occur:
1. All changes are backward compatible
2. Can disable multi-state with `multiState=false` parameter
3. Default falls back to Tamil Nadu search
4. No database schema changes required (only new columns)

---

## Timeline

- **API Controller Updates:** 15 minutes
- **DTOs and Responses:** 10 minutes
- **Repository Queries:** 10 minutes
- **Unit Tests:** 20 minutes
- **Integration Testing:** 15 minutes
- **Total:** ~70 minutes

---

**Next:** Implement these changes after confirming requirements with team.
