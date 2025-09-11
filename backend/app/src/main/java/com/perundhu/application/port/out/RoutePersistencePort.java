package com.perundhu.application.port.out;

import com.perundhu.domain.model.RouteContribution;

/**
 * Port for route persistence operations
 */
public interface RoutePersistencePort {

  /**
   * Create a new route from an approved route contribution
   * 
   * @param contribution The approved route contribution
   */
  void createRouteFromContribution(RouteContribution contribution);
}