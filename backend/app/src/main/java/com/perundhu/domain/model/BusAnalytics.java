package com.perundhu.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Bus analytics domain model using Java 17 record for immutability and reduced boilerplate
 */
public record BusAnalytics(
    BusAnalyticsId id,
    Bus bus,
    LocalDate date,
    Integer totalPassengers,
    Double averageDelay,
    Double averageSpeed,
    Integer totalTrips,
    Double onTimePerformance,
    Double averageOccupancy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {

    /**
     * Value object for BusAnalytics ID using Java 17 record
     */
    public record BusAnalyticsId(UUID value) {
        public BusAnalyticsId {
            if (value == null) {
                throw new IllegalArgumentException("BusAnalyticsId value cannot be null");
            }
        }

        public static BusAnalyticsId generate() {
            return new BusAnalyticsId(UUID.randomUUID());
        }
    }

    /**
     * Factory method to create new analytics with generated ID and timestamps
     */
    public static BusAnalytics create(
        Bus bus,
        LocalDate date,
        Integer totalPassengers,
        Double averageDelay,
        Double averageSpeed,
        Integer totalTrips,
        Double onTimePerformance,
        Double averageOccupancy
    ) {
        LocalDateTime now = LocalDateTime.now();
        return new BusAnalytics(
            BusAnalyticsId.generate(),
            bus,
            date,
            totalPassengers,
            averageDelay,
            averageSpeed,
            totalTrips,
            onTimePerformance,
            averageOccupancy,
            now,
            now
        );
    }
}
