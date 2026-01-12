# Route API Implementation Quick Reference

## Quick Links
- **Deep Analysis**: [ROUTE_API_DEEP_ANALYSIS.md](ROUTE_API_DEEP_ANALYSIS.md)
- **Architecture Diagrams**: [ROUTE_API_ARCHITECTURE_DIAGRAMS.md](ROUTE_API_ARCHITECTURE_DIAGRAMS.md)
- **This File**: Implementation code snippets and checklist

---

## The Problem in 30 Seconds

**Current**: User types "Salem" → API requires location ID → Gets only 8 routes
**Better**: User types "Salem" → API resolves ALL Salem locations → Gets 16 routes (from main city + all bus stands)

---

## Code Implementation (Copy-Paste Ready)

### 1. BusScheduleService Interface Addition

```java
// File: backend/app/src/main/java/com/perundhu/application/service/BusScheduleService.java

/**
 * Find connecting routes using location names instead of IDs.
 * Automatically resolves all matching locations (multi-bus-stands, 
 * duplicate names) and searches routes across all combinations.
 * 
 * Example: "Salem to Madurai" will search:
 * - Salem + Madurai
 * - Salem + Madurai - Central Bus Stand
 * - Salem - New Bus Stand + Madurai
 * - ... (all combinations)
 * 
 * @param fromLocationName Starting location name
 * @param toLocationName Destination location name
 * @param maxTransfers Maximum transfers allowed (0-3)
 * @param languageCode Language code for translations (en, ta, etc.)
 * @return List of connecting routes across all location combinations
 */
List<ConnectingRouteDTO> findConnectingRoutesByName(
    String fromLocationName,
    String toLocationName,
    int maxTransfers,
    String languageCode);
```

### 2. ConnectingRouteService Interface Addition

```java
// File: backend/app/src/main/java/com/perundhu/application/service/ConnectingRouteService.java

/**
 * Find connecting routes between multiple possible start/end locations.
 * Used for handling cities with multiple bus stands.
 * 
 * Example: Salem has 3 locations (city, new stand, old stand)
 *          Madurai has 2 locations
 *          This method searches all 3×2=6 combinations and deduplicates
 * 
 * @param fromLocationIds List of possible origin location IDs
 * @param toLocationIds List of possible destination location IDs
 * @param maxTransfers Maximum transfers allowed
 * @return Deduplicated list of best routes
 */
List<ConnectingRouteDTO> findConnectingRoutesAcrossLocations(
    List<Long> fromLocationIds,
    List<Long> toLocationIds,
    int maxTransfers);
```

### 3. BusScheduleServiceImpl Implementation

```java
// File: backend/app/src/main/java/com/perundhu/application/service/BusScheduleServiceImpl.java

@Override
public List<ConnectingRouteDTO> findConnectingRoutesByName(
        String fromLocationName,
        String toLocationName,
        int maxTransfers,
        String languageCode) {
    
    long startTime = System.currentTimeMillis();
    log.info("Finding connecting routes by name: from='{}' to='{}', lang='{}'",
        fromLocationName, toLocationName, languageCode);
    
    // STEP 1: Resolve all location IDs for both locations
    List<LocationGroupDTO> fromGroups = searchLocationsGrouped(fromLocationName, languageCode);
    List<LocationGroupDTO> toGroups = searchLocationsGrouped(toLocationName, languageCode);
    
    if (fromGroups.isEmpty()) {
        log.warn("No locations found matching: {}", fromLocationName);
        return List.of();
    }
    if (toGroups.isEmpty()) {
        log.warn("No locations found matching: {}", toLocationName);
        return List.of();
    }
    
    // STEP 2: Extract all location IDs
    List<Long> fromLocationIds = extractAllLocationIds(fromGroups);
    List<Long> toLocationIds = extractAllLocationIds(toGroups);
    
    log.debug("Resolved {} from-locations and {} to-locations",
        fromLocationIds.size(), toLocationIds.size());
    
    // STEP 3: Search routes across all combinations
    List<ConnectingRouteDTO> routes = connectingRouteService
        .findConnectingRoutesAcrossLocations(fromLocationIds, toLocationIds, maxTransfers);
    
    log.info("Found {} connecting routes in {}ms",
        routes.size(), System.currentTimeMillis() - startTime);
    
    return routes;
}

/**
 * Extract all location IDs from grouped location results.
 * Includes: city option, bus stands, neighborhoods
 */
private List<Long> extractAllLocationIds(List<LocationGroupDTO> groups) {
    List<Long> ids = new ArrayList<>();
    
    for (LocationGroupDTO group : groups) {
        // Add city option if present
        if (group.cityOption() != null) {
            ids.add(group.cityOption().id());
        }
        
        // Add all bus stands
        if (group.busStands() != null) {
            group.busStands().stream()
                .map(LocationDTO::id)
                .forEach(ids::add);
        }
        
        // Add neighborhoods (optional - removes if performance needed)
        if (group.neighborhoods() != null) {
            group.neighborhoods().stream()
                .map(LocationDTO::id)
                .forEach(ids::add);
        }
    }
    
    return ids;
}
```

### 4. ConnectingRouteServiceImpl Implementation

```java
// File: backend/app/src/main/java/com/perundhu/application/service/ConnectingRouteServiceImpl.java

private static final int MAX_RESULTS = 10;

@Override
public List<ConnectingRouteDTO> findConnectingRoutesAcrossLocations(
        List<Long> fromLocationIds,
        List<Long> toLocationIds,
        int maxTransfers) {
    
    log.info("Finding routes across {} from-locations and {} to-locations",
        fromLocationIds.size(), toLocationIds.size());
    
    if (fromLocationIds.isEmpty() || toLocationIds.isEmpty()) {
        return List.of();
    }
    
    // Map to store unique routes (avoid duplicates)
    Map<String, ConnectingRouteDTO> uniqueRoutes = new java.util.HashMap<>();
    int searchCount = 0;
    
    // Search all combinations
    for (Long fromId : fromLocationIds) {
        for (Long toId : toLocationIds) {
            // Skip same location
            if (fromId.equals(toId)) {
                continue;
            }
            
            try {
                // Find routes for this specific pair
                List<ConnectingRouteDTO> routes = findConnectingRoutes(fromId, toId, maxTransfers);
                searchCount++;
                
                // Add to map, avoiding duplicates
                for (ConnectingRouteDTO route : routes) {
                    String routeKey = generateRouteKey(route);
                    if (!uniqueRoutes.containsKey(routeKey)) {
                        uniqueRoutes.put(routeKey, route);
                    }
                }
            } catch (Exception e) {
                log.warn("Error finding routes from {} to {}", fromId, toId, e);
                // Continue with other combinations on error
            }
        }
    }
    
    // Sort by cost and limit results
    List<ConnectingRouteDTO> results = uniqueRoutes.values().stream()
        .sorted(Comparator.comparingDouble(this::calculateRouteCost))
        .limit(MAX_RESULTS)
        .toList();
    
    log.info("Completed {} location pair searches, returning {} unique routes",
        searchCount, results.size());
    
    return results;
}

/**
 * Generate unique key for a route to detect duplicates.
 * Two routes are considered same if they use same buses at same times.
 */
private String generateRouteKey(ConnectingRouteDTO route) {
    if (route.legs() == null || route.legs().isEmpty()) {
        return UUID.randomUUID().toString();
    }
    
    return route.legs().stream()
        .map(leg -> String.format("%d_%s_%s",
            leg.busId(),
            leg.departureTime(),
            leg.arrivalTime()))
        .reduce("", (a, b) -> a.isEmpty() ? b : a + "|" + b);
}

/**
 * Calculate total cost for sorting routes.
 * Cost = duration (minutes) + (transfers × 30-minute penalty)
 */
private double calculateRouteCost(ConnectingRouteDTO route) {
    if (route.totalDuration() == null) {
        return Double.MAX_VALUE;
    }
    
    double durationCost = route.totalDuration().toMinutes();
    double transferPenalty = route.transfers() * 30.0;  // 30 min per transfer
    
    return durationCost + transferPenalty;
}
```

### 5. REST Controller Endpoint

```java
// File: backend/app/src/main/java/com/perundhu/adapter/in/rest/BusScheduleController.java

/**
 * Find connecting routes using location names.
 * Automatically handles multi-bus-stand cities and duplicate location names.
 * 
 * Example: GET /api/v1/bus-schedules/connecting-routes-by-name
 *            ?from=Salem&to=Madurai&maxTransfers=2&language=en
 */
@Operation(summary = "Get connecting routes by city/bus stand names",
    description = "Find connecting routes when user enters city or bus stand names. " +
                  "Automatically resolves to all matching locations and searches across them. " +
                  "Example: 'Salem to Madurai' finds routes from any Salem location " +
                  "(city, new stand, old stand)")
@ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "Successfully retrieved connecting routes"),
    @ApiResponse(responseCode = "400", description = "Invalid location names", content = @Content),
    @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content)
})
@GetMapping("/connecting-routes-by-name")
public ResponseEntity<ConnectingRoutesByNameDTO> getConnectingRoutesByName(
        @Parameter(description = "Source location name (city or bus stand)")
        @RequestParam("from") String fromLocation,
        
        @Parameter(description = "Destination location name (city or bus stand)")
        @RequestParam("to") String toLocation,
        
        @Parameter(description = "Maximum number of transfers (0-3, default: 2)")
        @RequestParam(value = "maxTransfers", defaultValue = "2") int maxTransfers,
        
        @Parameter(description = "Language code for translations (en or ta)")
        @RequestParam(defaultValue = "en") String language) {
    
    // Apply rate limiting
    checkRateLimit(getUserId());
    
    log.info("Connecting routes by name: from='{}' to='{}', lang='{}'",
        fromLocation, toLocation, language);
    
    // Validate input
    if (fromLocation == null || fromLocation.isBlank() ||
        toLocation == null || toLocation.isBlank()) {
        log.warn("Invalid location names provided");
        return ResponseEntity.badRequest().build();
    }
    
    // Validate maxTransfers
    if (maxTransfers < 0 || maxTransfers > 3) {
        maxTransfers = 2;
    }
    
    try {
        // Get routes using location names
        List<ConnectingRouteDTO> routes = busScheduleService
            .findConnectingRoutesByName(fromLocation, toLocation, maxTransfers, language);
        
        if (routes.isEmpty()) {
            log.warn("No connecting routes found for {} to {}", fromLocation, toLocation);
            return ResponseEntity.ok(ConnectingRoutesByNameDTO.empty(fromLocation, toLocation));
        }
        
        // Resolve locations for response details
        List<LocationGroupDTO> fromGroups = busScheduleService
            .searchLocationsGrouped(fromLocation, language);
        List<LocationGroupDTO> toGroups = busScheduleService
            .searchLocationsGrouped(toLocation, language);
        
        // Build response
        List<ResolvedLocationInfo> fromLocations = extractLocationInfo(fromGroups);
        List<ResolvedLocationInfo> toLocations = extractLocationInfo(toGroups);
        
        ConnectingRoutesByNameDTO response = new ConnectingRoutesByNameDTO(
            fromLocation,
            toLocation,
            fromLocations,
            toLocations,
            routes,
            fromLocations.size(),
            toLocations.size(),
            routes.size()
        );
        
        log.info("Returning {} routes for {} to {}", 
            routes.size(), fromLocation, toLocation);
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        log.error("Error getting connecting routes from {} to {}",
            fromLocation, toLocation, e);
        return ResponseEntity.internalServerError().build();
    }
}

/**
 * Extract location info from grouped results
 */
private List<ResolvedLocationInfo> extractLocationInfo(List<LocationGroupDTO> groups) {
    List<ResolvedLocationInfo> locations = new ArrayList<>();
    
    for (LocationGroupDTO group : groups) {
        // Add city option
        if (group.cityOption() != null) {
            locations.add(new ResolvedLocationInfo(
                group.cityOption().id(),
                group.cityOption().name(),
                "CITY",
                null,
                null  // Bus count can be added if needed
            ));
        }
        
        // Add bus stands
        if (group.busStands() != null) {
            for (LocationDTO stand : group.busStands()) {
                locations.add(new ResolvedLocationInfo(
                    stand.id(),
                    stand.name(),
                    "BUS_STAND",
                    extractBusStandName(stand.name()),
                    null
                ));
            }
        }
    }
    
    return locations;
}

private String extractBusStandName(String fullName) {
    // Extract just the bus stand name from "City - Bus Stand Name"
    if (fullName.contains(" - ")) {
        return fullName.split(" - ")[1];
    }
    return fullName;
}
```

### 6. New DTO Classes

```java
// File: backend/app/src/main/java/com/perundhu/application/dto/ConnectingRoutesByNameDTO.java

package com.perundhu.application.dto;

import java.util.List;

/**
 * Response DTO for connecting routes searched by location names.
 * Includes resolved location options and all routes.
 */
public record ConnectingRoutesByNameDTO(
    String fromLocationName,
    String toLocationName,
    List<ResolvedLocationInfo> fromLocations,
    List<ResolvedLocationInfo> toLocations,
    List<ConnectingRouteDTO> routes,
    int totalFromLocations,
    int totalToLocations,
    int totalRoutes
) {
    
    public static ConnectingRoutesByNameDTO empty(String from, String to) {
        return new ConnectingRoutesByNameDTO(
            from, to,
            List.of(), List.of(),
            List.of(),
            0, 0, 0
        );
    }
}

// File: backend/app/src/main/java/com/perundhu/application/dto/ResolvedLocationInfo.java

package com.perundhu.application.dto;

/**
 * Information about a resolved location during name-based search.
 */
public record ResolvedLocationInfo(
    Long locationId,
    String name,
    String type,  // CITY, BUS_STAND, NEIGHBORHOOD
    String busStandName,  // null if not a bus stand
    Integer busCount  // How many buses depart from this location
) {}
```

---

## Testing Checklist

### Unit Tests

```java
// Test 1: extractAllLocationIds
@Test
void testExtractAllLocationIds_IncludesAllLocations() {
    LocationGroupDTO group = new LocationGroupDTO(
        "Salem",
        new LocationDTO(123L, "Salem"),
        List.of(
            new LocationDTO(124L, "Salem - New Bus Stand"),
            new LocationDTO(125L, "Salem - Old Bus Stand")
        ),
        List.of()
    );
    
    List<Long> ids = service.extractAllLocationIds(List.of(group));
    
    assertThat(ids).containsExactlyInAnyOrder(123L, 124L, 125L);
}

// Test 2: findConnectingRoutesByName
@Test
void testFindConnectingRoutesByName_ResolvesBothLocations() {
    when(busScheduleService.searchLocationsGrouped("Salem", "en"))
        .thenReturn(List.of(salemGroup));
    when(busScheduleService.searchLocationsGrouped("Madurai", "en"))
        .thenReturn(List.of(maduraiGroup));
    when(connectingRouteService.findConnectingRoutesAcrossLocations(
            List.of(123L, 124L, 125L),
            List.of(200L, 201L),
            2))
        .thenReturn(List.of(mockRoute1, mockRoute2));
    
    List<ConnectingRouteDTO> routes = service
        .findConnectingRoutesByName("Salem", "Madurai", 2, "en");
    
    assertThat(routes).hasSize(2);
}

// Test 3: findConnectingRoutesAcrossLocations deduplication
@Test
void testFindConnectingRoutesAcrossLocations_DeduplicatesSameRoutes() {
    // When: same bus appears in multiple from/to combinations
    // Then: should return only unique routes
    List<ConnectingRouteDTO> routes = service
        .findConnectingRoutesAcrossLocations(
            List.of(123L, 124L),
            List.of(200L, 201L),
            2);
    
    // Verify no route appears twice
    Set<String> routeKeys = routes.stream()
        .map(this::generateRouteKey)
        .collect(Collectors.toSet());
    assertThat(routeKeys.size()).isEqualTo(routes.size());
}
```

### Integration Tests

```java
// Test 4: End-to-end name-based search
@Test
void testConnectingRoutesByNameEndToEnd_WithMultiBusStandCity() {
    RestAssured.given()
        .param("from", "Salem")
        .param("to", "Madurai")
        .param("maxTransfers", "2")
        .param("language", "en")
        .when()
        .get("/api/v1/bus-schedules/connecting-routes-by-name")
        .then()
        .statusCode(200)
        .body("fromLocationName", equalTo("Salem"))
        .body("toLocationName", equalTo("Madurai"))
        .body("fromLocations.size()", greaterThan(1))
        .body("routes.size()", greaterThan(0));
}

// Test 5: Tamil language support
@Test
void testConnectingRoutesByName_WithTamilInput() {
    RestAssured.given()
        .param("from", "சாலம்")  // Salem in Tamil
        .param("to", "மதுரை")   // Madurai in Tamil
        .param("language", "ta")
        .when()
        .get("/api/v1/bus-schedules/connecting-routes-by-name")
        .then()
        .statusCode(200)
        .body("routes.size()", greaterThan(0));
}
```

---

## Deployment Checklist

- [ ] Create new interface methods in BusScheduleService
- [ ] Create new interface methods in ConnectingRouteService
- [ ] Implement in BusScheduleServiceImpl
- [ ] Implement in ConnectingRouteServiceImpl
- [ ] Create new DTO classes
- [ ] Add REST controller endpoint
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Add JavaDoc comments
- [ ] Update API documentation
- [ ] Performance test with multi-location data
- [ ] Load test (100+ concurrent requests)
- [ ] Verify backward compatibility (existing endpoints)
- [ ] Create database migration (if needed)
- [ ] Update frontend to use new endpoint
- [ ] Run full regression tests
- [ ] Deploy and monitor

---

## Quick Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "No routes found" | Location names not matching | Check LocationGroupDTO response, verify exact spelling |
| Slow response (>1s) | Too many location combinations | Limit to top 5 locations per search, add caching |
| Duplicate routes | Route key generation issue | Verify generateRouteKey() includes all unique identifiers |
| Missing bus stands | extractAllLocationIds() not including neighborhoods | Add neighborhood extraction if needed |
| Tamil characters fail | Language encoding issue | Verify UTF-8 encoding in database and API |

---

## Key Files to Modify

1. **Interfaces** (2 files)
   - `BusScheduleService.java` - Add interface method
   - `ConnectingRouteService.java` - Add interface method

2. **Implementations** (2 files)
   - `BusScheduleServiceImpl.java` - Implement location resolution
   - `ConnectingRouteServiceImpl.java` - Implement multi-location search

3. **DTOs** (2 files)
   - `ConnectingRoutesByNameDTO.java` - Response wrapper (NEW)
   - `ResolvedLocationInfo.java` - Location details (NEW)

4. **Controllers** (1 file)
   - `BusScheduleController.java` - Add REST endpoint

5. **Tests** (1 file)
   - `BusScheduleControllerTest.java` / `ConnectingRouteServiceTest.java`

**Total: ~8 files, ~300 lines of production code, ~200 lines of tests**

---

## References

- See: [ROUTE_API_DEEP_ANALYSIS.md](ROUTE_API_DEEP_ANALYSIS.md) for full analysis
- See: [ROUTE_API_ARCHITECTURE_DIAGRAMS.md](ROUTE_API_ARCHITECTURE_DIAGRAMS.md) for visual diagrams
- Existing: `LocationController.java` - For grouped location search patterns
- Existing: `ConnectingRouteServiceImpl.java` - For Dijkstra algorithm reference

