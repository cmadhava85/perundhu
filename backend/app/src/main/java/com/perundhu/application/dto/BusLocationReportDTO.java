package com.perundhu.application.dto;

import jakarta.validation.constraints.*;
import org.springframework.lang.Nullable;

/**
 * DTO for bus location reports submitted by users
 * Validates geographic coordinates, accuracy, and other location metrics
 */
public record BusLocationReportDTO(
        @NotNull(message = "Bus ID is required")
        Long busId,
        
        @Nullable
        Long stopId, // Optional, null if reporting en-route
        
        @NotBlank(message = "User ID is required")
        String userId, // Anonymous ID to track user contributions
        
        @NotBlank(message = "Timestamp is required")
        String timestamp,
        
        @NotNull(message = "Latitude is required")
        @DecimalMin(value = "-90", message = "Latitude must be between -90 and 90")
        @DecimalMax(value = "90", message = "Latitude must be between -90 and 90")
        double latitude,
        
        @NotNull(message = "Longitude is required")
        @DecimalMin(value = "-180", message = "Longitude must be between -180 and 180")
        @DecimalMax(value = "180", message = "Longitude must be between -180 and 180")
        double longitude,
        
        @Min(value = 0, message = "Accuracy must be non-negative")
        double accuracy, // Location accuracy in meters
        
        @Min(value = 0, message = "Speed must be non-negative")
        double speed, // Speed in meters per second
        
        @Min(value = 0, message = "Heading must be between 0 and 360")
        @Max(value = 360, message = "Heading must be between 0 and 360")
        double heading, // Direction in degrees (0-360)
        
        @Size(max = 500, message = "Device info cannot exceed 500 characters")
        String deviceInfo // Information about the reporting device
) {
    /**
     * Compact constructor for validation
     * Ensures coordinates are valid before object creation
     */
    public BusLocationReportDTO {
        if (latitude < -90 || latitude > 90) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
        if (accuracy < 0) {
            throw new IllegalArgumentException("Accuracy must be non-negative");
        }
        if (speed < 0) {
            throw new IllegalArgumentException("Speed must be non-negative");
        }
        if (heading < 0 || heading > 360) {
            throw new IllegalArgumentException("Heading must be between 0 and 360 degrees");
        }
    }
    // Records automatically provide accessor methods named after the fields:
    // busId(), stopId(), userId(), timestamp(), latitude(), longitude(), etc.

    // Adding traditional getter methods for compatibility
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
