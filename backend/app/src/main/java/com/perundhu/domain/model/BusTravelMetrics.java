package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Bus travel metrics domain model using Java 17 record for immutability and reduced boilerplate
 */
public record BusTravelMetrics(
    BusTravelMetricsId id,
    Bus bus,
    Location fromLocation,
    Location toLocation,
    LocalDateTime timestamp,
    Double speed,
    Integer occupancy,
    Integer delayMinutes,
    Boolean isOnTime,
    Integer durationMinutes,
    Integer passengerCount,
    LocalDateTime createdAt
) {

    /**
     * Value object for BusTravelMetrics ID using Java 17 record
     */
    public record BusTravelMetricsId(UUID value) {
        public BusTravelMetricsId {
            if (value == null) {
                throw new IllegalArgumentException("BusTravelMetricsId value cannot be null");
            }
        }

        public static BusTravelMetricsId generate() {
            return new BusTravelMetricsId(UUID.randomUUID());
        }
    }

    /**
     * Factory method to create new travel metrics with generated ID and timestamps
     */
    public static BusTravelMetrics create(
            Bus bus,
            Location fromLocation,
            Location toLocation,
            Double speed,
            Integer occupancy,
            Integer delayMinutes,
            Boolean isOnTime,
            Integer durationMinutes) {

        LocalDateTime now = LocalDateTime.now();
        Integer passengerCount = occupancy != null && bus.capacity() > 0
            ? (int) (occupancy * bus.capacity() / 100.0)
            : null;

        return new BusTravelMetrics(
            BusTravelMetricsId.generate(),
            bus,
            fromLocation,
            toLocation,
            now,
            speed,
            occupancy,
            delayMinutes,
            isOnTime,
            durationMinutes,
            passengerCount,
            now
        );
    }

    /**
     * Check if the journey is delayed beyond acceptable threshold
     */
    public boolean isSignificantlyDelayed() {
        return delayMinutes != null && delayMinutes > 15;
    }

    /**
     * Calculate efficiency score based on speed and occupancy
     */
    public double getEfficiencyScore() {
        if (speed == null || occupancy == null) return 0.0;

        double speedScore = Math.min(speed / 60.0, 1.0); // Normalize to max 60 km/h
        double occupancyScore = Math.min(occupancy / 100.0, 1.0); // Normalize to 100%

        return (speedScore + occupancyScore) / 2.0;
    }
}

