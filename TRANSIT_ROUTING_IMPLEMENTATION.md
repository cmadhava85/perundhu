# Transit Routing Implementation Plan

## Current Status Assessment

### ✅ Working Features:
1. **Direct bus search** - Finds buses with exact from/to locations
2. **Via route search** - Finds buses passing through both locations as stops
3. **Continuing buses** - Finds buses that continue beyond destination
4. **Frontend sorting** - By departure, arrival, duration, price, rating

### ❌ Missing Features:
1. **Connecting routes logic** - Currently returns empty list
2. **Multi-hop transit** - No 2-3 bus connections
3. **Shortest route prioritization** - Backend doesn't optimize routes
4. **Distance-based sorting** - No geographic optimization

## Implementation Plan

### Phase 1: Database Schema (Optional - Use existing data)

**No schema changes needed!** Your existing tables support this:
- `buses` table has `from_location_id` and `to_location_id`
- `stops` table has `bus_id`, `location_id`, and `stop_order`
- Can build connections from existing data

### Phase 2: Backend Implementation

#### 2.1 Update ConnectingRouteServiceImpl

**File:** `backend/app/src/main/java/com/perundhu/application/service/ConnectingRouteServiceImpl.java`

**Algorithm:** Breadth-First Search (BFS) for shortest path

```java
package com.perundhu.application.service;

import com.perundhu.domain.service.ConnectingRouteService;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.ConnectingRoute;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.port.StopRepository;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ConnectingRouteServiceImpl implements ConnectingRouteService {

    private final StopRepository stopRepository;

    public ConnectingRouteServiceImpl(StopRepository stopRepository) {
        this.stopRepository = stopRepository;
    }

    @Override
    public List<ConnectingRoute> findConnectingRoutesDetailed(
            List<Bus> allBuses,
            Location fromLocation,
            Location toLocation,
            String languageCode,
            Integer maxDepth) {
        
        if (maxDepth == null) maxDepth = 2; // Default: allow 1 transfer (2 buses)
        
        // Build location graph from buses and stops
        Map<Long, Set<BusRoute>> locationGraph = buildLocationGraph(allBuses);
        
        // Find all possible routes using BFS
        List<List<BusRoute>> allPaths = findAllPaths(
            locationGraph, 
            fromLocation.id().value(), 
            toLocation.id().value(), 
            maxDepth
        );
        
        // Convert to ConnectingRoute domain objects
        List<ConnectingRoute> routes = allPaths.stream()
            .map(path -> createConnectingRoute(path, fromLocation, toLocation))
            .filter(Objects::nonNull)
            .sorted(Comparator
                .comparingDouble(ConnectingRoute::totalDuration)
                .thenComparingDouble(ConnectingRoute::totalDistance))
            .limit(10) // Return top 10 routes
            .collect(Collectors.toList());
        
        return routes;
    }

    /**
     * Build a graph where each location connects to other locations via buses
     */
    private Map<Long, Set<BusRoute>> buildLocationGraph(List<Bus> allBuses) {
        Map<Long, Set<BusRoute>> graph = new HashMap<>();
        
        for (Bus bus : allBuses) {
            // Get all stops for this bus, ordered
            List<Stop> busStops = stopRepository.findByBusIdOrderByStopOrder(bus.getId().value());
            
            // For each pair of consecutive stops, create edges
            for (int i = 0; i < busStops.size() - 1; i++) {
                Stop fromStop = busStops.get(i);
                
                for (int j = i + 1; j < busStops.size(); j++) {
                    Stop toStop = busStops.get(j);
                    
                    Long fromLocId = fromStop.getLocationId().value();
                    Long toLocId = toStop.getLocationId().value();
                    
                    BusRoute route = new BusRoute(
                        bus,
                        fromLocId,
                        toLocId,
                        fromStop,
                        toStop,
                        j - i // Number of stops
                    );
                    
                    graph.computeIfAbsent(fromLocId, k -> new HashSet<>()).add(route);
                }
            }
            
            // Also add direct from/to without stops
            Long fromId = bus.getFromLocation().id().value();
            Long toId = bus.getToLocation().id().value();
            
            if (!fromId.equals(toId)) {
                BusRoute directRoute = new BusRoute(
                    bus,
                    fromId,
                    toId,
                    null,
                    null,
                    0
                );
                graph.computeIfAbsent(fromId, k -> new HashSet<>()).add(directRoute);
            }
        }
        
        return graph;
    }

    /**
     * Find all paths from origin to destination using BFS
     * Returns paths sorted by number of transfers (shortest first)
     */
    private List<List<BusRoute>> findAllPaths(
            Map<Long, Set<BusRoute>> graph,
            Long fromLocationId,
            Long toLocationId,
            int maxDepth) {
        
        List<List<BusRoute>> allPaths = new ArrayList<>();
        Queue<PathNode> queue = new LinkedList<>();
        
        // Start with origin
        queue.offer(new PathNode(fromLocationId, new ArrayList<>(), new HashSet<>()));
        
        while (!queue.isEmpty()) {
            PathNode current = queue.poll();
            
            // Check if we reached destination
            if (current.locationId.equals(toLocationId)) {
                allPaths.add(new ArrayList<>(current.path));
                continue; // Found a path, continue searching for alternatives
            }
            
            // Check depth limit
            if (current.path.size() >= maxDepth) {
                continue; // Too many transfers
            }
            
            // Explore neighbors
            Set<BusRoute> routes = graph.getOrDefault(current.locationId, new HashSet<>());
            
            for (BusRoute route : routes) {
                Long nextLocationId = route.toLocationId;
                
                // Avoid cycles
                if (current.visited.contains(nextLocationId)) {
                    continue;
                }
                
                // Create new path
                List<BusRoute> newPath = new ArrayList<>(current.path);
                newPath.add(route);
                
                Set<Long> newVisited = new HashSet<>(current.visited);
                newVisited.add(nextLocationId);
                
                queue.offer(new PathNode(nextLocationId, newPath, newVisited));
            }
        }
        
        // Sort by number of buses (fewer transfers first)
        allPaths.sort(Comparator.comparingInt(List::size));
        
        return allPaths;
    }

    /**
     * Create ConnectingRoute domain object from path
     */
    private ConnectingRoute createConnectingRoute(
            List<BusRoute> path,
            Location fromLocation,
            Location toLocation) {
        
        if (path.isEmpty()) return null;
        
        // For single bus (direct route), return null - handled elsewhere
        if (path.size() == 1) return null;
        
        // Calculate total duration and distance
        double totalDuration = path.stream()
            .mapToDouble(this::estimateDuration)
            .sum();
        
        double totalDistance = path.stream()
            .mapToDouble(this::estimateDistance)
            .sum();
        
        // Get connection point (where buses meet)
        Location connectionPoint = path.get(0).bus.getToLocation();
        
        // Get first and second legs
        Bus firstBus = path.get(0).bus;
        Bus secondBus = path.get(1).bus;
        
        // Estimate wait time at connection point
        String waitTime = estimateWaitTime(firstBus, secondBus);
        
        return new ConnectingRoute(
            null, // id - will be generated
            connectionPoint,
            firstBus,
            secondBus,
            waitTime,
            totalDuration,
            totalDistance
        );
    }

    private double estimateDuration(BusRoute route) {
        Bus bus = route.bus;
        
        if (bus.getDepartureTime() != null && bus.getArrivalTime() != null) {
            LocalTime dep = bus.getDepartureTime();
            LocalTime arr = bus.getArrivalTime();
            
            Duration duration = Duration.between(dep, arr);
            if (duration.isNegative()) {
                duration = duration.plusHours(24); // Overnight journey
            }
            
            return duration.toMinutes();
        }
        
        // Estimate based on distance (50 km/hr average)
        double distance = estimateDistance(route);
        return (distance / 50.0) * 60; // minutes
    }

    private double estimateDistance(BusRoute route) {
        // Use Haversine formula for distance calculation
        // This is a simplified version - you might have this in your codebase
        return route.stopCount * 25.0; // Rough estimate: 25 km per stop
    }

    private String estimateWaitTime(Bus firstBus, Bus secondBus) {
        if (firstBus.getArrivalTime() != null && secondBus.getDepartureTime() != null) {
            LocalTime arrival = firstBus.getArrivalTime();
            LocalTime departure = secondBus.getDepartureTime();
            
            Duration wait = Duration.between(arrival, departure);
            if (wait.isNegative()) {
                wait = wait.plusHours(24);
            }
            
            long hours = wait.toHours();
            long minutes = wait.toMinutes() % 60;
            
            return String.format("%dh %dm", hours, minutes);
        }
        
        return "30m"; // Default estimate
    }

    // Helper classes
    private static class PathNode {
        Long locationId;
        List<BusRoute> path;
        Set<Long> visited;
        
        PathNode(Long locationId, List<BusRoute> path, Set<Long> visited) {
            this.locationId = locationId;
            this.path = path;
            this.visited = visited;
        }
    }

    private static class BusRoute {
        Bus bus;
        Long fromLocationId;
        Long toLocationId;
        Stop fromStop;
        Stop toStop;
        int stopCount;
        
        BusRoute(Bus bus, Long fromLocationId, Long toLocationId, 
                Stop fromStop, Stop toStop, int stopCount) {
            this.bus = bus;
            this.fromLocationId = fromLocationId;
            this.toLocationId = toLocationId;
            this.fromStop = fromStop;
            this.toStop = toStop;
            this.stopCount = stopCount;
        }
        
        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof BusRoute)) return false;
            BusRoute busRoute = (BusRoute) o;
            return Objects.equals(bus.getId(), busRoute.bus.getId()) &&
                   Objects.equals(fromLocationId, busRoute.fromLocationId) &&
                   Objects.equals(toLocationId, busRoute.toLocationId);
        }
        
        @Override
        public int hashCode() {
            return Objects.hash(bus.getId(), fromLocationId, toLocationId);
        }
    }
}
```

#### 2.2 Add Shortest Route Sorting to Controller

**File:** `backend/app/src/main/java/com/perundhu/adapter/in/rest/BusScheduleController.java`

Add sorting logic after combining results (around line 250):

```java
// After combining all results, sort by shortest route first
allResults.sort((a, b) -> {
    // 1. Sort by duration (shortest first)
    int durationA = calculateDuration(a);
    int durationB = calculateDuration(b);
    
    if (durationA != durationB) {
        return Integer.compare(durationA, durationB);
    }
    
    // 2. If duration is same, sort by departure time (earliest first)
    String depA = a.departureTime() != null ? a.departureTime() : "23:59";
    String depB = b.departureTime() != null ? b.departureTime() : "23:59";
    
    return depA.compareTo(depB);
});

// Helper method
private int calculateDuration(BusDTO bus) {
    if (bus.departureTime() == null || bus.arrivalTime() == null) {
        return 999; // Put buses without time at end
    }
    
    String[] depParts = bus.departureTime().split(":");
    String[] arrParts = bus.arrivalTime().split(":");
    
    int depMinutes = Integer.parseInt(depParts[0]) * 60 + Integer.parseInt(depParts[1]);
    int arrMinutes = Integer.parseInt(arrParts[0]) * 60 + Integer.parseInt(arrParts[1]);
    
    int duration = arrMinutes - depMinutes;
    
    // Handle overnight journeys
    if (duration < 0) {
        duration += 24 * 60;
    }
    
    return duration;
}
```

### Phase 3: Frontend Updates

#### 3.1 Update ConnectingRoutes Component

**File:** `frontend/src/components/ConnectingRoutes.tsx`

Already implemented! Just ensure it's displayed when connecting routes exist.

#### 3.2 Update App.tsx to Show Connecting Routes

The connecting routes are already integrated in your `App.tsx` via the hooks.

### Phase 4: Testing

#### 4.1 Backend Tests

**File:** `backend/app/src/test/java/com/perundhu/application/service/ConnectingRouteServiceImplTest.java`

```java
@Test
void shouldFindConnectingRoute_WhenNoDirectBus() {
    // Given: No direct bus from Chennai to Madurai
    // But: Chennai -> Trichy and Trichy -> Madurai buses exist
    
    // When
    List<ConnectingRoute> routes = connectingRouteService.findConnectingRoutesDetailed(
        allBuses, chennai, madurai, "en", 2
    );
    
    // Then
    assertThat(routes).isNotEmpty();
    assertThat(routes.get(0).connectionPoint().name()).isEqualTo("Trichy");
}

@Test
void shouldSortByShortestDuration() {
    // Given: Multiple connecting routes
    
    // When
    List<ConnectingRoute> routes = connectingRouteService.findConnectingRoutesDetailed(
        allBuses, chennai, madurai, "en", 3
    );
    
    // Then
    assertThat(routes).isSortedAccordingTo(
        Comparator.comparingDouble(ConnectingRoute::totalDuration)
    );
}
```

#### 4.2 Integration Tests

Test the full flow:
1. User searches Chennai to Madurai
2. No direct buses found
3. System returns connecting routes (Chennai -> Trichy -> Madurai)
4. Routes sorted by shortest duration first

## Summary of Changes

### Database: ✅ **NO CHANGES NEEDED**
- Existing schema supports this functionality

### Backend Changes:

1. **ConnectingRouteServiceImpl.java** - Complete rewrite with BFS algorithm
2. **BusScheduleController.java** - Add sorting by duration
3. **Add helper methods** for duration calculation

### Frontend Changes:

**MINIMAL** - Your frontend already supports this:
- ✅ ConnectingRoutes component exists
- ✅ Hooks fetch connecting routes
- ✅ UI displays connections properly

## Benefits

1. ✅ **Shortest route first** - BFS naturally finds shortest paths
2. ✅ **Multiple options** - Returns up to 10 alternative routes
3. ✅ **Smart sorting** - Duration → Departure time → Rating
4. ✅ **Scalable** - Handles complex route networks
5. ✅ **User-friendly** - Clear connection information with wait times

## Performance Considerations

- **Graph building**: O(B × S²) where B = buses, S = avg stops per bus
- **BFS search**: O(L × B) where L = locations, B = buses
- **Caching**: Consider caching common routes (Chennai-Madurai)
- **Limit results**: Return top 10 routes only

## Next Steps

1. Implement ConnectingRouteServiceImpl with BFS
2. Add sorting to controller
3. Test with real data
4. Add caching for popular routes
5. Monitor performance and optimize
