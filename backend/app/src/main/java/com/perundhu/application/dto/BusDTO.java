package com.perundhu.application.dto;

import java.time.LocalTime;

import com.perundhu.domain.model.Bus;

/**
 * Data Transfer Object for Bus information
 * Using Java 17 record feature for immutability and conciseness
 */
public record BusDTO(
                Long id,
                String name,
                String busNumber,
                String fromLocation,
                String toLocation,
                LocalTime departureTime,
                LocalTime arrivalTime,
                String category // Added category field
) {
        /**
         * Static factory method to create a DTO from the domain model
         * This follows best practices for Java 17 by using a static factory method for
         * conversion
         */
        public static BusDTO fromDomain(Bus bus) {
                return new BusDTO(
                                bus.getId().value(),
                                bus.getName(),
                                bus.getBusNumber(),
                                bus.getFromLocation().name(),
                                bus.getToLocation().name(),
                                bus.getDepartureTime(),
                                bus.getArrivalTime(),
                                bus.getCategory());
        }

        /**
         * Builder pattern adapter for records
         * Java 17 records don't natively support the builder pattern, so this provides
         * compatibility
         */
        public static Builder builder() {
                return new Builder();
        }

        /**
         * Builder class for BusDTO
         */
        public static class Builder {
                private Long id;
                private String name;
                private String busNumber;
                private String fromLocation;
                private String toLocation;
                private LocalTime departureTime;
                private LocalTime arrivalTime;
                private String category;

                public Builder id(Long id) {
                        this.id = id;
                        return this;
                }

                public Builder name(String name) {
                        this.name = name;
                        return this;
                }

                public Builder busNumber(String busNumber) {
                        this.busNumber = busNumber;
                        return this;
                }

                public Builder fromLocation(String fromLocation) {
                        this.fromLocation = fromLocation;
                        return this;
                }

                public Builder toLocation(String toLocation) {
                        this.toLocation = toLocation;
                        return this;
                }

                public Builder departureTime(LocalTime departureTime) {
                        this.departureTime = departureTime;
                        return this;
                }

                public Builder arrivalTime(LocalTime arrivalTime) {
                        this.arrivalTime = arrivalTime;
                        return this;
                }

                public Builder category(String category) {
                        this.category = category;
                        return this;
                }

                public BusDTO build() {
                        return new BusDTO(id, name, busNumber, fromLocation, toLocation, departureTime, arrivalTime,
                                        category);
                }
        }
}