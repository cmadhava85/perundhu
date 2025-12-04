package com.perundhu.application.dto;

import java.util.List;

/**
 * Data Transfer Object for connecting routes between locations.
 * Represents a route that may require one or more bus transfers.
 */
public record ConnectingRouteDTO(
    String id,
    Long fromLocationId,
    Long toLocationId,
    LocationDTO fromLocation,
    LocationDTO toLocation,
    List<LegDTO> legs,
    Integer totalDuration,
    Double totalDistance,
    Integer transfers) {

  /**
   * Represents a single leg of a connecting route
   */
  public record LegDTO(
      Long busId,
      String busName,
      String busNumber,
      Long fromStopId,
      Long toStopId,
      StopDTO fromStop,
      StopDTO toStop,
      String departureTime,
      String arrivalTime,
      Integer duration,
      Double distance) {
  }

  /**
   * Create a direct route (no transfers) - convenience factory method
   */
  public static ConnectingRouteDTO createDirect(
      String id,
      LocationDTO fromLocation,
      LocationDTO toLocation,
      LegDTO leg) {
    return new ConnectingRouteDTO(
        id,
        fromLocation.id(),
        toLocation.id(),
        fromLocation,
        toLocation,
        List.of(leg),
        leg.duration(),
        leg.distance(),
        0);
  }
}
