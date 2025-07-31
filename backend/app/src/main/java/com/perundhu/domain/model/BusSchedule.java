package com.perundhu.domain.model;

import java.time.LocalTime;

/**
 * Bus schedule domain model using Java 17 record for immutability and reduced boilerplate
 */
public record BusSchedule(
    BusScheduleId id,
    String busNumber,
    Location origin,
    Location destination,
    LocalTime departureTime,
    LocalTime arrivalTime
) {

    /**
     * Value object for BusSchedule ID using Java 17 record
     */
    public record BusScheduleId(Long value) {
        public BusScheduleId {
            if (value == null) {
                throw new IllegalArgumentException("BusScheduleId value cannot be null");
            }
        }
    }
}

