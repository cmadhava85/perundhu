package com.perundhu.application.dto;

/**
 * Request DTO for bus location reporting
 */
public record BusLocationRequest(
    Long busId,
    Long stopId,
    String userId,
    String timestamp,
    double latitude,
    double longitude,
    double accuracy,
    double speed,
    double heading,
    String deviceInfo) {
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