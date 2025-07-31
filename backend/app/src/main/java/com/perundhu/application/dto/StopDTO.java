package com.perundhu.application.dto;

import java.time.LocalTime;

/**
 * Data Transfer Object for Bus Stop information
 */
public record StopDTO(
    String name,
    String originalName,
    LocalTime arrivalTime,
    LocalTime departureTime,
    Integer stopOrder
) {}