package com.perundhu.application.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for bus location reporting
 * Enhanced with Jakarta Validation annotations for input validation
 */
public record BusLocationRequest(
    @NotNull(message = "Bus ID is required") Long busId,

    Long stopId,

    @NotBlank(message = "User ID is required") @Size(max = 100, message = "User ID must be less than 100 characters") String userId,

    @NotBlank(message = "Timestamp is required") String timestamp,

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90") @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90") double latitude,

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180") @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180") double longitude,

    @DecimalMin(value = "0.0", message = "Accuracy must be a positive number") double accuracy,

    @DecimalMin(value = "0.0", message = "Speed must be a positive number") double speed,

    @DecimalMin(value = "0.0", message = "Heading must be between 0 and 360") @DecimalMax(value = "360.0", message = "Heading must be between 0 and 360") double heading,

    @Size(max = 500, message = "Device info must be less than 500 characters") String deviceInfo) {
  // Getter methods for backward compatibility
  public Long getBusId() {
    return busId;
  }

  public Long getStopId() {
    return stopId;
  }

  public String getUserId() {
    return userId;
  }

  public String getTimestamp() {
    return timestamp;
  }

  public double getLatitude() {
    return latitude;
  }

  public double getLongitude() {
    return longitude;
  }

  public double getAccuracy() {
    return accuracy;
  }

  public double getSpeed() {
    return speed;
  }

  public double getHeading() {
    return heading;
  }

  public String getDeviceInfo() {
    return deviceInfo;
  }
}