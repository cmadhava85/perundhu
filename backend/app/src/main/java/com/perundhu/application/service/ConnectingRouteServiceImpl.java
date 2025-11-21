package com.perundhu.application.service;

import com.perundhu.domain.service.ConnectingRouteService;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.ConnectingRoute;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.port.StopRepository;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalTime;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of ConnectingRouteService for finding routes between locations
 * Uses Breadth-First Search (BFS) to find shortest paths with transfers
 */
@Service
public class ConnectingRouteServiceImpl implements ConnectingRouteService {

  private static final Logger log = LoggerFactory.getLogger(ConnectingRouteServiceImpl.class);
  private static final int MAX_ROUTES_TO_RETURN = 10;
  private static final double AVERAGE_BUS_SPEED_KMH = 50.0;
  private static final double DEFAULT_KM_PER_STOP = 25.0;

  private final StopRepository stopRepository;

  public ConnectingRouteServiceImpl(StopRepository stopRepository) {
    this.stopRepository = stopRepository;
  }

  @Override
  public List<List<Bus>> findConnectingRoutes(List<Bus> buses, Location from, Location to) {
    return findConnectingRoutes(buses, from, to, 2); // Default max depth of 2 transfers
  }

  @Override
  public List<List<Bus>> findConnectingRoutes(List<Bus> buses, Location from, Location to, int maxDepth) {
    log.info("Finding connecting routes from {} to {} with max depth {}", from.name(), to.name(), maxDepth);

    // Build graph and find paths
    Map<Long, Set<BusRoute>> locationGraph = buildLocationGraph(buses);
    List<List<BusRoute>> allPaths = findAllPaths(
        locationGraph,
        from.id().value(),
        to.id().value(),
        maxDepth);

    // Convert BusRoute paths to Bus paths
    List<List<Bus>> busPaths = allPaths.stream()
        .map(path -> path.stream()
            .map(route -> route.bus)
            .collect(Collectors.toList()))
        .collect(Collectors.toList());

    log.info("Found {} connecting routes", busPaths.size());
    return busPaths;
  }

  @Override
  public List<ConnectingRoute> findConnectingRoutesDetailed(
      List<Bus> allBuses,
      Location fromLocation,
      Location toLocation,
      String languageCode) {
    return findConnectingRoutesDetailed(allBuses, fromLocation, toLocation, languageCode, 2);
  }

  @Override
  public List<ConnectingRoute> findConnectingRoutesDetailed(
      List<Bus> allBuses,
      Location fromLocation,
      Location toLocation,
      String languageCode,
      Integer maxDepth) {

    log.info("Finding detailed connecting routes from {} to {} with max depth {}",
        fromLocation.name(), toLocation.name(), maxDepth);

    if (maxDepth == null)
      maxDepth = 2; // Default: allow 1 transfer (2 buses)

    // Build location graph from buses and stops
    Map<Long, Set<BusRoute>> locationGraph = buildLocationGraph(allBuses);

    // Find all possible routes using BFS
    List<List<BusRoute>> allPaths = findAllPaths(
        locationGraph,
        fromLocation.id().value(),
        toLocation.id().value(),
        maxDepth);

    log.info("Found {} paths before conversion", allPaths.size());

    // Convert to ConnectingRoute domain objects
    List<ConnectingRoute> routes = allPaths.stream()
        .map(path -> createConnectingRoute(path, fromLocation, toLocation))
        .filter(Objects::nonNull)
        .sorted(Comparator
            .comparingInt(ConnectingRoute::transfers)
            .thenComparing(route -> route.departureTime() != null ? route.departureTime() : LocalTime.MAX))
        .limit(MAX_ROUTES_TO_RETURN)
        .collect(Collectors.toList());

    log.info("Returning {} detailed connecting routes", routes.size());
    return routes;
  }

  /**
   * Build a graph where each location connects to other locations via buses
   */
  private Map<Long, Set<BusRoute>> buildLocationGraph(List<Bus> allBuses) {
    Map<Long, Set<BusRoute>> graph = new HashMap<>();

    for (Bus bus : allBuses) {
      try {
        // Get all stops for this bus, ordered
        List<Stop> busStops = stopRepository.findByBusIdOrderByStopOrder(bus.getId().value());

        // For each pair of stops, create edges (bus can take you from any stop to any
        // later stop)
        for (int i = 0; i < busStops.size() - 1; i++) {
          Stop fromStop = busStops.get(i);

          for (int j = i + 1; j < busStops.size(); j++) {
            Stop toStop = busStops.get(j);

            Long fromLocId = fromStop.location().id().value();
            Long toLocId = toStop.location().id().value();

            BusRoute route = new BusRoute(
                bus,
                fromLocId,
                toLocId,
                fromStop,
                toStop,
                j - i // Number of stops between
            );

            graph.computeIfAbsent(fromLocId, k -> new HashSet<>()).add(route);
          }
        }

        // Also add direct from/to route (main route without intermediate stops
        // consideration)
        if (bus.getFromLocation() != null && bus.getToLocation() != null) {
          Long fromId = bus.getFromLocation().id().value();
          Long toId = bus.getToLocation().id().value();

          if (!fromId.equals(toId)) {
            BusRoute directRoute = new BusRoute(
                bus,
                fromId,
                toId,
                null,
                null,
                0);
            graph.computeIfAbsent(fromId, k -> new HashSet<>()).add(directRoute);
          }
        }
      } catch (Exception e) {
        log.warn("Error processing bus {} for graph building: {}", bus.getId().value(), e.getMessage());
      }
    }

    log.debug("Built location graph with {} locations", graph.size());
    return graph;
  }

  /**
   * Find all paths from origin to destination using Breadth-First Search (BFS)
   * BFS naturally finds shortest paths first
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

    int shortestPathLength = Integer.MAX_VALUE;

    while (!queue.isEmpty()) {
      PathNode current = queue.poll();

      // Check if we reached destination
      if (current.locationId.equals(toLocationId)) {
        allPaths.add(new ArrayList<>(current.path));
        shortestPathLength = Math.min(shortestPathLength, current.path.size());
        continue; // Found a path, continue searching for alternatives
      }

      // Check depth limit
      if (current.path.size() >= maxDepth) {
        continue; // Too many transfers
      }

      // Optimization: Skip if this path is already longer than shortest found
      if (current.path.size() >= shortestPathLength) {
        continue;
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
        newVisited.add(current.locationId); // Mark current as visited

        queue.offer(new PathNode(nextLocationId, newPath, newVisited));
      }
    }

    // Sort by number of buses (fewer transfers first), then by total duration
    allPaths.sort(Comparator
        .comparingInt(List<BusRoute>::size)
        .thenComparingDouble(path -> path.stream().mapToDouble(this::estimateDuration).sum()));

    log.debug("Found {} total paths from location {} to {}", allPaths.size(), fromLocationId, toLocationId);
    return allPaths;
  }

  /**
   * Create ConnectingRoute domain object from path
   */
  private ConnectingRoute createConnectingRoute(
      List<BusRoute> path,
      Location fromLocation,
      Location toLocation) {

    if (path == null || path.isEmpty()) {
      return null;
    }

    // For single bus (direct route), return null - handled by direct search
    if (path.size() == 1) {
      return null;
    }

    try {
      // Collect all buses in the path
      List<Bus> buses = path.stream()
          .map(route -> route.bus)
          .collect(Collectors.toList());

      // Get departure time from first bus
      LocalTime departureTime = buses.get(0).getDepartureTime();

      // Get arrival time from last bus
      LocalTime arrivalTime = buses.get(buses.size() - 1).getArrivalTime();

      // Number of transfers is number of buses minus 1
      int transfers = buses.size() - 1;

      return new ConnectingRoute(
          fromLocation,
          toLocation,
          departureTime,
          arrivalTime,
          transfers,
          buses);
    } catch (Exception e) {
      log.warn("Error creating connecting route: {}", e.getMessage());
      return null;
    }
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

      double minutes = duration.toMinutes();

      // Adjust for partial route (if using stops)
      if (route.stopCount > 0) {
        // Assume proportional time based on stops
        List<Stop> allStops = stopRepository.findByBusIdOrderByStopOrder(bus.getId().value());
        if (!allStops.isEmpty()) {
          double ratio = (double) route.stopCount / allStops.size();
          minutes *= ratio;
        }
      }

      return minutes;
    }

    // Estimate based on distance
    double distance = estimateDistance(route);
    return (distance / AVERAGE_BUS_SPEED_KMH) * 60; // Convert to minutes
  }

  private double estimateDistance(BusRoute route) {
    // If we have stop information, use that
    if (route.fromStop != null && route.toStop != null) {
      // Calculate distance between stops (simplified)
      return route.stopCount * DEFAULT_KM_PER_STOP;
    }

    // Otherwise, estimate based on locations
    Bus bus = route.bus;
    if (bus.getFromLocation() != null && bus.getToLocation() != null) {
      return calculateHaversineDistance(
          bus.getFromLocation().latitude(),
          bus.getFromLocation().longitude(),
          bus.getToLocation().latitude(),
          bus.getToLocation().longitude());
    }

    return DEFAULT_KM_PER_STOP; // Default estimate
  }

  private String estimateWaitTime(Bus firstBus, Bus secondBus) {
    if (firstBus.getArrivalTime() != null && secondBus.getDepartureTime() != null) {
      LocalTime arrival = firstBus.getArrivalTime();
      LocalTime departure = secondBus.getDepartureTime();

      Duration wait = Duration.between(arrival, departure);
      if (wait.isNegative()) {
        wait = wait.plusHours(24); // Next day departure
      }

      long hours = wait.toHours();
      long minutes = wait.toMinutes() % 60;

      if (hours > 0) {
        return String.format("%dh %dm", hours, minutes);
      } else {
        return String.format("%dm", minutes);
      }
    }

    return "30m"; // Default estimate
  }

  private double parseWaitTimeToMinutes(String waitTime) {
    try {
      if (waitTime.contains("h")) {
        String[] parts = waitTime.split("h");
        double hours = Double.parseDouble(parts[0].trim());
        double minutes = 0;
        if (parts.length > 1) {
          minutes = Double.parseDouble(parts[1].replace("m", "").trim());
        }
        return hours * 60 + minutes;
      } else {
        return Double.parseDouble(waitTime.replace("m", "").trim());
      }
    } catch (Exception e) {
      return 30; // Default 30 minutes
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
    final double R = 6371; // Earth radius in kilometers

    double latDistance = Math.toRadians(lat2 - lat1);
    double lonDistance = Math.toRadians(lon2 - lon1);

    double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
        + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Helper classes
  private static class PathNode {
    final Long locationId;
    final List<BusRoute> path;
    final Set<Long> visited;

    PathNode(Long locationId, List<BusRoute> path, Set<Long> visited) {
      this.locationId = locationId;
      this.path = path;
      this.visited = visited;
    }
  }

  private static class BusRoute {
    final Bus bus;
    final Long fromLocationId;
    final Long toLocationId;
    final Stop fromStop;
    final Stop toStop;
    final int stopCount;

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
      if (this == o)
        return true;
      if (!(o instanceof BusRoute))
        return false;
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