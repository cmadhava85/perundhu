package com.perundhu.application.service;

import java.time.LocalTime;
import java.util.List;

import com.perundhu.application.dto.ConnectingRouteDTO;

/**
 * Service interface for finding connecting routes between locations.
 * Implements Dijkstra's algorithm for optimal multi-transfer routes.
 */
public interface ConnectingRouteService {

  /**
   * Find connecting routes between two locations.
   * Uses Dijkstra's algorithm to find routes with optimal transfers.
   * 
   * @param fromLocationId The starting location ID
   * @param toLocationId   The destination location ID
   * @param maxTransfers   Maximum number of transfers allowed (default: 2)
   * @return List of connecting routes sorted by weighted cost (duration +
   *         transfers)
   */
  List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId, int maxTransfers);

  /**
   * Find connecting routes with default max transfers (2)
   */
  default List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId) {
    return findConnectingRoutes(fromLocationId, toLocationId, 2);
  }

  /**
   * Find connecting routes departing after a specific time.
   * Filters routes to only include buses departing after the given time.
   * 
   * @param fromLocationId The starting location ID
   * @param toLocationId   The destination location ID
   * @param departureAfter Only include routes departing after this time
   * @param maxTransfers   Maximum number of transfers allowed
   * @return List of connecting routes sorted by departure time, then duration
   */
  default List<ConnectingRouteDTO> findConnectingRoutes(
      Long fromLocationId,
      Long toLocationId,
      LocalTime departureAfter,
      int maxTransfers) {
    // Default implementation filters after finding all routes
    return findConnectingRoutes(fromLocationId, toLocationId, maxTransfers).stream()
        .filter(route -> {
          if (route.legs() == null || route.legs().isEmpty())
            return false;
          // Java 21 Sequenced Collections - getFirst()
          String depTime = route.legs().getFirst().departureTime();
          if (depTime == null)
            return true;
          try {
            LocalTime routeDeparture = LocalTime.parse(depTime);
            return routeDeparture.isAfter(departureAfter) || routeDeparture.equals(departureAfter);
          } catch (Exception e) {
            return true;
          }
        })
        .toList();
  }

  /**
   * Route optimization criteria for sorting results
   */
  enum OptimizationCriteria {
    FASTEST, // Minimize total travel time
    CHEAPEST, // Minimize total fare (when available)
    LEAST_TRANSFERS, // Minimize number of changes
    BALANCED // Balance between time, transfers, and comfort
  }
}
