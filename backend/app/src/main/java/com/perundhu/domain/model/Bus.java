package com.perundhu.domain.model;

import java.time.LocalTime;
import java.util.List;

/**
 * Domain entity representing a bus in the transit system using Java 17 record
 */
public record Bus(
        BusId id,
        String number,
        String name,
        String operator,
        String type,
        Location fromLocation,
        Location toLocation,
        LocalTime departureTime,
        LocalTime arrivalTime,
        Integer capacity,
        List<String> features,
        Boolean active) {
    /**
     * Constructor with validation
     */
    public Bus {
        if (id == null) {
            throw new IllegalArgumentException("Bus ID cannot be null");
        }
        if (number == null || number.trim().isEmpty()) {
            throw new IllegalArgumentException("Bus number cannot be null or empty");
        }
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Bus name cannot be null or empty");
        }
        if (features == null) {
            features = List.of();
        }
        if (capacity == null) {
            capacity = 50; // Default bus capacity
        }
        if (active == null) {
            active = true; // Default to active
        }
    }

    /**
     * Backward-compatible constructor without active field
     */
    public Bus(BusId id, String number, String name, String operator, String type,
            Location fromLocation, Location toLocation, LocalTime departureTime,
            LocalTime arrivalTime, Integer capacity, List<String> features) {
        this(id, number, name, operator, type, fromLocation, toLocation,
                departureTime, arrivalTime, capacity, features, true);
    }

    // With-methods for immutable updates
    public Bus withDepartureTime(LocalTime newDepartureTime) {
        return new Bus(id, number, name, operator, type, fromLocation, toLocation,
                newDepartureTime, arrivalTime, capacity, features, active);
    }

    public Bus withArrivalTime(LocalTime newArrivalTime) {
        return new Bus(id, number, name, operator, type, fromLocation, toLocation,
                departureTime, newArrivalTime, capacity, features, active);
    }

    public Bus withActive(Boolean newActive) {
        return new Bus(id, number, name, operator, type, fromLocation, toLocation,
                departureTime, arrivalTime, capacity, features, newActive);
    }

    // Traditional getter methods for compatibility
    public BusId getId() {
        return id;
    }

    public String getNumber() {
        return number;
    }

    public String getName() {
        return name;
    }

    public String getOperator() {
        return operator;
    }

    public String getType() {
        return type;
    }

    public Location getFromLocation() {
        return fromLocation;
    }

    public Location getToLocation() {
        return toLocation;
    }

    public LocalTime getDepartureTime() {
        return departureTime;
    }

    public LocalTime getArrivalTime() {
        return arrivalTime;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public List<String> getFeatures() {
        return features;
    }

    public Boolean getActive() {
        return active;
    }

    public String getBusNumber() {
        return number;
    } // Alias for backward compatibility

    public String busNumber() {
        return number;
    } // Record-style alias

    public String category() {
        return type;
    } // Alias for JPA entity compatibility

    /**
     * Factory method to create a bus with minimal information
     */
    public static Bus create(BusId id, String number, String name) {
        return new Bus(id, number, name, "Unknown", "Standard", null, null, null, null, 50, List.of());
    }

    /**
     * Factory method to create a bus with operator information
     */
    public static Bus create(BusId id, String number, String name, String operator, String type) {
        return new Bus(id, number, name, operator, type, null, null, null, null, 50, List.of());
    }

    /**
     * Factory method to create a bus with route information
     */
    public static Bus create(BusId id, String number, String name, Location fromLocation, Location toLocation,
            LocalTime departureTime, LocalTime arrivalTime) {
        return new Bus(id, number, name, "Unknown", "Standard", fromLocation, toLocation, departureTime, arrivalTime,
                50, List.of());
    }

    /**
     * Factory method to create a complete bus
     */
    public static Bus create(BusId id, String number, String name, String operator, String type, Location fromLocation,
            Location toLocation, LocalTime departureTime, LocalTime arrivalTime, Integer capacity) {
        return new Bus(id, number, name, operator, type, fromLocation, toLocation, departureTime, arrivalTime, capacity,
                List.of());
    }
}
