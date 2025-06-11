package com.perundhu.application.dto;

import java.time.LocalTime;

/**
 * Data Transfer Object for bus arrival time estimation
 */
public record EstimatedArrivalDTO(
    Long busId,
    String busNumber,
    String routeName,
    String currentLocation,
    String destination,
    LocalTime scheduledArrival,
    LocalTime estimatedArrival,
    Integer delayMinutes
) {}