package com.perundhu.domain.model;

import java.time.LocalTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Stop domain model using Java 17 record for immutability and reduced
 * boilerplate
 * Removed Lombok dependency in favor of native Java 17 features
 */
public record Stop(
        StopId id,
        String name,
        Bus bus,
        Location location,
        LocalTime arrivalTime,
        LocalTime departureTime,
        Integer stopOrder) implements Translatable<Stop> {

    // Using ConcurrentHashMap for thread safety without ThreadLocal (which could
    // lead to memory leaks)
    private static final Map<Long, Map<Integer, Boolean>> busStopOrders = new ConcurrentHashMap<>();

    // Value object for Stop ID using Java 17 record
    public record StopId(Long value) {
        public StopId {
            if (value == null || value <= 0) {
                throw new IllegalArgumentException("StopId value must be positive");
            }
        }
    }

    // Compact constructor for validation using Java 17 features
    public Stop {
        // Thread-safe implementation using ConcurrentHashMap
        if (bus != null && bus.getId() != null && stopOrder != null) {
            Long busId = bus.getId().value();

            busStopOrders.computeIfAbsent(busId, k -> new ConcurrentHashMap<>());

            if (busStopOrders.get(busId).containsKey(stopOrder)) {
                throw new IllegalArgumentException("Stop order " + stopOrder + " already exists for bus " + busId);
            }

            // Register this stop order
            busStopOrders.get(busId).put(stopOrder, true);
        }

        // Validation using Java 17 pattern matching and modern null checks
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Stop name cannot be null or blank");
        }

        if (stopOrder != null && stopOrder < 0) {
            throw new IllegalArgumentException("Stop order cannot be negative");
        }

        if (arrivalTime != null && departureTime != null && arrivalTime.isAfter(departureTime)) {
            throw new IllegalArgumentException("Arrival time cannot be after departure time");
        }
    }

    // Adding traditional getter methods for backward compatibility with existing
    // code

    /**
     * Get the ID (traditional getter for backward compatibility)
     * 
     * @return The ID of this stop
     */
    public StopId getId() {
        return id;
    }

    /**
     * Get the name (traditional getter for backward compatibility)
     * 
     * @return The name of this stop
     */
    public String getName() {
        return name;
    }

    /**
     * Get the bus (traditional getter for backward compatibility)
     * 
     * @return The bus associated with this stop
     */
    public Bus getBus() {
        return bus;
    }

    /**
     * Get the location (traditional getter for backward compatibility)
     * 
     * @return The location of this stop
     */
    public Location getLocation() {
        return location;
    }

    /**
     * Get the arrival time (traditional getter for backward compatibility)
     * 
     * @return The arrival time at this stop
     */
    public LocalTime getArrivalTime() {
        return arrivalTime;
    }

    /**
     * Get the departure time (traditional getter for backward compatibility)
     * 
     * @return The departure time from this stop
     */
    public LocalTime getDepartureTime() {
        return departureTime;
    }

    /**
     * Get the stop order (traditional getter for backward compatibility)
     * 
     * @return The order of this stop in the route
     */
    public Integer getStopOrder() {
        return stopOrder;
    }

    /**
     * Factory method to create a new Stop using Java 17 features
     * Replaces the Builder pattern with a cleaner factory approach
     */
    public static Stop create(String name, Bus bus, Location location,
            LocalTime arrivalTime, LocalTime departureTime, Integer stopOrder) {
        return new Stop(null, name, bus, location, arrivalTime, departureTime, stopOrder);
    }

    /**
     * Factory method to create a Stop with ID (for existing entities)
     */
    public static Stop createWithId(StopId id, String name, Bus bus, Location location,
            LocalTime arrivalTime, LocalTime departureTime, Integer stopOrder) {
        return new Stop(id, name, bus, location, arrivalTime, departureTime, stopOrder);
    }

    // Builder pattern for compatibility with existing code
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder class for creating Stop instances
     * Added for backward compatibility with existing code
     */
    public static class Builder {
        private StopId id;
        private String name;
        private Bus bus;
        private Location location;
        private LocalTime arrivalTime;
        private LocalTime departureTime;
        private Integer stopOrder;

        public Builder id(StopId id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder bus(Bus bus) {
            this.bus = bus;
            return this;
        }

        public Builder location(Location location) {
            this.location = location;
            return this;
        }

        public Builder arrivalTime(LocalTime arrivalTime) {
            this.arrivalTime = arrivalTime;
            return this;
        }

        public Builder departureTime(LocalTime departureTime) {
            this.departureTime = departureTime;
            return this;
        }

        public Builder stopOrder(Integer stopOrder) {
            this.stopOrder = stopOrder;
            return this;
        }

        public Stop build() {
            return new Stop(id, name, bus, location, arrivalTime, departureTime, stopOrder);
        }
    }

    /**
     * Create a copy with updated fields using Java 17 record features
     * This replaces builder methods like withName(), withStopOrder(), etc.
     */
    public Stop withName(String newName) {
        return new Stop(this.id, newName, this.bus, this.location,
                this.arrivalTime, this.departureTime, this.stopOrder);
    }

    public Stop withStopOrder(Integer newStopOrder) {
        return new Stop(this.id, this.name, this.bus, this.location,
                this.arrivalTime, this.departureTime, newStopOrder);
    }

    public Stop withTimes(LocalTime newArrivalTime, LocalTime newDepartureTime) {
        return new Stop(this.id, this.name, this.bus, this.location,
                newArrivalTime, newDepartureTime, this.stopOrder);
    }

    public Stop withBus(Bus newBus) {
        return new Stop(this.id, this.name, newBus, this.location,
                this.arrivalTime, this.departureTime, this.stopOrder);
    }

    public Stop withLocation(Location newLocation) {
        return new Stop(this.id, this.name, this.bus, newLocation,
                this.arrivalTime, this.departureTime, this.stopOrder);
    }

    /**
     * Reset the stop order tracking (for tests and between transactions)
     */
    public static void resetStopOrders() {
        busStopOrders.clear();
    }

    /**
     * Remove tracking for a specific bus (when a bus is deleted)
     * This helps prevent memory leaks by cleaning up unnecessary references
     */
    public static void clearBusStopOrders(Long busId) {
        busStopOrders.remove(busId);
    }

    @Override
    public String getEntityType() {
        return "stop";
    }

    @Override
    public Long getEntityId() {
        return id != null ? id.value() : null;
    }

    @Override
    public String getDefaultValue(String fieldName) {
        return switch (fieldName) {
            case "name" -> name != null ? name : "";
            case "stopOrder" -> stopOrder != null ? stopOrder.toString() : "0";
            default -> "";
        };
    }

    /**
     * Check if this stop has valid timing
     */
    public boolean hasValidTiming() {
        return arrivalTime != null && departureTime != null &&
                !arrivalTime.isAfter(departureTime);
    }

    /**
     * Get the duration between arrival and departure using Java 17 features
     */
    public java.time.Duration getStopDuration() {
        if (arrivalTime == null || departureTime == null) {
            return java.time.Duration.ZERO;
        }
        return java.time.Duration.between(arrivalTime, departureTime);
    }

    /**
     * Adds a translation for the specified field
     * Implementation of the Translatable interface
     *
     * @param fieldName    The field name to translate
     * @param languageCode The language code for the translation
     * @param value        The translated value
     * @return The created translation object
     */
    @Override
    public Translation addTranslation(String fieldName, String languageCode, String value) {
        return new Translation(
                getEntityType(),
                getEntityId(),
                fieldName,
                languageCode,
                value);
    }

    /**
     * Returns the related location for this entity
     * Implementation of the Translatable interface
     *
     * @return The location associated with this stop
     */
    @Override
    public Location getRelatedLocation() {
        return location;
    }
}
