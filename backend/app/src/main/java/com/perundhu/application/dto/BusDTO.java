package com.perundhu.application.dto;

import java.util.Map;
import java.util.stream.Collectors;

import com.perundhu.domain.model.Bus;

/**
 * Data Transfer Object for Bus entities
 * Using Java 17 record for immutability and concise data container
 */
public record BusDTO(
                Long id,
                String number,
                String name,
                String operator,
                String type,
                String departureTime,
                String arrivalTime,
                Double rating,
                Map<String, String> features) {
        // Records automatically provide constructor, getters, equals, hashCode, and
        // toString

        /**
         * Factory method to create BusDTO from domain Bus entity
         */
        public static BusDTO fromDomain(Bus bus) {
                if (bus == null) {
                        return null;
                }

                // Convert List<String> features to Map<String, String>
                Map<String, String> featuresMap = bus.getFeatures() != null ? bus.getFeatures().stream()
                                .collect(Collectors.toMap(
                                                feature -> feature,
                                                feature -> "enabled",
                                                (existing, replacement) -> existing))
                                : Map.of();

                return new BusDTO(
                                bus.id().value(),
                                bus.number(),
                                bus.name(),
                                bus.operator(),
                                bus.type(),
                                bus.getDepartureTime() != null ? bus.getDepartureTime().toString() : null,
                                bus.getArrivalTime() != null ? bus.getArrivalTime().toString() : null,
                                4.0, // Default rating
                                featuresMap);
        }

        /**
         * Factory method for creating basic BusDTO instances for backward compatibility
         */
        public static BusDTO of(Long id, String number, String name, String operator, String type) {
                return new BusDTO(id, number, name, operator, type, null, null, 4.0, Map.of());
        }
}