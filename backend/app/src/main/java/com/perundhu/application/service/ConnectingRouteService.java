package com.perundhu.application.service;

import java.util.List;

import com.perundhu.application.dto.ConnectingRouteDTO;

/**
 * Service interface for finding connecting routes between locations.
 * Implements graph-based algorithms to find multi-transfer routes.
 */
public interface ConnectingRouteService {

  /**
   * Find connecting routes between two locations.
   * Uses BFS algorithm to find routes with 0-2 transfers.
   * 
   * @param fromLocationId The starting location ID
   * @param toLocationId   The destination location ID
   * @param maxTransfers   Maximum number of transfers allowed (default: 2)
   * @return List of connecting routes sorted by total duration
   */
  List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId, int maxTransfers);

  /**
   * Find connecting routes with default max transfers (2)
   */
  default List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId) {
    return findConnectingRoutes(fromLocationId, toLocationId, 2);
  }
}
