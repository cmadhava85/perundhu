# Multi-Leg Routing - Uncovered Edge Cases & Scenarios

**Document Date:** January 23, 2026  
**Feature:** Multi-Leg Journey Planning  
**Status:** Implementation Complete (Basic), Enhancements Pending  
**Related Files:** 
- [BusScheduleServiceImpl.java](backend/app/src/main/java/com/perundhu/application/service/BusScheduleServiceImpl.java)
- [BusScheduleController.java](backend/app/src/main/java/com/perundhu/application/controller/BusScheduleController.java)

---

## Overview

The multi-leg routing feature allows users to find connecting bus routes when no direct buses exist from a specific bus stand. However, several edge cases are not yet covered. This document outlines these scenarios for future implementation.

---

## Uncovered Scenarios

### 1. Exact Name Mismatch Problem

**Scenario Type:** Location Name Matching

**Description:**  
User searches for a location using partial or different naming convention than stored in database.

**Example:**
```
User Input: "Tambaram"
Database Contains: 
  - "Tambaram - MTC Terminus"
  - "Tambaram Bus Stand"
  - "Tambaram East MTC Terminus"
  - "Tambaram Junction"

Current Behavior: findByExactName("Tambaram") returns null
Result: NO BUSES FOUND - Empty results
Expected Behavior: Show buses from ANY Tambaram variation
```

**Impact:** HIGH - Frequently encountered when user doesn't remember exact station name

**Current Implementation:**
```java
Optional<Location> toLocationOpt = locationRepository.findByExactName(toCityName);
// Uses exact match only
```

**Suggested Fix:**
- Implement fuzzy/partial name matching
- Create method: `findByPartialName()` or `findByNameContains()`
- Consider similarity scoring (Levenshtein distance)
- Cache results for performance

**Code Changes Needed:**
```java
// In LocationRepository
List<Location> findByNameContainsIgnoreCase(String partialName);

// In BusScheduleServiceImpl
private Optional<Location> findLocationByNameFuzzy(String searchName) {
    if (searchName == null || searchName.isBlank()) return Optional.empty();
    String normalized = normalizeLocationName(searchName);
    List<Location> matches = locationRepository.findByNameContainsIgnoreCase(normalized);
    return matches.stream().findFirst(); // Or pick best match by similarity
}
```

---

### 2. Multiple Variations of Same City Not Normalized

**Scenario Type:** Data Consistency

**Description:**  
Different bus routes store stops with different naming formats for the same city, and normalization doesn't unify them.

**Example:**
```
Route 1: Chennai → "Tambaram MTC Terminus" → Madurai
Route 2: Chennai → "Tambaram Bus Stand" → Madurai
Route 3: Chennai → "Tambaram-Junction" → Madurai

Current Behavior: Treats as 3 different intermediates
Database Queries: 
  - Chennai → "Tambaram MTC Terminus" → Madurai
  - Chennai → "Tambaram Bus Stand" → Madurai  
  - Chennai → "Tambaram-Junction" → Madurai

Expected Behavior: Recognize all as same location, eliminate duplicates
```

**Impact:** MEDIUM - Causes redundant search queries and potential duplicate results

**Current Implementation:**
```java
for (Stop stop : stops) {
    if (stop.location() != null) {
        Long stopLocId = stop.location().id().value();
        intermediateLocationIds.add(stopLocId);  // Uses raw IDs, not normalized names
    }
}
```

**Suggested Fix:**
- Normalize location names when storing intermediates
- Deduplicate by normalized name, not just by ID
- Merge similar locations in preprocessing

**Code Changes Needed:**
```java
Set<String> normalizedIntermediates = new HashSet<>();
Map<String, Long> normalizedToId = new HashMap<>();

for (Stop stop : stops) {
    if (stop.location() != null) {
        String normalized = normalizeLocationName(stop.location().name());
        normalizedIntermediates.add(normalized);
        normalizedToId.put(normalized, stop.location().id().value());
    }
}

// Now use normalizedToId.values() instead of raw IDs
```

---

### 3. Intermediate Stop with No Outbound Buses

**Scenario Type:** Incomplete Route Coverage

**Description:**  
An intermediate stop exists in a bus route but has no outbound buses to the destination, causing that connection path to be silently ignored.

**Example:**
```
Scenario:
Bus A: Chennai Broadway → Tambaram (stop) → Coimbatore
Bus B: Tambaram → Madurai ❌ (doesn't exist)

User Search: Chennai - Broadway → Madurai

Current Behavior:
1. Find buses from Broadway: None direct to Madurai
2. Identify intermediates: Tambaram found in Bus A
3. Search: Broadway → Tambaram: YES (Bus A)
4. Search: Tambaram → Madurai: NO buses found
5. Result: Connection skipped silently, no error/notification

Expected Behavior:
- Notify user: "You can reach Tambaram but no buses available from there"
- Show partial connections with notice
- Suggest nearby alternatives (Kilambakkam, Chengalpattu, etc.)
```

**Impact:** MEDIUM - User misses valid intermediate information

**Current Implementation:**
```java
if (!leg1Buses.isEmpty() && !leg2Buses.isEmpty()) {
    // Only adds if BOTH legs exist
    multiLegBuses.addAll(leg1Buses);
    multiLegBuses.addAll(leg2Buses);
}
// If leg2 is empty, this intermediate is completely ignored
```

**Suggested Fix:**
- Store partial connections separately
- Create a "connection status" response
- Return connectivity information even if incomplete

**Code Changes Needed:**
```java
// Create new DTO for partial connections
public record PartialConnection(
    Location intermediate,
    List<BusDTO> availableFromOrigin,
    int outboundBusCount
) {}

List<PartialConnection> partialConnections = new ArrayList<>();

for (Long intermediateId : intermediateLocationIds) {
    List<BusDTO> leg1 = findBusesBetweenLocations(fromLocationId, intermediateId, languageCode);
    List<BusDTO> leg2 = findBusesBetweenLocations(intermediateId, toLocationId, languageCode);
    
    if (!leg1.isEmpty()) {
        if (leg2.isEmpty()) {
            // Store as partial connection
            partialConnections.add(new PartialConnection(
                intermediate, leg1, 0));
        } else {
            // Store as complete connection
            multiLegBuses.addAll(leg1);
            multiLegBuses.addAll(leg2);
        }
    }
}
// Return response with both complete and partial connections
```

---

### 4. Bus Stand Name vs City Name Confusion

**Scenario Type:** Input Validation

**Description:**  
User provides input in various formats mixing bus stand names and city names, causing extraction logic to fail.

**Example:**
```
User Inputs:
1. "Chennai - Broadway" → Works (bus stand extracted)
2. "Broadway" → May fail (no city prefix)
3. "Broadway, Chennai" → May fail (different format)
4. "Chennai Broadway Terminal" → May fail (bus stand keywords not recognized)
5. "CMB" → Fails (abbreviation)
6. " Chennai - Broadway " → May fail (whitespace)

Expected: All should extract "Chennai" city
```

**Impact:** LOW-MEDIUM - Depends on user input patterns

**Current Implementation:**
```java
String fromCityName = extractCityFromBusStandSearch(fromBusStand);
// Uses specific keywords to extract city name
```

**Suggested Fix:**
- Support multiple input formats
- Handle abbreviations
- Clean whitespace aggressively
- Add input validation with helpful error messages

**Code Changes Needed:**
```java
private String normalizeAndExtractCity(String input) {
    if (input == null || input.isBlank()) return null;
    
    // Clean whitespace
    String cleaned = input.trim().replaceAll("\\s+", " ");
    
    // Handle abbreviations (could use external mapping)
    Map<String, String> abbreviations = Map.of(
        "CMB", "Chennai",
        "CBE", "Coimbatore",
        "MDU", "Madurai",
        "TVM", "Trivandrum"
    );
    
    for (Map.Entry<String, String> abbr : abbreviations.entrySet()) {
        if (cleaned.equalsIgnoreCase(abbr.getKey())) {
            return abbr.getValue();
        }
    }
    
    // Extract city from "City - StandName" format
    if (cleaned.contains("-")) {
        return cleaned.split("-")[0].trim();
    }
    
    // If input is only station name, try to find its city from DB
    return findCityForBusStand(cleaned);
}
```

---

### 5. Partial/Abbreviated Names Not Recognized

**Scenario Type:** User Input Handling

**Description:**  
Users commonly use abbreviations or shortened names for cities, which the system doesn't recognize.

**Common Abbreviations:**
```
- "Cbe" / "CBE" → Coimbatore
- "Mdu" / "MDU" → Madurai
- "TVM" / "Tvl" → Trivandrum
- "Blr" / "BLR" → Bangalore
- "Hyd" / "HYD" → Hyderabad
- "Omr" / "OMR" → OMR Road/Oragadam
```

**Example:**
```
User Input: "Cbe to Mdu"
Current Behavior: No match found
Expected Behavior: Redirect to Coimbatore → Madurai search
```

**Impact:** MEDIUM - Reduces discoverability for mobile/quick searches

**Suggested Fix:**
- Create abbreviation mapping database
- Support phonetic search (Soundex/Metaphone)
- Provide autocomplete suggestions

**Code Changes Needed:**
```java
// In database or config
private static final Map<String, String> CITY_ABBREVIATIONS = Map.ofEntries(
    Map.entry("cbe", "Coimbatore"),
    Map.entry("mdu", "Madurai"),
    Map.entry("tvm", "Trivandrum"),
    Map.entry("blr", "Bangalore"),
    Map.entry("hyd", "Hyderabad"),
    Map.entry("omr", "OMR Road"),
    Map.entry("chn", "Chennai")
);

private String expandAbbreviation(String input) {
    String lower = input.toLowerCase();
    return CITY_ABBREVIATIONS.getOrDefault(lower, input);
}
```

---

### 6. Case & Whitespace Sensitivity

**Scenario Type:** Input Normalization

**Description:**  
User enters location names with varying case or extra whitespace, causing exact name matching to fail.

**Example:**
```
Database: "Madurai"
User Enters:
- "madurai" → May not match
- "MADURAI" → May not match
- " madurai " → May not match
- "madurai  " (double space) → May not match

Current: normalizeLocationName() handles some of this
But exactName matching still case-sensitive in some paths
```

**Impact:** LOW - normalizeLocationName() mostly handles this, but worth reviewing

**Current Implementation:**
```java
private String normalizeLocationName(String name) {
    if (name == null) return null;
    return name.trim()
        .toLowerCase()
        .replaceAll("\\s+", " ")
        .replaceAll("[^a-z0-9\\s-]", "");
}
```

**Suggested Fix:**
- Apply normalization everywhere consistently
- Never use raw input for database lookups
- Add input sanitization at controller layer

---

### 7. Buses Without Stop Records

**Scenario Type:** Data Integrity

**Description:**  
A Bus entity exists in the database but has no associated Stop records, preventing identification of intermediate stops.

**Example:**
```
Database State:
Bus(id=100, name="45A Chennai-Madurai")
  ↓
Stop records: [] (empty or missing)

Current Behavior:
stopRepository.findByBusId(bus.id()) returns empty list
No intermediate stops identified
Multi-leg search never triggered for this bus
Result: Bus is skipped, not considered in search

Expected Behavior:
- Log warning about incomplete bus data
- Still use fromLocation/toLocation as fallback
- Alert data quality team
```

**Impact:** LOW-MEDIUM - Depends on data quality in system

**Current Implementation:**
```java
for (Bus bus : directBuses) {
    List<Stop> stops = stopRepository.findByBusId(bus.id());
    // If empty, loop just continues
}
```

**Suggested Fix:**
- Add validation
- Use bus fromLocation/toLocation as fallback
- Log incomplete data for auditing

**Code Changes Needed:**
```java
for (Bus bus : directBuses) {
    List<Stop> stops = stopRepository.findByBusId(bus.id());
    
    if (stops == null || stops.isEmpty()) {
        log.warn("Bus {} has no stop records, using from/to locations as fallback", bus.id());
        // Add from/to as default intermediates if they're on the route
        continue;
    }
    
    // Process stops normally
}
```

---

### 8. Circular Routes Problem

**Scenario Type:** Route Logic

**Description:**  
Some buses operate circular routes where they visit same city multiple times, causing confusion in multi-leg routing.

**Example:**
```
Route (Circular):
Chennai → Tambaram → Madurai → Bangalore → Tambaram → Coimbatore

User Search: Chennai → Madurai

Current Behavior:
1. Identifies intermediates: [Tambaram, Madurai, Bangalore]
2. Finds: Chennai → Tambaram → Madurai ✓
3. But also finds: Chennai → Tambaram → Bangalore → Tambaram → Madurai
4. Creates duplicate connections

Expected Behavior:
- Detect circular routes
- Use first occurrence of destination
- Avoid redundant paths
```

**Impact:** LOW - Rare scenario but causes confusing results

**Suggested Fix:**
- Detect circular routes
- Use first destination occurrence
- Eliminate subsequent duplicate stops

---

### 9. Same-City Intermediate Stops

**Scenario Type:** User Experience

**Description:**  
All intermediate stops are in the same city as origin, suggesting user to change bus stands within same city, which may not be intuitive.

**Example:**
```
Route: Chennai - Broadway → Chennai - CMBT → Chennai - Kilpauk → Madurai

User Search: "Chennai - Broadway" → Madurai

Current Behavior:
1. Identifies intermediates: [CMBT, Kilpauk] (both in Chennai)
2. Shows: 
   - Broadway → CMBT (same city transfer)
   - CMBT → Madurai
   
Expected Behavior:
- Filter out same-city intermediates
- Show only cross-city connections
- Offer "Change bus stand in Chennai" as alternative option
```

**Impact:** MEDIUM - Improves UX by reducing noise

**Current Implementation:**
```java
for (Stop stop : stops) {
    if (stop.location() != null) {
        Long stopLocId = stop.location().id().value();
        if (!stopLocId.equals(fromLocationId) && !stopLocId.equals(toLocationId)) {
            intermediateLocationIds.add(stopLocId);  // Adds even if same city
        }
    }
}
```

**Suggested Fix:**
- Get city ID for origin and intermediate
- Skip if same city
- Optionally collect same-city transfers separately

**Code Changes Needed:**
```java
for (Stop stop : stops) {
    if (stop.location() != null && stop.location().cityId() != null) {
        Long stopCityId = stop.location().cityId().value();
        
        // Skip if intermediate is in same city as origin
        if (fromLocationCityId != null && stopCityId.equals(fromLocationCityId)) {
            log.debug("Skipping same-city intermediate: {}", stop.location().name());
            continue;
        }
        
        Long stopLocId = stop.location().id().value();
        if (!stopLocId.equals(fromLocationId) && !stopLocId.equals(toLocationId)) {
            intermediateLocationIds.add(stopLocId);
        }
    }
}
```

---

### 10. No Multi-Leg Fallback Chain

**Scenario Type:** Error Handling & UX

**Description:**  
When all routing attempts fail (direct, multi-leg, via, continuing), user gets empty results without helpful guidance.

**Example:**
```
Scenario: No buses exist on searched route at all

Current Behavior:
1. Search direct buses → None
2. Search multi-leg → None
3. Search via/continuing → None
4. Search location-level → None
Result: Empty response, user confused

Expected Behavior:
- Suggest buses from same day, different time
- Suggest nearest alternative dates
- Suggest nearby locations
- Show "No service" message
```

**Impact:** MEDIUM - Affects user experience when results unavailable

**Current Implementation:**
```java
if (allBuses.isEmpty()) {
    return fallbackToLocationSearch(fromCityName, toCityName, languageCode);
}
```

**Suggested Fix:**
- Add multi-tier fallback strategy
- Suggest alternatives when no exact match found
- Show availability calendar

---

### 11. Language Code Not Properly Propagated

**Scenario Type:** Internationalization

**Description:**  
Multi-leg search passes languageCode through, but translations might be missing, causing mixed-language results or fallback to English.

**Example:**
```
User Search Language: Tamil ("ta")

Current Behavior:
1. findBusesBetweenLocations(id1, id2, "ta") called
2. If Tamil translation missing for intermediate stop name
3. Returns English name
Result: Mixed language response

Expected Behavior:
- Consistent language throughout
- Fallback gracefully to English if translation missing
- Log translation gaps for team to fix
```

**Impact:** LOW-MEDIUM - Affects non-English users

**Suggested Fix:**
- Verify language propagation
- Add fallback logic for missing translations
- Log translation gaps

---

### 12. Bus Stand Grouping in Multi-Leg Results

**Scenario Type:** Response Data Structure

**Description:**  
Multi-leg results don't indicate which specific bus stand to use for connections, only buses are returned.

**Example:**
```
Multi-leg Journey:
- Leg 1: Broadway 08:00 → Tambaram 09:00
- Leg 2: Tambaram Bus Stand 09:30 → Madurai 14:00

Current Response:
[
  {bus: "45A", from: "Broadway", to: "Tambaram", ...},
  {bus: "67C", from: "Tambaram Bus Stand", to: "Madurai", ...}
]

User Confusion:
- Are Tambaram and Tambaram Bus Stand same place?
- How much time to connect?
- Is connection possible in 30 minutes?

Expected Response:
[
  {
    connection: {
      intermediate: "Tambaram",
      connectionTime: 30,
      recommendations: "Recommended 45-60 minutes for safe connection"
    },
    leg1: {bus: "45A", ...},
    leg2: {bus: "67C", ...}
  }
]
```

**Impact:** MEDIUM - Affects usability of multi-leg results

**Suggested Fix:**
- Create response DTO with connection metadata
- Calculate connection time between arrivals/departures
- Provide connection recommendations

**Code Changes Needed:**
```java
public record ConnectionLeg(
    Location intermediate,
    BusDTO leg1Bus,
    BusDTO leg2Bus,
    Integer connectionTimeMinutes,
    String connectionRisk // "TIGHT", "COMFORTABLE", "SPACIOUS"
) {}

private ConnectionLeg buildConnectionLeg(BusDTO leg1, BusDTO leg2, Location intermediate) {
    if (leg1.arrivalTime() == null || leg2.departureTime() == null) {
        return null; // Skip if times missing
    }
    
    long connectionMinutes = ChronoUnit.MINUTES.between(
        leg1.arrivalTime(), leg2.departureTime());
    
    String risk = connectionMinutes < 30 ? "TIGHT" :
                  connectionMinutes < 60 ? "COMFORTABLE" : "SPACIOUS";
    
    return new ConnectionLeg(intermediate, leg1, leg2, 
        Math.toIntExact(connectionMinutes), risk);
}
```

---

### 13. Three-Leg or Longer Journeys Not Supported

**Scenario Type:** Route Complexity

**Description:**  
Current implementation only handles 2-leg journeys (origin → intermediate → destination). Optimal routes might require 3+ legs.

**Example:**
```
Optimal Route:
Chennai Broadway → Tambaram → Kilambakkam → Madurai (3 legs)

Current Behavior:
Stops after 2 legs, doesn't explore deeper chains
Result: Suboptimal routes shown or no route found

Expected Behavior:
- Recursively search for multi-leg chains
- Limit depth (e.g., max 4 legs)
- Calculate total journey time
- Show most optimal routing first
```

**Impact:** MEDIUM - Affects route quality for complex journeys

**Current Implementation:**
```java
private List<BusDTO> findMultiLegViaIntermediateStops(Long fromLocationId, Long toLocationId, ...) {
    // Only 2-leg logic: from → intermediate → to
}
```

**Suggested Fix:**
- Implement recursive/dynamic programming approach
- Add depth limiting
- Cache intermediate results

**Code Changes Needed:**
```java
private List<RouteChain> findMultiLegChains(Long fromLocationId, Long toLocationId, 
        String languageCode, int maxDepth, Set<Long> visited) {
    
    if (maxDepth == 0 || visited.contains(toLocationId)) {
        return List.of();
    }
    
    List<RouteChain> chains = new ArrayList<>();
    
    // Base case: direct route
    List<BusDTO> directBuses = findBusesBetweenLocations(fromLocationId, toLocationId, languageCode);
    if (!directBuses.isEmpty()) {
        chains.add(new RouteChain(List.of(directBuses)));
    }
    
    // Recursive case: find intermediates and continue
    Set<Long> newVisited = new HashSet<>(visited);
    newVisited.add(fromLocationId);
    
    // Find all intermediates from fromLocationId
    List<Long> intermediates = findIntermediateLocations(fromLocationId, toLocationId);
    
    for (Long intermediateId : intermediates) {
        List<BusDTO> leg1 = findBusesBetweenLocations(fromLocationId, intermediateId, languageCode);
        List<RouteChain> remainingChains = findMultiLegChains(intermediateId, toLocationId, 
            languageCode, maxDepth - 1, newVisited);
        
        for (RouteChain remaining : remainingChains) {
            List<BusDTO> combined = new ArrayList<>(leg1);
            combined.addAll(remaining.buses());
            chains.add(new RouteChain(combined));
        }
    }
    
    return chains;
}

record RouteChain(List<BusDTO> buses) {
    long totalDurationMinutes() {
        if (buses.isEmpty()) return 0;
        BusDTO first = buses.get(0);
        BusDTO last = buses.get(buses.size() - 1);
        return ChronoUnit.MINUTES.between(first.departureTime(), last.arrivalTime());
    }
}
```

---

### 14. Duplicate Buses Across Legs

**Scenario Type:** Data Deduplication

**Description:**  
Same bus operating multiple routes might appear twice in results as different connection options.

**Example:**
```
Bus 45A operates multiple routes:
- Route 1: Chennai → Tambaram → Madurai
- Route 2: Chennai → Kilambakkam → Madurai

Search: Chennai → Madurai

Current Result Shows:
1. 45A: Chennai → Tambaram leg1 (9:00-10:00)
2. 45A: Tambaram → Madurai leg2 (10:30-13:00)
3. 45A: Chennai → Kilambakkam leg1 (9:00-10:15)
4. 45A: Kilambakkam → Madurai leg2 (10:45-13:00)

User Sees: Same bus appears twice, confusing

Expected: Group by bus or show only best route
```

**Impact:** LOW - `removeDuplicateBuses()` mostly handles this, but review needed

**Current Implementation:**
```java
private List<BusDTO> removeDuplicateBuses(List<BusDTO> buses) {
    if (buses == null || buses.isEmpty()) return List.of();
    
    Set<String> seen = new HashSet<>();
    return buses.stream()
            .filter(bus -> seen.add(bus.busNumber()))
            .toList();
}
```

**Suggested Fix:**
- Improve deduplication logic
- Consider bus number + departure time + route
- Keep earliest/best option

---

### 15. Empty Location ID Handling & Null Checks

**Scenario Type:** Error Handling

**Description:**  
Intermediate stops might have missing IDs or null locations, causing NPE or silent failures.

**Example:**
```
Database State:
Stop(id=500, bus_id=100, location=null)
Stop(id=501, bus_id=100, location_id=null)

Current Code:
List<Stop> stops = stopRepository.findByBusId(bus.id());
for (Stop stop : stops) {
    if (stop.location() != null) {
        Long stopLocId = stop.location().id().value();  // NPE if id() is null
    }
}

Result: NPE or silent failure, no clear error message
```

**Impact:** LOW - But affects reliability

**Suggested Fix:**
- Add comprehensive null checks
- Log issues for debugging
- Use Optional for safety

**Code Changes Needed:**
```java
for (Stop stop : stops) {
    if (stop == null) {
        log.warn("Found null stop in list");
        continue;
    }
    
    Location location = stop.location();
    if (location == null) {
        log.debug("Stop {} has no location", stop.id());
        continue;
    }
    
    LocationId locId = location.id();
    if (locId == null) {
        log.warn("Stop {} location has no ID", stop.id());
        continue;
    }
    
    Long stopLocIdValue = locId.value();
    if (stopLocIdValue == null) {
        log.warn("Stop {} location ID value is null", stop.id());
        continue;
    }
    
    // Safe to use stopLocIdValue now
    if (!stopLocIdValue.equals(fromLocationId) && 
        !stopLocIdValue.equals(toLocationId)) {
        intermediateLocationIds.add(stopLocIdValue);
    }
}
```

---

## Implementation Priority Matrix

| Scenario | Priority | Impact | Effort | Dependencies |
|----------|----------|--------|--------|--------------|
| Exact Name Mismatch | HIGH | HIGH | MEDIUM | LocationRepository |
| Multiple Variations | HIGH | MEDIUM | MEDIUM | Normalization logic |
| Incomplete Outbound | MEDIUM | MEDIUM | LOW | Response DTO |
| Bus Stand vs City | MEDIUM | LOW | LOW | Input validation |
| Abbreviations | MEDIUM | MEDIUM | LOW | Config/mapping |
| Whitespace/Case | LOW | LOW | LOW | Existing utils |
| Missing Stop Records | MEDIUM | LOW | LOW | Logging |
| Circular Routes | LOW | LOW | MEDIUM | Route detection |
| Same-City Intermediates | MEDIUM | MEDIUM | LOW | City lookup |
| Fallback Chain | MEDIUM | MEDIUM | MEDIUM | New logic |
| Language Propagation | LOW | MEDIUM | LOW | I18N review |
| Connection Metadata | HIGH | HIGH | MEDIUM | New DTO |
| 3+ Leg Journeys | HIGH | MEDIUM | HIGH | Recursive logic |
| Duplicate Buses | LOW | LOW | LOW | Deduplication |
| Null Checks | LOW | LOW | LOW | Error handling |

---

## Testing Scenarios

For future QA testing, consider these test cases:

### Unit Tests
```java
@Test
void testExactNameMismatchFuzzyMatching() { }

@Test
void testMultipleLocationVariationNormalization() { }

@Test
void testIncompleteOutboundBusesHandling() { }

@Test
void testAbbreviationExpansion() { }

@Test
void testCircularRouteDetection() { }

@Test
void testSameCityIntermediateFiltering() { }

@Test
void testNullLocationHandling() { }

@Test
void test3PlusLegJourneys() { }

@Test
void testConnectionTimeCalculation() { }

@Test
void testLanguageCodePropagation() { }
```

### Integration Tests
```java
@Test
void testMultiLegSearchWithPartialResults() { }

@Test
void testMultiLegSearchWithDifferentBusStandFormats() { }

@Test
void testMultiLegSearchWithAbbreviations() { }

@Test
void testMultiLegSearchNoResultsWithFallback() { }

@Test
void testMultiLegSearchCircularRoutes() { }
```

---

## Database Considerations

Before implementing fixes, ensure database integrity:

```sql
-- Check for buses without stops
SELECT b.id, b.number FROM buses b 
LEFT JOIN stops s ON b.id = s.bus_id 
WHERE s.id IS NULL;

-- Check for stops without locations
SELECT s.id, s.bus_id FROM stops s 
WHERE s.location_id IS NULL;

-- Check for locations without IDs
SELECT id, name FROM locations 
WHERE id IS NULL;

-- Find circular routes
SELECT b.id, COUNT(DISTINCT l.id) as stop_count FROM buses b
JOIN stops s ON b.id = s.bus_id
JOIN locations l ON s.location_id = l.id
GROUP BY b.id
HAVING stop_count > 4;

-- Identify naming variations
SELECT name, COUNT(*) as count FROM locations 
GROUP BY LOWER(TRIM(name))
ORDER BY count DESC;
```

---

## Performance Considerations

For implementations handling many intermediates:

1. **Caching**
   - Cache intermediate location results
   - Cache normalization mappings
   - Cache abbreviation expansions

2. **Query Optimization**
   - Batch load stops for multiple buses
   - Use indexes on location names
   - Consider denormalization for frequently accessed data

3. **Limits**
   - Limit max intermediates to search (e.g., top 5)
   - Limit max legs to explore (e.g., max 4)
   - Set query timeout to prevent hung requests

---

## Related Code Files

- [BusScheduleServiceImpl.java](backend/app/src/main/java/com/perundhu/application/service/BusScheduleServiceImpl.java#L1556-L1617) - findMultiLegViaIntermediateStops()
- [BusScheduleService.java](backend/app/src/main/java/com/perundhu/application/service/BusScheduleService.java) - Interface definition
- [BusScheduleController.java](backend/app/src/main/java/com/perundhu/application/controller/BusScheduleController.java) - REST endpoints
- [LocationRepository.java](backend/app/src/main/java/com/perundhu/domain/port/LocationRepository.java) - Location queries
- [StopRepository.java](backend/app/src/main/java/com/perundhu/domain/port/StopRepository.java) - Stop queries

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-01-23 | 1.0 | AI Copilot | Initial documentation of edge cases |

---

## Next Steps

1. Review and prioritize scenarios above
2. Create JIRA/tickets for each scenario
3. Implement in priority order
4. Add unit tests for each scenario
5. Update this document as implementations complete

---

**Document Status:** FINAL - Ready for future implementation  
**Last Updated:** January 23, 2026, 08:50 UTC
