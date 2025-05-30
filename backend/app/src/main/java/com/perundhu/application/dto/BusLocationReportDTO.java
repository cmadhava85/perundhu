package com.perundhu.application.dto;

import lombok.Data;

/**
 * DTO for bus location reports submitted by users
 */
@Data
public class BusLocationReportDTO {
    private Long busId;
    private Long stopId; // Optional, null if reporting en-route
    private String userId; // Anonymous ID to track user contributions
    private String timestamp;
    private double latitude;
    private double longitude;
    private double accuracy; // Location accuracy in meters
    private double speed; // Speed in meters per second
    private double heading; // Direction in degrees
    private String deviceInfo; // Information about the reporting device
}