package com.perundhu.application.service;

import java.time.Duration;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.dto.ConnectingRouteDTO.LegDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.application.service.RouteGraphCacheService.BusSegmentData;
import com.perundhu.application.service.RouteGraphCacheService.RouteGraphData;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.port.LocationRepository;

/**
 * Implementation of ConnectingRouteService using Dijkstra's algorithm.
 * Finds optimal multi-transfer routes between locations by building a graph
 * of all bus stops and using priority-based search to find shortest paths.
 * 
 * Algorithm: Modified Dijkstra's with multi-criteria optimization
 * - Primary: Minimize total travel time (duration + wait times)
 * - Secondary: Minimize number of transfers
 * - Tertiary: Prefer shorter physical distance (A* heuristic)
 */
@Service
@Transactional(readOnly = true) // Optimize for read-only operations
public class ConnectingRouteServiceImpl implements ConnectingRouteService {

  private static final Logger log = LoggerFactory.getLogger(ConnectingRouteServiceImpl.class);
  private static final int MAX_RESULTS = 10;
  private static final int MIN_TRANSFER_WAIT_MINUTES = 10;
  private static final int MAX_TRANSFER_WAIT_MINUTES = 120;
  private static final int MAX_JOURNEY_DURATION_MINUTES = 720; // 12 hours max journey
  private static final double EARTH_RADIUS_KM = 6371.0;

  // Performance tuning constants
  private static final int MAX_QUEUE_SIZE = 10000; // Limit priority queue to prevent memory explosion
  private static final int MAX_PATHS_EXPLORED = 5000; // Early termination after exploring enough paths

  // Weighting factors for multi-criteria optimization
  private static final double DURATION_WEIGHT = 1.0; // Primary: minimize time
  private static final double TRANSFER_PENALTY = 30.0; // 30 minutes penalty per transfer

  private final LocationRepository locationRepository;
  private final RouteGraphCacheService routeGraphCacheService;

  public ConnectingRouteServiceImpl(
      LocationRepository locationRepository,
      RouteGraphCacheService routeGraphCacheService) {
    this.locationRepository = locationRepository;
    this.routeGraphCacheService = routeGraphCacheService;
  }

  @Override
  @Cacheable(value = "connectingRoutesCache", key = "#fromLocationId + '-' + #toLocationId + '-' + #maxTransfers")
  public List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId, int maxTransfers) {
    return findConnectingRoutesInternal(fromLocationId, toLocationId, maxTransfers, null);
  }

  @Override
  public List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId,
      LocalTime departureAfter, int maxTransfers) {
    return findConnectingRoutesInternal(fromLocationId, toLocationId, maxTransfers, departureAfter);
  }

  private List<ConnectingRouteDTO> findConnectingRoutesInternal(Long fromLocationId, Long toLocationId,
      int maxTransfers, LocalTime departureAfter) {
    log.info("Finding connecting routes from {} to {} with max {} transfers{}",
        fromLocationId, toLocationId, maxTransfers,
        departureAfter != null ? " departing after " + departureAfter : "");

    long startTime = System.currentTimeMillis();

    // Get locations
    Location fromLocation = locationRepository.findById(fromLocationId).orElse(null);
    Location toLocation = locationRepository.findById(toLocationId).orElse(null);

    if (fromLocation == null || toLocation == null) {
      log.warn("Invalid locations: from={}, to={}", fromLocationId, toLocationId);
      return List.of();
    }

    // Build the route graph (cached via external service - fixes proxy bypass
    // issue)
    RouteGraphData graph = routeGraphCacheService.buildRouteGraph();
    log.debug("Graph built in {}ms", System.currentTimeMillis() - startTime);

    // Use BFS to find all paths with up to maxTransfers
    long bfsStart = System.currentTimeMillis();
    List<RoutePath> paths = findPaths(graph, fromLocationId, toLocationId, maxTransfers);
    log.debug("BFS found {} paths in {}ms", paths.size(), System.currentTimeMillis() - bfsStart);

    log.info("Found {} potential paths", paths.size());

    // Convert paths to DTOs and filter by departure time if specified
    List<ConnectingRouteDTO> routes = paths.stream()
        .map(path -> convertToDTO(path, fromLocation, toLocation))
        .filter(route -> route != null)
        .filter(route -> filterByDepartureTime(route, departureAfter))
        .sorted(Comparator
            .comparingInt(ConnectingRouteDTO::transfers)
            .thenComparingInt(ConnectingRouteDTO::totalDuration))
        .limit(MAX_RESULTS)
        .toList();

    log.info("Returning {} connecting routes in {}ms total", routes.size(), System.currentTimeMillis() - startTime);
    return routes;
  }

  /**
   * Filter route by departure time.
   * Returns true if route should be included (departs after specified time).
   */
  private boolean filterByDepartureTime(ConnectingRouteDTO route, LocalTime departureAfter) {
    if (departureAfter == null) {
      return true; // No filter applied
    }

    if (route.legs() == null || route.legs().isEmpty()) {
      return true;
    }

    // Check first leg's departure time
    String departureTimeStr = route.legs().get(0).departureTime();
    if (departureTimeStr == null) {
      return true; // Include if no time info available
    }

    try {
      LocalTime routeDeparture = LocalTime.parse(departureTimeStr);
      return !routeDeparture.isBefore(departureAfter);
    } catch (Exception e) {
      log.debug("Could not parse departure time: {}", departureTimeStr);
      return true; // Include on parse error
    }
  }

  /**
   * Dijkstra's algorithm to find optimal paths from source to destination.
   * Uses priority queue to explore shortest paths first.
   * Returns multiple route options sorted by total weighted cost.
   * 
   * Optimizations:
   * - Queue size limit to prevent memory explosion
   * - Maximum paths explored limit for early termination
   * - Better state tracking to avoid redundant exploration
   */
  private List<RoutePath> findPaths(RouteGraphData graph, Long fromLocationId, Long toLocationId, int maxTransfers) {
    List<RoutePath> validPaths = new ArrayList<>();
    int pathsExplored = 0;

    // Priority queue sorted by weighted cost (lower is better)
    PriorityQueue<PathState> priorityQueue = new PriorityQueue<>(
        Comparator.comparingDouble(PathState::weightedCost));

    priorityQueue.add(new PathState(fromLocationId, new ArrayList<>(), new HashSet<>(), 0, 0));

    // Track best cost to reach each location with specific transfer count (for
    // better pruning)
    // Key: locationId + "-" + transfers, Value: best weighted cost
    Map<String, Double> bestCostToLocationWithTransfers = new HashMap<>();
    bestCostToLocationWithTransfers.put(fromLocationId + "-0", 0.0);

    while (!priorityQueue.isEmpty() && pathsExplored < MAX_PATHS_EXPLORED) {
      // Limit queue size to prevent memory explosion
      if (priorityQueue.size() > MAX_QUEUE_SIZE) {
        log.debug("Queue size {} exceeded limit, trimming...", priorityQueue.size());
        // Keep only the best entries
        List<PathState> bestStates = new ArrayList<>();
        while (!priorityQueue.isEmpty() && bestStates.size() < MAX_QUEUE_SIZE / 2) {
          bestStates.add(priorityQueue.poll());
        }
        priorityQueue.clear();
        priorityQueue.addAll(bestStates);
      }

      PathState state = priorityQueue.poll();
      pathsExplored++;

      // Check if we've reached the destination
      if (state.currentLocationId.equals(toLocationId) && !state.segments.isEmpty()) {
        // Only add if within journey limit
        if (isWithinJourneyLimit(state.totalDuration)) {
          validPaths.add(new RoutePath(new ArrayList<>(state.segments), state.totalDuration, state.transfers));
        }

        // Early termination: if we have enough routes, stop searching
        if (validPaths.size() >= MAX_RESULTS * 2) {
          log.debug("Found {} valid paths, terminating early after exploring {} states", validPaths.size(),
              pathsExplored);
          break;
        }
        continue;
      }

      // Don't explore further if we've exceeded max transfers
      if (state.transfers > maxTransfers) {
        continue;
      }

      // Don't explore if already exceeded journey limit
      if (!isWithinJourneyLimit(state.totalDuration)) {
        continue;
      }

      // Prune paths that are worse than what we've already found for this
      // location+transfers combo
      String stateKey = state.currentLocationId + "-" + state.transfers;
      Double bestCost = bestCostToLocationWithTransfers.get(stateKey);
      if (bestCost != null && state.weightedCost() > bestCost * 1.3) {
        continue; // This path is significantly worse, skip it
      }

      // Explore outgoing edges
      List<BusSegmentData> outgoingSegments = graph.getOutgoingEdges(state.currentLocationId);
      for (BusSegmentData segment : outgoingSegments) {
        // Skip if this would create a cycle in our path
        if (hasLocationInPath(state.segments, segment.toStop().location().id().value())) {
          continue;
        }

        // Calculate wait time and check transfer validity
        int waitTime = 0;
        int newTransfers = state.transfers;

        if (!state.segments.isEmpty()) {
          BusSegmentData lastSegment = state.segments.get(state.segments.size() - 1);

          // Check if this is a transfer (different bus)
          if (!lastSegment.bus().id().value().equals(segment.bus().id().value())) {
            if (!isValidTransfer(lastSegment, segment)) {
              continue;
            }
            waitTime = calculateWaitTime(lastSegment, segment);
            newTransfers++;

            // Skip if new transfer count exceeds limit
            if (newTransfers > maxTransfers) {
              continue;
            }
          }
        }

        // Calculate new weighted cost
        int newDuration = state.totalDuration + segment.duration() + waitTime;
        double newWeightedCost = calculateWeightedCost(newDuration, newTransfers);

        // Only explore if this path is potentially better
        Long nextLocationId = segment.toStop().location().id().value();
        String nextStateKey = nextLocationId + "-" + newTransfers;
        Double existingBestCost = bestCostToLocationWithTransfers.get(nextStateKey);

        if (existingBestCost == null || newWeightedCost < existingBestCost) {
          bestCostToLocationWithTransfers.put(nextStateKey, newWeightedCost);

          // Add this segment and continue search
          List<BusSegmentData> newPath = new ArrayList<>(state.segments);
          newPath.add(segment);

          Set<Long> newBusesUsed = new HashSet<>(state.busesUsed);
          newBusesUsed.add(segment.bus().id().value());

          priorityQueue.add(new PathState(
              nextLocationId,
              newPath,
              newBusesUsed,
              newDuration,
              newTransfers));
        }
      }
    }

    log.debug("Explored {} paths, found {} valid routes", pathsExplored, validPaths.size());

    // Sort final results by weighted cost
    validPaths.sort(Comparator.comparingDouble(RoutePath::weightedCost));

    // Apply diversity filter to ensure varied results
    return filterForDiversity(validPaths);
  }

  /**
   * Filter routes to ensure diversity in transfer points.
   * This prevents returning multiple routes with the same connection points.
   */
  private List<RoutePath> filterForDiversity(List<RoutePath> paths) {
    if (paths.size() <= MAX_RESULTS) {
      return paths;
    }

    List<RoutePath> diversePaths = new ArrayList<>();
    Set<String> seenTransferSignatures = new HashSet<>();

    for (RoutePath path : paths) {
      String signature = getTransferSignature(path);

      // Always include the first path (best cost)
      // For subsequent paths, check for diversity
      if (diversePaths.isEmpty() || !seenTransferSignatures.contains(signature)) {
        diversePaths.add(path);
        seenTransferSignatures.add(signature);

        if (diversePaths.size() >= MAX_RESULTS) {
          break;
        }
      }
    }

    // If we don't have enough diverse paths, add remaining by cost
    if (diversePaths.size() < MAX_RESULTS) {
      for (RoutePath path : paths) {
        if (!diversePaths.contains(path)) {
          diversePaths.add(path);
          if (diversePaths.size() >= MAX_RESULTS) {
            break;
          }
        }
      }
    }

    return diversePaths;
  }

  /**
   * Generate a signature for a route based on its transfer points.
   * Routes with same transfer points are considered similar.
   */
  private String getTransferSignature(RoutePath path) {
    StringBuilder signature = new StringBuilder();
    Set<Long> transferLocations = new HashSet<>();

    for (int i = 1; i < path.segments.size(); i++) {
      BusSegmentData prev = path.segments.get(i - 1);
      BusSegmentData curr = path.segments.get(i);

      // Check if this is a transfer (different bus)
      if (!prev.bus().id().value().equals(curr.bus().id().value())) {
        Long transferLocationId = prev.toStop().location().id().value();
        transferLocations.add(transferLocationId);
      }
    }

    // Create sorted signature
    transferLocations.stream()
        .sorted()
        .forEach(id -> signature.append(id).append("-"));

    // Also include number of segments as part of signature
    signature.append("s").append(path.segments.size());

    return signature.toString();
  }

  /**
   * Calculate weighted cost for multi-criteria optimization.
   * Lower cost = better route
   */
  private double calculateWeightedCost(int totalDuration, int transfers) {
    return (totalDuration * DURATION_WEIGHT) + (transfers * TRANSFER_PENALTY);
  }

  /**
   * Calculate wait time between two bus segments
   */
  private int calculateWaitTime(BusSegmentData arriving, BusSegmentData departing) {
    LocalTime arrivalTime = arriving.toStop().arrivalTime();
    LocalTime departureTime = departing.fromStop().departureTime();

    if (arrivalTime == null || departureTime == null) {
      return 15; // Default wait time if timing info missing
    }

    long waitMinutes = Duration.between(arrivalTime, departureTime).toMinutes();
    if (waitMinutes < 0) {
      waitMinutes += 24 * 60; // Handle next-day departures
    }

    return (int) waitMinutes;
  }

  /**
   * Calculate distance between two locations using Haversine formula.
   * Returns distance in kilometers.
   */
  private double calculateHaversineDistance(Location from, Location to) {
    if (from == null || to == null)
      return 0.0;
    if (from.latitude() == null || from.longitude() == null)
      return 0.0;
    if (to.latitude() == null || to.longitude() == null)
      return 0.0;

    double lat1 = Math.toRadians(from.latitude());
    double lat2 = Math.toRadians(to.latitude());
    double lon1 = Math.toRadians(from.longitude());
    double lon2 = Math.toRadians(to.longitude());

    double dLat = lat2 - lat1;
    double dLon = lon2 - lon1;

    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(lat1) * Math.cos(lat2)
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
  }

  /**
   * Calculate total distance for a route path
   */
  private double calculateTotalDistance(List<BusSegmentData> segments) {
    double totalDistance = 0.0;
    for (BusSegmentData segment : segments) {
      Location from = segment.fromStop().location();
      Location to = segment.toStop().location();
      totalDistance += calculateHaversineDistance(from, to);
    }
    return totalDistance;
  }

  /**
   * Check if a route is within acceptable journey time limit.
   * Default: 12 hours maximum
   */
  private boolean isWithinJourneyLimit(int totalDuration) {
    return totalDuration <= MAX_JOURNEY_DURATION_MINUTES;
  }

  /**
   * Check if a location is already visited in the current path
   */
  private boolean hasLocationInPath(List<BusSegmentData> segments, Long locationId) {
    for (BusSegmentData segment : segments) {
      if (segment.fromStop().location().id().value().equals(locationId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a transfer between two bus segments is valid.
   * Transfer is valid if:
   * 1. The arrival of first bus is before departure of second
   * 2. Wait time is between MIN and MAX transfer wait times
   */
  private boolean isValidTransfer(BusSegmentData arriving, BusSegmentData departing) {
    // If same bus, no transfer needed
    if (arriving.bus().id().value().equals(departing.bus().id().value())) {
      return true;
    }

    LocalTime arrivalTime = arriving.toStop().arrivalTime();
    LocalTime departureTime = departing.fromStop().departureTime();

    if (arrivalTime == null || departureTime == null) {
      // Allow if timing info is missing
      return true;
    }

    // Calculate wait time
    long waitMinutes = Duration.between(arrivalTime, departureTime).toMinutes();

    // Handle next-day departures
    if (waitMinutes < 0) {
      waitMinutes += 24 * 60;
    }

    return waitMinutes >= MIN_TRANSFER_WAIT_MINUTES && waitMinutes <= MAX_TRANSFER_WAIT_MINUTES;
  }

  /**
   * Calculate duration between two times in minutes
   */
  private int calculateDuration(LocalTime departure, LocalTime arrival) {
    if (departure == null || arrival == null) {
      return 30; // Default duration if times are missing
    }

    long minutes = Duration.between(departure, arrival).toMinutes();
    if (minutes < 0) {
      minutes += 24 * 60; // Handle overnight journeys
    }

    return (int) minutes;
  }

  /**
   * Convert a route path to a DTO
   */
  private ConnectingRouteDTO convertToDTO(RoutePath path, Location fromLocation, Location toLocation) {
    if (path.segments.isEmpty()) {
      return null;
    }

    try {
      List<LegDTO> legs = new ArrayList<>();
      int totalDuration = 0;

      // Calculate total distance using Haversine formula
      double totalDistance = calculateTotalDistance(path.segments);

      // Group consecutive segments by bus
      List<List<BusSegmentData>> groupedByBus = groupSegmentsByBus(path.segments);

      for (List<BusSegmentData> busSegments : groupedByBus) {
        if (busSegments.isEmpty())
          continue;

        BusSegmentData firstSegment = busSegments.get(0);
        BusSegmentData lastSegment = busSegments.get(busSegments.size() - 1);
        Bus bus = firstSegment.bus();

        // Calculate leg duration
        int legDuration = busSegments.stream()
            .mapToInt(s -> s.duration())
            .sum();
        totalDuration += legDuration;

        // Create leg DTO
        LegDTO leg = new LegDTO(
            bus.id().value(),
            bus.name(),
            bus.number(),
            firstSegment.fromStop().id() != null ? firstSegment.fromStop().id().value() : null,
            lastSegment.toStop().id() != null ? lastSegment.toStop().id().value() : null,
            convertStopToDTO(firstSegment.fromStop()),
            convertStopToDTO(lastSegment.toStop()),
            firstSegment.fromStop().departureTime() != null ? firstSegment.fromStop().departureTime().toString() : null,
            lastSegment.toStop().arrivalTime() != null ? lastSegment.toStop().arrivalTime().toString() : null,
            legDuration,
            null // Distance not available
        );

        legs.add(leg);
      }

      // Add wait times between transfers
      for (int i = 0; i < legs.size() - 1; i++) {
        LegDTO currentLeg = legs.get(i);
        LegDTO nextLeg = legs.get(i + 1);

        if (currentLeg.arrivalTime() != null && nextLeg.departureTime() != null) {
          LocalTime arrival = LocalTime.parse(currentLeg.arrivalTime());
          LocalTime departure = LocalTime.parse(nextLeg.departureTime());
          long waitMinutes = Duration.between(arrival, departure).toMinutes();
          if (waitMinutes < 0)
            waitMinutes += 24 * 60;
          totalDuration += (int) waitMinutes;
        }
      }

      return new ConnectingRouteDTO(
          UUID.randomUUID().toString(),
          fromLocation.id().value(),
          toLocation.id().value(),
          convertLocationToDTO(fromLocation),
          convertLocationToDTO(toLocation),
          legs,
          totalDuration,
          totalDistance > 0 ? totalDistance : null,
          legs.size() - 1 // transfers = legs - 1
      );
    } catch (Exception e) {
      log.error("Error converting path to DTO", e);
      return null;
    }
  }

  /**
   * Group consecutive segments that use the same bus
   */
  private List<List<BusSegmentData>> groupSegmentsByBus(List<BusSegmentData> segments) {
    List<List<BusSegmentData>> groups = new ArrayList<>();
    if (segments.isEmpty())
      return groups;

    List<BusSegmentData> currentGroup = new ArrayList<>();
    Long currentBusId = null;

    for (BusSegmentData segment : segments) {
      Long segmentBusId = segment.bus().id().value();

      if (currentBusId == null || currentBusId.equals(segmentBusId)) {
        currentGroup.add(segment);
      } else {
        groups.add(currentGroup);
        currentGroup = new ArrayList<>();
        currentGroup.add(segment);
      }
      currentBusId = segmentBusId;
    }

    if (!currentGroup.isEmpty()) {
      groups.add(currentGroup);
    }

    return groups;
  }

  private StopDTO convertStopToDTO(Stop stop) {
    // Convert features list to map format expected by StopDTO
    Map<String, String> featuresMap = new HashMap<>();
    if (stop.features() != null) {
      for (int i = 0; i < stop.features().size(); i++) {
        featuresMap.put("feature" + i, stop.features().get(i));
      }
    }

    return new StopDTO(
        stop.id() != null ? stop.id().value() : null,
        stop.name(),
        stop.location() != null && stop.location().id() != null ? stop.location().id().value() : null,
        stop.arrivalTime(),
        stop.departureTime(),
        stop.sequence(),
        featuresMap,
        stop.location() != null ? stop.location().latitude() : null,
        stop.location() != null ? stop.location().longitude() : null);
  }

  private LocationDTO convertLocationToDTO(Location location) {
    return new LocationDTO(
        location.id() != null ? location.id().value() : null,
        location.name(),
        location.name(), // translated name
        location.latitude(),
        location.longitude());
  }

  // Inner classes for path state tracking

  /**
   * State for Dijkstra's traversal with cost tracking
   */
  private record PathState(
      Long currentLocationId,
      List<BusSegmentData> segments,
      Set<Long> busesUsed,
      int totalDuration,
      int transfers) {
    double weightedCost() {
      return (totalDuration * DURATION_WEIGHT) + (transfers * TRANSFER_PENALTY);
    }
  }

  /**
   * A complete route path with cost information
   */
  private record RoutePath(List<BusSegmentData> segments, int totalDuration, int transfers) {
    double weightedCost() {
      return (totalDuration * DURATION_WEIGHT) + (transfers * TRANSFER_PENALTY);
    }
  }
}
