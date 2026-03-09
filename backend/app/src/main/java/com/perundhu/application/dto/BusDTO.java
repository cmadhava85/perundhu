package com.perundhu.application.dto;

import java.util.Map;
import java.util.stream.Collectors;

import com.perundhu.domain.model.Bus;
import jakarta.validation.constraints.*;
import org.springframework.lang.Nullable;

/**
 * Data Transfer Object for Bus entities
 * Using Java 17 record for immutability and concise data container
 * Enhanced with location information for multilingual support
 * Includes capacity and active status fields for complete bus information
 */
public record BusDTO(
                @NotNull(message = "Bus ID is required")
                Long id,
                
                @NotBlank(message = "Bus number is required")
                String number,
                
                @NotBlank(message = "Bus name is required")
                String name,
                
                @Nullable
                String operator,
                
                @NotBlank(message = "Bus type is required")
                String type,
                
                @Nullable
                String departureTime,
                
                @Nullable
                String arrivalTime,
                
                @Min(value = 0, message = "Rating must be positive")
                @Max(value = 5, message = "Rating must not exceed 5")
                Double rating,
                
                @Nullable
                Map<String, String> features,
                
                // Location information
                @Nullable
                Long fromLocationId,
                
                @Nullable
                String fromLocationName,
                
                @Nullable
                String fromLocationNameTranslated,
                
                @Nullable
                Long toLocationId,
                
                @Nullable
                String toLocationName,
                
                @Nullable
                String toLocationNameTranslated,
                
                @Min(value = 1, message = "Bus capacity must be at least 1")
                @Max(value = 500, message = "Bus capacity must not exceed 500")
                Integer capacity,
                
                @NotNull(message = "Bus active status is required")
                Boolean active,
                
                // Multi-leg journey metadata
                @Nullable
                Boolean isMultiLegJourney,
                
                @Nullable
                Integer legNumber,
                
                @Nullable
                Integer totalLegs,
                
                @Nullable
                String journeyId,
                
                @Nullable
                Long intermediateLocationId,
                
                @Nullable
                String intermediateLocationName,

                // Via-bus metadata: set when this bus passes through the searched destination
                // (i.e., the user searched A→B but this bus goes A→B→C)
                @Nullable
                Boolean isViaBus,

                @Nullable
                String viaThroughLocationName) {
        /**
         * Compact constructor for validation
         */
        public BusDTO {
                // Normalize capacity to avoid runtime failures on bad data
                if (capacity == null || capacity < 1) {
                        capacity = 50; // fallback default
                } else if (capacity > 500) {
                        capacity = 500; // clamp to max
                }

                if (rating != null && (rating < 0 || rating > 5)) {
                        rating = Math.max(0, Math.min(5, rating));
                }
        }
        
        /**
         * Constructor for backward compatibility (without location info and new fields)
         */
        public BusDTO(Long id, String number, String name, String operator, String type,
                      String departureTime, String arrivalTime, Double rating, Map<String, String> features) {
                this(id, number, name, operator, type, departureTime, arrivalTime, rating, features,
                     null, null, null, null, null, null, 50, true,
                     null, null, null, null, null, null, null, null);
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
                Map<String, String> featuresMap = bus.features() != null ? bus.features().stream()
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
                                bus.departureTime() != null ? bus.departureTime().toString() : null,
                                bus.arrivalTime() != null ? bus.arrivalTime().toString() : null,
                                4.0, // Default rating
                                featuresMap,
                                // Location information
                                bus.fromLocation() != null ? bus.fromLocation().id().value() : null,
                                bus.fromLocation() != null ? bus.fromLocation().name() : null,
                                null, // No translation by default
                                bus.toLocation() != null ? bus.toLocation().id().value() : null,
                                bus.toLocation() != null ? bus.toLocation().name() : null,
                                null, // No translation by default
                                bus.capacity(),
                                bus.active(),
                                // Multi-leg journey metadata (null by default)
                                null, null, null, null, null,
                                // Via-bus metadata (null by default)
                                null, null, null);
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
                Map<String, String> featuresMap = bus.features() != null ? bus.features().stream()
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
                                bus.departureTime() != null ? bus.departureTime().toString() : null,
                                bus.arrivalTime() != null ? bus.arrivalTime().toString() : null,
                                4.0, // Default rating
                                featuresMap,
                                // Location information with translations
                                bus.fromLocation() != null ? bus.fromLocation().id().value() : null,
                                bus.fromLocation() != null ? bus.fromLocation().name() : null,
                                fromLocationTranslation,
                                bus.toLocation() != null ? bus.toLocation().id().value() : null,
                                bus.toLocation() != null ? bus.toLocation().name() : null,
                                toLocationTranslation,
                                bus.capacity(),
                                bus.active(),
                                // Multi-leg journey metadata (null by default)
                                null, null, null, null, null,
                                // Via-bus metadata (null by default)
                                null, null, null);
        }

        /**
         * Factory method for creating basic BusDTO instances for backward compatibility
         */
        public static BusDTO of(Long id, String number, String name, String operator, String type) {
                return new BusDTO(id, number, name, operator, type, null, null, 4.0, Map.of(), 
                        null, null, null, null, null, null, 50, true,
                        null, null, null, null, null, null, null, null);
        }

        /**
         * Returns a copy of this BusDTO tagged as a via-bus (bus that passes through
         * the searched destination rather than terminating there).
         *
         * @param throughLocationName the name of the location the bus passes through
         *                            (i.e., the user's searched destination)
         */
        public BusDTO withViaBusTag(String throughLocationName) {
                return new BusDTO(
                        this.id(), this.number(), this.name(), this.operator(), this.type(),
                        this.departureTime(), this.arrivalTime(), this.rating(), this.features(),
                        this.fromLocationId(), this.fromLocationName(), this.fromLocationNameTranslated(),
                        this.toLocationId(), this.toLocationName(), this.toLocationNameTranslated(),
                        this.capacity(), this.active(),
                        this.isMultiLegJourney(), this.legNumber(), this.totalLegs(),
                        this.journeyId(), this.intermediateLocationId(), this.intermediateLocationName(),
                        Boolean.TRUE, throughLocationName);
        }
}