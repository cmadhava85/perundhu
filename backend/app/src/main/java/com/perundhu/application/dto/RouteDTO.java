package com.perundhu.application.dto;

import java.time.LocalTime;
import java.util.List;

/**
 * DTO for route information using Java 17 record
 */
public record RouteDTO(
    Long id,
    String name,
    String description,
    List<StopDTO> stops,
    String fromLocation,
    String toLocation,
    LocalTime departureTime,
    LocalTime arrivalTime,
    String category,
    boolean active) {
  /**
   * Compact constructor for validation and immutability
   */
  public RouteDTO {
    stops = stops != null ? List.copyOf(stops) : List.of();
  }

  /**
   * Factory method for backward compatibility
   */
  public static Builder builder() {
    return new Builder();
  }

  /**
   * Builder class for backward compatibility
   */
  public static class Builder {
    private Long id;
    private String name;
    private String description;
    private List<StopDTO> stops;
    private String fromLocation;
    private String toLocation;
    private LocalTime departureTime;
    private LocalTime arrivalTime;
    private String category;
    private boolean active = true;

    public Builder id(Long id) {
      this.id = id;
      return this;
    }

    public Builder name(String name) {
      this.name = name;
      return this;
    }

    public Builder description(String description) {
      this.description = description;
      return this;
    }

    public Builder stops(List<StopDTO> stops) {
      this.stops = stops;
      return this;
    }

    public Builder fromLocation(String fromLocation) {
      this.fromLocation = fromLocation;
      return this;
    }

    public Builder toLocation(String toLocation) {
      this.toLocation = toLocation;
      return this;
    }

    public Builder departureTime(LocalTime departureTime) {
      this.departureTime = departureTime;
      return this;
    }

    public Builder arrivalTime(LocalTime arrivalTime) {
      this.arrivalTime = arrivalTime;
      return this;
    }

    public Builder category(String category) {
      this.category = category;
      return this;
    }

    public Builder active(boolean active) {
      this.active = active;
      return this;
    }

    public RouteDTO build() {
      return new RouteDTO(id, name, description, stops, fromLocation, toLocation,
          departureTime, arrivalTime, category, active);
    }
  }
}