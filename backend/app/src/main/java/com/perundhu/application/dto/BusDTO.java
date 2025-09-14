package com.perundhu.application.dto;

import java.time.LocalTime;

/**
 * DTO for Bus information using Java 17 record
 */
public record BusDTO(
                Long id,
                String name,
                String busNumber,
                String fromLocationName,
                String toLocationName,
                LocalTime departureTime,
                LocalTime arrivalTime,
                Integer capacity,
                String category,
                Boolean active) {

        /**
         * Compact constructor for validation and default values
         */
        public BusDTO {
                // Set default values if null
                category = category != null ? category : "Regular";
                active = active != null ? active : true;
        }

        /**
         * Factory method for creating BusDTO with default values
         */
        public static BusDTO createDefault() {
                return new BusDTO(null, null, null, null, null, null, null, null, "Regular", true);
        }

        /**
         * Factory method for partial construction with required fields only
         */
        public static BusDTO of(Long id, String name, String busNumber,
                        String fromLocationName, String toLocationName) {
                return new BusDTO(id, name, busNumber, fromLocationName, toLocationName,
                                null, null, null, "Regular", true);
        }

        /**
         * Factory method with basic timing information
         */
        public static BusDTO withTimes(Long id, String name, String busNumber,
                        String fromLocationName, String toLocationName,
                        LocalTime departureTime, LocalTime arrivalTime) {
                return new BusDTO(id, name, busNumber, fromLocationName, toLocationName,
                                departureTime, arrivalTime, null, "Regular", true);
        }

        /**
         * Factory method with full bus information including capacity, category, and
         * active status
         */
        public static BusDTO withTimes(Long id, String name, String busNumber,
                        String fromLocationName, String toLocationName,
                        LocalTime departureTime, LocalTime arrivalTime,
                        Integer capacity, String category, Boolean active) {
                return new BusDTO(id, name, busNumber, fromLocationName, toLocationName,
                                departureTime, arrivalTime, capacity, category, active);
        }

        /**
         * Create a copy with updated fields using Java 17 record features
         */
        public BusDTO withId(Long newId) {
                return new BusDTO(newId, name, busNumber, fromLocationName, toLocationName,
                                departureTime, arrivalTime, capacity, category, active);
        }

        public BusDTO withName(String newName) {
                return new BusDTO(id, newName, busNumber, fromLocationName, toLocationName,
                                departureTime, arrivalTime, capacity, category, active);
        }

        public BusDTO withTimes(LocalTime newDepartureTime, LocalTime newArrivalTime) {
                return new BusDTO(id, name, busNumber, fromLocationName, toLocationName,
                                newDepartureTime, newArrivalTime, capacity, category, active);
        }

        public BusDTO withActive(Boolean newActive) {
                return new BusDTO(id, name, busNumber, fromLocationName, toLocationName,
                                departureTime, arrivalTime, capacity, category, newActive);
        }
}