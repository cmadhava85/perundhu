package com.perundhu.application.dto;

import java.util.Map;
import java.util.stream.Collectors;

import com.perundhu.domain.model.Bus;

/**
 * Data Transfer Object for Bus entities
 * Using Java 17 record for immutability and concise data container
 * Enhanced with location information for multilingual support
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
                Map<String, String> features,
                // Location information
                Long fromLocationId,
                String fromLocationName,
                String fromLocationNameTranslated,
                Long toLocationId,
                String toLocationName,
                String toLocationNameTranslated) {
        // Records automatically provide constructor, getters, equals, hashCode, and
        // toString
        
        /**
         * Constructor for backward compatibility (without location info)
         */
        public BusDTO(Long id, String number, String name, String operator, String type,
                      String departureTime, String arrivalTime, Double rating, Map<String, String> features) {
                this(id, number, name, operator, type, departureTime, arrivalTime, rating, features,
                     null, null, null, null, null, null);
        }

        /**
         * Factory method to create BusDTO from domain Bus entity
         * Without translated location names (English only)
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
                                featuresMap,
                                // Location information
                                bus.fromLocation() != null ? bus.fromLocation().id().value() : null,
                                bus.fromLocation() != null ? bus.fromLocation().name() : null,
                                null, // No translation by default
                                bus.toLocation() != null ? bus.toLocation().id().value() : null,
                                bus.toLocation() != null ? bus.toLocation().name() : null,
                                null); // No translation by default
        }
        
        /**
         * Factory method to create BusDTO from domain Bus entity with translations
         * @param bus The bus domain entity
         * @param fromLocationTranslation Tamil translation of from location (optional)
         * @param toLocationTranslation Tamil translation of to location (optional)
         */
        public static BusDTO fromDomainWithTranslations(Bus bus, String fromLocationTranslation, String toLocationTranslation) {
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
                                featuresMap,
                                // Location information with translations
                                bus.fromLocation() != null ? bus.fromLocation().id().value() : null,
                                bus.fromLocation() != null ? bus.fromLocation().name() : null,
                                fromLocationTranslation,
                                bus.toLocation() != null ? bus.toLocation().id().value() : null,
                                bus.toLocation() != null ? bus.toLocation().name() : null,
                                toLocationTranslation);
        }

        /**
         * Factory method for creating basic BusDTO instances for backward compatibility
         */
        public static BusDTO of(Long id, String number, String name, String operator, String type) {
                return new BusDTO(id, number, name, operator, type, null, null, 4.0, Map.of());
        }
}