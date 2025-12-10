package com.perundhu.application.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for route contributions using Java 17 record
 * Enhanced with Jakarta Validation annotations for input validation
 */
public record RouteContributionRequest(
    @Size(max = 100, message = "User ID must be less than 100 characters") String userId,

    @NotBlank(message = "Bus number is required") @Size(max = 50, message = "Bus number must be less than 50 characters") String busNumber,

    @Size(max = 200, message = "Bus name must be less than 200 characters") String busName,

    @NotBlank(message = "From location name is required") @Size(max = 200, message = "From location name must be less than 200 characters") String fromLocationName,

    @NotBlank(message = "To location name is required") @Size(max = 200, message = "To location name must be less than 200 characters") String toLocationName,

    @Pattern(regexp = "^(en|ta|hi)?$", message = "Source language must be 'en', 'ta', 'hi' or empty") String sourceLanguage,

    Double fromLatitude,
    Double fromLongitude,
    Double toLatitude,
    Double toLongitude,

    @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Departure time must be in HH:mm format") String departureTime,

    @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Arrival time must be in HH:mm format") String arrivalTime,

    @Size(max = 1000, message = "Schedule info must be less than 1000 characters") String scheduleInfo,

    @Size(max = 2000, message = "Additional notes must be less than 2000 characters") String additionalNotes,

    @Valid List<StopContributionRequest> stops) {
  /**
   * Nested record for stop contribution requests
   */
  public record StopContributionRequest(
      @NotBlank(message = "Stop name is required") @Size(max = 200, message = "Stop name must be less than 200 characters") String name,

      Double latitude,
      Double longitude,

      @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Arrival time must be in HH:mm format") String arrivalTime,

      @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Departure time must be in HH:mm format") String departureTime,

      @NotNull(message = "Stop order is required") Integer stopOrder) {
  }
}