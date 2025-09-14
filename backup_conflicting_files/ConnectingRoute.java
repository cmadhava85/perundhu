package com.perundhu.domain.model;

import java.util.List;

/**
 * Domain model for connecting routes between locations
 * Represents a route that may require one or more bus transfers
 */
public record ConnectingRoute(
    Long id,
    Location fromLocation,
    Location toLocation,
    String connectionPoint,
    Integer waitTime, // in minutes
    Integer totalDuration, // in minutes
    Double totalDistance, // in kilometers
    List<BusLeg> legs,
    Integer transfers) {

  /**
   * Represents a single leg of a connecting route
   */
  public record BusLeg(
      Bus bus,
      Stop fromStop,
      Stop toStop,
      String departureTime,
      String arrivalTime,
      Integer duration, // in minutes
      Double distance // in kilometers
  ) {
  }

  /**
   * Factory method to create a direct route (no transfers)
   */
  public static ConnectingRoute createDirect(
      Long id,
      Location fromLocation,
      Location toLocation,
      Bus bus,
      Stop fromStop,
      Stop toStop,
      String departureTime,
      String arrivalTime,
      Integer duration,
      Double distance) {
    BusLeg leg = new BusLeg(bus, fromStop, toStop, departureTime, arrivalTime, duration, distance);
    return new ConnectingRoute(
        id,
        fromLocation,
        toLocation,
        null, // no connection point for direct routes
        0, // no wait time
        duration,
        distance,
        List.of(leg),
        0 // no transfers
    );
  }

  /**
   * Factory method to create a connecting route with one transfer
   */
  public static ConnectingRoute createWithTransfer(
      Long id,
      Location fromLocation,
      Location toLocation,
      String connectionPoint,
      BusLeg firstLeg,
      BusLeg secondLeg,
      Integer waitTime) {
    Integer totalDuration = firstLeg.duration() + secondLeg.duration() + waitTime;
    Double totalDistance = (firstLeg.distance() != null ? firstLeg.distance() : 0.0) +
        (secondLeg.distance() != null ? secondLeg.distance() : 0.0);

    return new ConnectingRoute(
        id,
        fromLocation,
        toLocation,
        connectionPoint,
        waitTime,
        totalDuration,
        totalDistance,
        List.of(firstLeg, secondLeg),
        1 // one transfer
    );
  }

  /**
   * Check if this is a direct route (no transfers)
   */
  public boolean isDirect() {
    return transfers == 0;
  }

  /**
   * Get the first leg of the journey
   */
  public BusLeg getFirstLeg() {
    return legs.isEmpty() ? null : legs.get(0);
  }

  /**
   * Get the last leg of the journey
   */
  public BusLeg getLastLeg() {
    return legs.isEmpty() ? null : legs.get(legs.size() - 1);
  }
}