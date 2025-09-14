package com.perundhu.application.dto;

import java.util.List;

/**
 * DTO for OSM bus route information using Java 17 record
 */
public record BusRouteDTO(
    long osmId,
    String routeRef,
    String routeName,
    String network,
    String operator,
    String fromLocation,
    String toLocation,
    double relevanceScore,
    List<OSMBusStopDTO> stops,
    String routeType,
    String frequency,
    String operatingHours,
    Double estimatedDuration,
    Double estimatedDistance) {
  /**
   * Compact constructor for validation
   */
  public BusRouteDTO {
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
    private long osmId;
    private String routeRef;
    private String routeName;
    private String network;
    private String operator;
    private String fromLocation;
    private String toLocation;
    private double relevanceScore;
    private List<OSMBusStopDTO> stops;
    private String routeType;
    private String frequency;
    private String operatingHours;
    private Double estimatedDuration;
    private Double estimatedDistance;

    public Builder osmId(long osmId) {
      this.osmId = osmId;
      return this;
    }

    public Builder routeRef(String routeRef) {
      this.routeRef = routeRef;
      return this;
    }

    public Builder routeName(String routeName) {
      this.routeName = routeName;
      return this;
    }

    public Builder network(String network) {
      this.network = network;
      return this;
    }

    public Builder operator(String operator) {
      this.operator = operator;
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

    public Builder relevanceScore(double relevanceScore) {
      this.relevanceScore = relevanceScore;
      return this;
    }

    public Builder stops(List<OSMBusStopDTO> stops) {
      this.stops = stops;
      return this;
    }

    public Builder routeType(String routeType) {
      this.routeType = routeType;
      return this;
    }

    public Builder frequency(String frequency) {
      this.frequency = frequency;
      return this;
    }

    public Builder operatingHours(String operatingHours) {
      this.operatingHours = operatingHours;
      return this;
    }

    public Builder estimatedDuration(Double estimatedDuration) {
      this.estimatedDuration = estimatedDuration;
      return this;
    }

    public Builder estimatedDistance(Double estimatedDistance) {
      this.estimatedDistance = estimatedDistance;
      return this;
    }

    public BusRouteDTO build() {
      return new BusRouteDTO(osmId, routeRef, routeName, network, operator,
          fromLocation, toLocation, relevanceScore, stops,
          routeType, frequency, operatingHours,
          estimatedDuration, estimatedDistance);
    }
  }
}