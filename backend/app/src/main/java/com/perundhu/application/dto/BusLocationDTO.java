package com.perundhu.application.dto;

import lombok.Data;

/**
 * DTO representing the current location of a bus
 */
@Data
public class BusLocationDTO {
    private Long busId;
    private String busName;
    private String busNumber;
    private String fromLocation;
    private String toLocation;
    private double latitude;
    private double longitude;
    private double speed; // Speed in meters per second
    private double heading; // Direction in degrees
    private String timestamp;
    private String lastReportedStopName;
    private String nextStopName;
    private String estimatedArrivalTime;
    private int reportCount; // Number of users currently reporting this bus location
    private int confidenceScore; // Score between 1-100 indicating confidence in location accuracy
}