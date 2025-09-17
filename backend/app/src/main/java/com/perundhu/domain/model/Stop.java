package com.perundhu.domain.model;

import java.time.LocalTime;
import java.util.List;

/**
 * Domain entity representing a bus stop using Java 17 record
 */
public record Stop(
        StopId id,
        String name,
        Location location,
        LocalTime arrivalTime,
        LocalTime departureTime,
        int sequence,
        List<String> features) {
    /**
     * Constructor with validation
     */
    public Stop {
        // Allow null id for new stops that haven't been persisted yet
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Stop name cannot be null or empty");
        }
        if (sequence < 0) {
            throw new IllegalArgumentException("Stop sequence cannot be negative");
        }
        if (features == null) {
            features = List.of();
        }
    }

    // Traditional getter methods for compatibility
    public StopId getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Location getLocation() {
        return location;
    }

    public LocalTime getArrivalTime() {
        return arrivalTime;
    }

    public LocalTime getDepartureTime() {
        return departureTime;
    }

    public int getSequence() {
        return sequence;
    }

    public List<String> getFeatures() {
        return features;
    }

    /**
     * Factory method to create a stop with minimal information
     */
    public static Stop create(StopId id, String name, Location location) {
        return new Stop(id, name, location, null, null, 0, List.of());
    }

    /**
     * Factory method to create a stop with timing information
     */
    public static Stop create(StopId id, String name, Location location, LocalTime arrivalTime, LocalTime departureTime,
            int sequence) {
        return new Stop(id, name, location, arrivalTime, departureTime, sequence, List.of());
    }

    /**
     * Get stop order (alias for sequence for backward compatibility)
     */
    public int getStopOrder() {
        return sequence;
    }
}