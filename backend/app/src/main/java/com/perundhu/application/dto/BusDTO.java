package com.perundhu.application.dto;

import java.time.LocalTime;

/**
 * Data Transfer Object for Bus information
 */
public record BusDTO(
    Long id,
    String name,
    String busNumber,
    String fromLocation,
    String toLocation,
    LocalTime departureTime,
    LocalTime arrivalTime
) {}