package com.perundhu.application.dto;

import java.time.LocalTime;

/**
 * Data Transfer Object representing a segment of a bus route
 */
public record BusRouteSegmentDTO(
    Long busId,
    String busName,
    String busNumber,
    String fromLocation,
    String toLocation,
    LocalTime departureTime,
    LocalTime arrivalTime
) {}