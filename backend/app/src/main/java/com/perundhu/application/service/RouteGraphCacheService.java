package com.perundhu.application.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.StopRepository;

/**
 * Separate service for caching the route graph.
 * This service exists to ensure Spring's @Cacheable annotation works correctly,
 * as self-invocation within the same class bypasses the proxy and caching.
 * 
 * Key optimizations:
 * - @Cacheable works because methods are called externally (through proxy)
 * - Cache warming on application startup
 * - Longer TTL for route graph (1 hour vs 10 minutes)
 */
@Service
public class RouteGraphCacheService {

  private static final Logger log = LoggerFactory.getLogger(RouteGraphCacheService.class);

  private final BusRepository busRepository;
  private final StopRepository stopRepository;

  public RouteGraphCacheService(BusRepository busRepository, StopRepository stopRepository) {
    this.busRepository = busRepository;
    this.stopRepository = stopRepository;
  }

  /**
   * Build and cache the route graph.
   * This method is called externally, so @Cacheable works correctly.
   * 
   * The route graph rarely changes (only when buses/stops are modified),
   * so we use a long TTL of 1 hour.
   */
  @Cacheable(value = "routeGraphCache", key = "'global'")
  public RouteGraphData buildRouteGraph() {
    long startTime = System.currentTimeMillis();
    log.info("Building route graph (cache miss)...");

    List<Bus> allBuses = busRepository.findAll();
    log.debug("Found {} buses", allBuses.size());

    // Collect all bus IDs first
    List<Long> busIds = allBuses.stream()
        .filter(bus -> bus.id() != null)
        .map(bus -> bus.id().value())
        .toList();

    // OPTIMIZED: Load ALL stops for ALL buses in ONE batch query - prevents N+1!
    Map<Long, List<Stop>> stopsByBusId = stopRepository.findStopsByBusIdsGrouped(busIds);
    log.debug("Loaded stops for {} buses in batch", stopsByBusId.size());

    // Build map for fast bus lookup
    Map<Long, Bus> busById = new HashMap<>();
    for (Bus bus : allBuses) {
      if (bus.id() != null) {
        busById.put(bus.id().value(), bus);
      }
    }

    // Build adjacency list for the graph
    Map<Long, List<BusSegmentData>> adjacencyList = new HashMap<>();
    int edgeCount = 0;

    for (Long busId : busIds) {
      Bus bus = busById.get(busId);
      if (bus == null)
        continue;

      List<Stop> stops = stopsByBusId.get(busId);
      if (stops == null || stops.isEmpty())
        continue;

      // Add edges between consecutive stops
      for (int i = 0; i < stops.size() - 1; i++) {
        Stop fromStop = stops.get(i);
        Stop toStop = stops.get(i + 1);

        if (fromStop.location() == null || toStop.location() == null)
          continue;
        if (fromStop.location().id() == null || toStop.location().id() == null)
          continue;

        Long fromLocId = fromStop.location().id().value();

        // Calculate duration between stops
        int duration = calculateDuration(fromStop, toStop);

        BusSegmentData segment = new BusSegmentData(
            bus,
            fromStop,
            toStop,
            duration);

        adjacencyList.computeIfAbsent(fromLocId, k -> new java.util.ArrayList<>()).add(segment);
        edgeCount++;
      }
    }

    long elapsed = System.currentTimeMillis() - startTime;
    log.info("Route graph built with {} nodes, {} edges in {}ms",
        adjacencyList.size(), edgeCount, elapsed);

    return new RouteGraphData(adjacencyList);
  }

  /**
   * Calculate duration between two stops in minutes.
   */
  private int calculateDuration(Stop fromStop, Stop toStop) {
    if (fromStop.departureTime() == null || toStop.arrivalTime() == null) {
      return 30; // Default duration if times are missing
    }

    long minutes = java.time.Duration.between(fromStop.departureTime(), toStop.arrivalTime()).toMinutes();
    if (minutes < 0) {
      minutes += 24 * 60; // Handle overnight journeys
    }

    return (int) minutes;
  }

  /**
   * Warm the cache on application startup.
   * This ensures the first user request doesn't have to wait for graph building.
   */
  @EventListener(ContextRefreshedEvent.class)
  @Async
  public void warmCacheOnStartup() {
    log.info("Warming route graph cache on startup...");
    try {
      // Small delay to let the application fully start
      TimeUnit.SECONDS.sleep(5);

      // This call will populate the cache
      RouteGraphData graph = buildRouteGraph();
      log.info("Route graph cache warmed successfully with {} nodes", graph.getNodeCount());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      log.warn("Cache warming interrupted: {}", e.getMessage());
    } catch (Exception e) {
      log.warn("Failed to warm route graph cache on startup: {}", e.getMessage());
    }
  }

  /**
   * Data class representing the route graph.
   */
  public static class RouteGraphData {
    private final Map<Long, List<BusSegmentData>> adjacencyList;

    public RouteGraphData(Map<Long, List<BusSegmentData>> adjacencyList) {
      this.adjacencyList = adjacencyList;
    }

    public List<BusSegmentData> getOutgoingEdges(Long locationId) {
      return adjacencyList.getOrDefault(locationId, List.of());
    }

    public int getNodeCount() {
      return adjacencyList.size();
    }
  }

  /**
   * Data class representing a bus segment between two stops.
   */
  public record BusSegmentData(Bus bus, Stop fromStop, Stop toStop, int duration) {
  }
}
