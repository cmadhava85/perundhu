package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Bus location history domain model using Java 17 record for immutability and reduced boilerplate
 */
public record BusLocationHistory(
    BusLocationHistoryId id,
    Bus bus,
    Location location,
    LocalDateTime timestamp,
    Double speed,
    Double heading
) {

    /**
     * Value object for BusLocationHistory ID using Java 17 record
     */
    public record BusLocationHistoryId(UUID value) {
        public BusLocationHistoryId {
            if (value == null) {
                throw new IllegalArgumentException("BusLocationHistoryId value cannot be null");
            }
        }
        
        public static BusLocationHistoryId generate() {
            return new BusLocationHistoryId(UUID.randomUUID());
        }
    }

    /**
     * Factory method to create new location history entry with generated ID and current timestamp
     */
    public static BusLocationHistory createFrom(Bus bus, Location location, Double speed, Double heading) {
        return new BusLocationHistory(
            BusLocationHistoryId.generate(),
            bus,
            location,
            LocalDateTime.now(),
            speed,
            heading
        );
    }

    /**
     * Check if the bus is moving (speed > 0)
     */
    public boolean isMoving() {
        return speed != null && speed > 0;
    }

    /**
     * Get cardinal direction based on heading
     */
    public String getCardinalDirection() {
        if (heading == null) return "Unknown";

        return switch ((int) (heading / 45) % 8) {
            case 0, 8 -> "North";
            case 1 -> "Northeast";
            case 2 -> "East";
            case 3 -> "Southeast";
            case 4 -> "South";
            case 5 -> "Southwest";
            case 6 -> "West";
            case 7 -> "Northwest";
            default -> "Unknown";
        };
    }

    /**
     * Check if this location entry is recent (within the last 5 minutes)
     */
    public boolean isRecent() {
        if (timestamp == null) return false;
        return timestamp.isAfter(LocalDateTime.now().minusMinutes(5));
    }

    /**
     * Get speed category for better reporting
     */
    public String getSpeedCategory() {
        if (speed == null || speed <= 0) return "Stationary";
        if (speed < 10) return "Slow";
        if (speed < 30) return "Moderate";
        if (speed < 60) return "Fast";
        return "Very Fast";
    }
}
