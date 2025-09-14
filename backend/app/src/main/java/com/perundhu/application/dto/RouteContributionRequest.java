package com.perundhu.application.dto;

import java.util.List;

/**
 * Request DTO for route contributions using Java 17 record
 */
public record RouteContributionRequest(
    String userId,
    String busNumber,
    String busName,
    String fromLocationName,
    String toLocationName,
    String sourceLanguage,
    Double fromLatitude,
    Double fromLongitude,
    Double toLatitude,
    Double toLongitude,
    String departureTime,
    String arrivalTime,
    String scheduleInfo,
    String additionalNotes,
    List<StopContributionRequest> stops) {
  /**
   * Nested record for stop contribution requests
   */
  public record StopContributionRequest(
      String name,
      Double latitude,
      Double longitude,
      String arrivalTime,
      String departureTime,
      Integer stopOrder) {
  }
}