package com.perundhu.application.dto;

/**
 * DTO for bus location reports submitted by users
 */
public record BusLocationReportDTO(
    Long busId,
    Long stopId, // Optional, null if reporting en-route
    String userId, // Anonymous ID to track user contributions
    String timestamp,
    double latitude,
    double longitude,
    double accuracy, // Location accuracy in meters
    double speed, // Speed in meters per second
    double heading, // Direction in degrees
    String deviceInfo // Information about the reporting device
) {
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

    /**
     * Static factory method to create a BusLocationReportDTO
     */
    public static BusLocationReportDTO create(
            Long busId, Long stopId, String userId, String timestamp,
            double latitude, double longitude, double accuracy,
            double speed, double heading, String deviceInfo) {
        return new BusLocationReportDTO(
            busId, stopId, userId, timestamp, latitude, longitude,
            accuracy, speed, heading, deviceInfo);
    }
}
