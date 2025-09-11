package com.perundhu.domain.port;

import com.perundhu.domain.model.RouteContribution;
import java.util.List;
import java.util.Optional;

/**
 * Port interface for route contribution operations
 */
public interface RouteContributionPort {

  /**
   * Find all route contributions
   * 
   * @return List of all route contributions
   */
  List<RouteContribution> findAllRouteContributions();

  /**
   * Find route contributions by status
   * 
   * @param status The status to filter by
   * @return List of route contributions with the specified status
   */
  List<RouteContribution> findRouteContributionsByStatus(String status);

  /**
   * Find route contribution by ID
   * 
   * @param id The contribution ID
   * @return The route contribution if found
   */
  Optional<RouteContribution> findRouteContributionById(String id);

  /**
   * Save a route contribution
   * 
   * @param contribution The contribution to save
   * @return The saved contribution
   */
  RouteContribution saveRouteContribution(RouteContribution contribution);

  /**
   * Delete a route contribution
   * 
   * @param id The ID of the contribution to delete
   */
  void deleteRouteContribution(String id);
}