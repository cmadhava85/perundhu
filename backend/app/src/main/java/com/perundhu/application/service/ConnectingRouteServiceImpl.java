package com.perundhu.application.service;

import java.time.Duration;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.dto.ConnectingRouteDTO.LegDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.StopRepository;

/**
 * Implementation of ConnectingRouteService using BFS algorithm.
 * Finds multi-transfer routes between locations by building a graph
 * of all bus stops and using breadth-first search to find paths.
 */
@Service
public class ConnectingRouteServiceImpl implements ConnectingRouteService {

  private static final Logger log = LoggerFactory.getLogger(ConnectingRouteServiceImpl.class);
  private static final int MAX_RESULTS = 10;
  private static final int MIN_TRANSFER_WAIT_MINUTES = 10;
  private static final int MAX_TRANSFER_WAIT_MINUTES = 120;

  private final BusRepository busRepository;
  private final LocationRepository locationRepository;
  private final StopRepository stopRepository;

  public ConnectingRouteServiceImpl(
      BusRepository busRepository,
      LocationRepository locationRepository,
      StopRepository stopRepository) {
    this.busRepository = busRepository;
    this.locationRepository = locationRepository;
    this.stopRepository = stopRepository;
  }

  @Override
  public List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId, int maxTransfers) {
    log.info("Finding connecting routes from {} to {} with max {} transfers",
        fromLocationId, toLocationId, maxTransfers);

    long startTime = System.currentTimeMillis();

    // Get locations
    Location fromLocation = locationRepository.findById(fromLocationId).orElse(null);
    Location toLocation = locationRepository.findById(toLocationId).orElse(null);

    if (fromLocation == null || toLocation == null) {
      log.warn("Invalid locations: from={}, to={}", fromLocationId, toLocationId);
      return List.of();
    }

    // Build the route graph (cached)
    RouteGraph graph = buildRouteGraph();
    log.debug("Graph built in {}ms", System.currentTimeMillis() - startTime);

    // Use BFS to find all paths with up to maxTransfers
    long bfsStart = System.currentTimeMillis();
    List<RoutePath> paths = findPaths(graph, fromLocationId, toLocationId, maxTransfers);
    log.debug("BFS found {} paths in {}ms", paths.size(), System.currentTimeMillis() - bfsStart);

    log.info("Found {} potential paths", paths.size());

    // Convert paths to DTOs
    List<ConnectingRouteDTO> routes = paths.stream()
        .map(path -> convertToDTO(path, fromLocation, toLocation))
        .filter(route -> route != null)
        .sorted(Comparator
            .comparingInt(ConnectingRouteDTO::transfers)
            .thenComparingInt(ConnectingRouteDTO::totalDuration))
        .limit(MAX_RESULTS)
        .collect(Collectors.toList());

    log.info("Returning {} connecting routes in {}ms total", routes.size(), System.currentTimeMillis() - startTime);
    return routes;
  }

  /**
   * Build a graph representing all bus routes.
   * Nodes are locations, edges are bus segments between stops.
   * This method is cached since the route graph changes infrequently.
   */
  @Cacheable(value = "routeGraphCache")
  public RouteGraph buildRouteGraph() {
    RouteGraph graph = new RouteGraph();
    long startTime = System.currentTimeMillis();

    List<Bus> allBuses = busRepository.findAll();
    log.debug("Building route graph from {} buses", allBuses.size());

    // Collect all bus IDs first
    List<Long> busIds = allBuses.stream()
        .filter(bus -> bus.id() != null)
        .map(bus -> bus.id().value())
        .toList();
    
    // Load all stops for all buses in one query (batch load)
    Map<Long, List<Stop>> stopsByBusId = new HashMap<>();
    for (Bus bus : allBuses) {
      if (bus.id() == null) continue;
      // This still does N queries - we'll optimize repository later
      List<Stop> stops = stopRepository.findByBusIdOrderByStopOrder(bus.id().value());
      stopsByBusId.put(bus.id().value(), stops);
    }
    log.debug("Loaded stops for {} buses in {}ms", stopsByBusId.size(), System.currentTimeMillis() - startTime);

    for (Bus bus : allBuses) {
      if (bus.id() == null)
        continue;

      List<Stop> stops = stopsByBusId.get(bus.id().value());
      if (stops == null) continue;

      // Add edges between consecutive stops
      for (int i = 0; i < stops.size() - 1; i++) {
        Stop fromStop = stops.get(i);
        Stop toStop = stops.get(i + 1);

        if (fromStop.location() == null || toStop.location() == null)
          continue;
        if (fromStop.location().id() == null || toStop.location().id() == null)
          continue;

        Long fromLocId = fromStop.location().id().value();
        Long toLocId = toStop.location().id().value();

        // Calculate duration between stops
        int duration = calculateDuration(fromStop.departureTime(), toStop.arrivalTime());

        graph.addEdge(fromLocId, toLocId, new BusSegment(
            bus,
            fromStop,
            toStop,
            duration));
      }
    }

    log.info("Route graph built with {} nodes in {}ms", graph.getNodeCount(), System.currentTimeMillis() - startTime);
    return graph;
  }

  /**
   * BFS to find all paths from source to destination with limited transfers.
   */
  private List<RoutePath> findPaths(RouteGraph graph, Long fromLocationId, Long toLocationId, int maxTransfers) {
    List<RoutePath> validPaths = new ArrayList<>();

    // BFS state: (currentLocationId, path so far, buses used)
    Queue<PathState> queue = new LinkedList<>();
    queue.add(new PathState(fromLocationId, new ArrayList<>(), new HashSet<>()));

    // Track visited states to avoid cycles (location + number of transfers)
    Map<String, Integer> visited = new HashMap<>();

    while (!queue.isEmpty()) {
      PathState state = queue.poll();

      // Check if we've reached the destination
      if (state.currentLocationId.equals(toLocationId) && !state.segments.isEmpty()) {
        validPaths.add(new RoutePath(new ArrayList<>(state.segments)));
        continue;
      }

      // Don't explore further if we've exceeded max transfers
      int currentTransfers = countTransfers(state.segments);
      if (currentTransfers > maxTransfers) {
        continue;
      }

      // Create a state key for cycle detection
      String stateKey = state.currentLocationId + "-" + currentTransfers;
      Integer previousTransfers = visited.get(stateKey);
      if (previousTransfers != null && previousTransfers <= currentTransfers) {
        continue;
      }
      visited.put(stateKey, currentTransfers);

      // Explore outgoing edges
      List<BusSegment> outgoingSegments = graph.getOutgoingEdges(state.currentLocationId);
      for (BusSegment segment : outgoingSegments) {
        // Skip if this would create a cycle in our path
        if (hasLocationInPath(state.segments, segment.toStop.location().id().value())) {
          continue;
        }

        // Check transfer validity (wait time between buses)
        if (!state.segments.isEmpty()) {
          BusSegment lastSegment = state.segments.get(state.segments.size() - 1);
          if (!isValidTransfer(lastSegment, segment)) {
            continue;
          }
        }

        // Add this segment and continue BFS
        List<BusSegment> newPath = new ArrayList<>(state.segments);
        newPath.add(segment);

        Set<Long> newBusesUsed = new HashSet<>(state.busesUsed);
        newBusesUsed.add(segment.bus.id().value());

        queue.add(new PathState(
            segment.toStop.location().id().value(),
            newPath,
            newBusesUsed));
      }
    }

    return validPaths;
  }

  /**
   * Check if a location is already visited in the current path
   */
  private boolean hasLocationInPath(List<BusSegment> segments, Long locationId) {
    for (BusSegment segment : segments) {
      if (segment.fromStop.location().id().value().equals(locationId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Count the number of transfers in a path.
   * A transfer occurs when switching from one bus to another.
   */
  private int countTransfers(List<BusSegment> segments) {
    if (segments.size() <= 1)
      return 0;

    int transfers = 0;
    Long previousBusId = null;

    for (BusSegment segment : segments) {
      Long currentBusId = segment.bus.id().value();
      if (previousBusId != null && !previousBusId.equals(currentBusId)) {
        transfers++;
      }
      previousBusId = currentBusId;
    }

    return transfers;
  }

  /**
   * Check if a transfer between two bus segments is valid.
   * Transfer is valid if:
   * 1. The arrival of first bus is before departure of second
   * 2. Wait time is between MIN and MAX transfer wait times
   */
  private boolean isValidTransfer(BusSegment arriving, BusSegment departing) {
    // If same bus, no transfer needed
    if (arriving.bus.id().value().equals(departing.bus.id().value())) {
      return true;
    }

    LocalTime arrivalTime = arriving.toStop.arrivalTime();
    LocalTime departureTime = departing.fromStop.departureTime();

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
      double totalDistance = 0.0;

      // Group consecutive segments by bus
      List<List<BusSegment>> groupedByBus = groupSegmentsByBus(path.segments);

      for (List<BusSegment> busSegments : groupedByBus) {
        if (busSegments.isEmpty())
          continue;

        BusSegment firstSegment = busSegments.get(0);
        BusSegment lastSegment = busSegments.get(busSegments.size() - 1);
        Bus bus = firstSegment.bus;

        // Calculate leg duration
        int legDuration = busSegments.stream()
            .mapToInt(s -> s.duration)
            .sum();
        totalDuration += legDuration;

        // Create leg DTO
        LegDTO leg = new LegDTO(
            bus.id().value(),
            bus.name(),
            bus.number(),
            firstSegment.fromStop.id() != null ? firstSegment.fromStop.id().value() : null,
            lastSegment.toStop.id() != null ? lastSegment.toStop.id().value() : null,
            convertStopToDTO(firstSegment.fromStop),
            convertStopToDTO(lastSegment.toStop),
            firstSegment.fromStop.departureTime() != null ? firstSegment.fromStop.departureTime().toString() : null,
            lastSegment.toStop.arrivalTime() != null ? lastSegment.toStop.arrivalTime().toString() : null,
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
  private List<List<BusSegment>> groupSegmentsByBus(List<BusSegment> segments) {
    List<List<BusSegment>> groups = new ArrayList<>();
    if (segments.isEmpty())
      return groups;

    List<BusSegment> currentGroup = new ArrayList<>();
    Long currentBusId = null;

    for (BusSegment segment : segments) {
      Long segmentBusId = segment.bus.id().value();

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

  // Inner classes for graph representation

  /**
   * Represents a segment of a bus route between two stops
   */
  private record BusSegment(Bus bus, Stop fromStop, Stop toStop, int duration) {
  }

  /**
   * State for BFS traversal
   */
  private record PathState(Long currentLocationId, List<BusSegment> segments, Set<Long> busesUsed) {
  }

  /**
   * A complete route path
   */
  private record RoutePath(List<BusSegment> segments) {
  }

  /**
   * Graph structure for route finding
   */
  private static class RouteGraph {
    private final Map<Long, List<BusSegment>> adjacencyList = new HashMap<>();

    void addEdge(Long fromLocationId, Long toLocationId, BusSegment segment) {
      adjacencyList.computeIfAbsent(fromLocationId, k -> new ArrayList<>()).add(segment);
    }

    List<BusSegment> getOutgoingEdges(Long locationId) {
      return adjacencyList.getOrDefault(locationId, List.of());
    }

    int getNodeCount() {
      return adjacencyList.size();
    }
  }
}
