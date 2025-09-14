package com.perundhu.domain.model;

import java.time.LocalTime;
import java.util.List;

/**
 * Domain model representing a connecting route between two locations
 * using Java 17 record for immutability
 */
public record ConnectingRoute(
    Location from,
    Location to,
    LocalTime departureTime,
    LocalTime arrivalTime,
    int transfers,
    List<Bus> buses) {
  public ConnectingRoute {
    if (from == null) {
      throw new IllegalArgumentException("From location cannot be null");
    }
    if (to == null) {
      throw new IllegalArgumentException("To location cannot be null");
    }
    if (buses == null || buses.isEmpty()) {
      throw new IllegalArgumentException("Buses list cannot be null or empty");
    }
    if (transfers < 0) {
      throw new IllegalArgumentException("Transfers cannot be negative");
    }
  }

  // Convenience getters for backward compatibility
  public Location getFrom() {
    return from;
  }

  public Location getTo() {
    return to;
  }

  public LocalTime getDepartureTime() {
    return departureTime;
  }

  public LocalTime getArrivalTime() {
    return arrivalTime;
  }

  public int getTransfers() {
    return transfers;
  }

  public List<Bus> getBuses() {
    return buses;
  }
}