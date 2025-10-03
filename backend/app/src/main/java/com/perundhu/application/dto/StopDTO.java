package com.perundhu.application.dto;

import java.time.LocalTime;
import java.util.Map;

/**
 * Data Transfer Object for Stop entities
 * Using Java 17 record for immutability and concise data container
 * Includes location coordinates for map display
 */
public record StopDTO(
        Long id,
        String name,
        Long locationId,
        LocalTime arrivalTime,
        LocalTime departureTime,
        int sequence,
        Map<String, String> features,
        Double latitude,
        Double longitude) {
    // Records automatically provide constructor, getters, equals, hashCode, and
    // toString
}