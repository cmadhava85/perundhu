package com.perundhu.application.dto;

import java.time.LocalTime;

/**
 * Data Transfer Object for Bus Schedule information
 */
public record BusScheduleDTO(
        Long id,
        String name,
        String translatedName,
        String busNumber,
        String fromLocation,
        String fromLocationTranslated,
        String toLocation,
        String toLocationTranslated,
        LocalTime departureTime,
        LocalTime arrivalTime) {
    /**
     * Convenience methods for backward compatibility
     */
    public String fromLocationName() {
        return fromLocation;
    }

    public String toLocationName() {
        return toLocation;
    }
}