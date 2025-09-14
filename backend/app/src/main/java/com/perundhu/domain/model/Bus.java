package com.perundhu.domain.model;

import java.time.LocalTime;

/**
 * Bus domain model using Java 17 record for immutability and reduced
 * boilerplate
 * Converted from Lombok @Value to native Java 17 features
 */
public record Bus(
        BusId id,
        String name,
        String busNumber,
        Location fromLocation,
        Location toLocation,
        LocalTime departureTime,
        LocalTime arrivalTime,
        Integer capacity,
        String category,
        Boolean active) implements Translatable<Bus> {

    /**
     * Compact constructor for validation and default values
     */
    public Bus {
        if (id == null) {
            throw new IllegalArgumentException("Bus ID cannot be null");
        }
        category = category != null ? category : "Regular";
        active = active != null ? active : true;
    }

    /**
     * Value object for Bus ID using Java 17 record
     */
    public record BusId(Long value) {
        public BusId {
            if (value == null) {
                throw new IllegalArgumentException("BusId value cannot be null");
            }
        }

        public Long getValue() {
            return value;
        }
    }

    // Translatable implementation
    @Override
    public String getEntityType() {
        return "bus";
    }

    @Override
    public Long getEntityId() {
        return id.getValue();
    }

    @Override
    public String getDefaultValue(String fieldName) {
        if ("name".equals(fieldName)) {
            return name;
        }
        return null;
    }

    /**
     * Add translation for a field - required by Translatable interface
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

    // Convenience methods for default values
    public String getCategory() {
        return category != null ? category : "Regular";
    }

    public boolean isActive() {
        return active != null && active;
    }

    public Boolean getActive() {
        return active;
    }

    /**
     * Convenience getter methods for compatibility with existing code
     */
    public BusId getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getBusNumber() {
        return busNumber;
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

    /**
     * Factory methods for creating Bus instances without Builder pattern
     */
    public static Bus create(BusId id, String name, String busNumber,
            Location fromLocation, Location toLocation,
            LocalTime departureTime, LocalTime arrivalTime) {
        return new Bus(id, name, busNumber, fromLocation, toLocation,
                departureTime, arrivalTime, null, "Regular", true);
    }

    public static Bus withDetails(BusId id, String name, String busNumber,
            Location fromLocation, Location toLocation,
            LocalTime departureTime, LocalTime arrivalTime,
            Integer capacity, String category, Boolean active) {
        return new Bus(id, name, busNumber, fromLocation, toLocation,
                departureTime, arrivalTime, capacity, category, active);
    }

    /**
     * Builder pattern for backward compatibility with JPA entities
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private BusId id;
        private String name;
        private String busNumber;
        private Location fromLocation;
        private Location toLocation;
        private LocalTime departureTime;
        private LocalTime arrivalTime;
        private Integer capacity;
        private String category;
        private Boolean active;

        public Builder id(BusId id) {
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

        public Builder fromLocation(Location fromLocation) {
            this.fromLocation = fromLocation;
            return this;
        }

        public Builder toLocation(Location toLocation) {
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

        public Builder capacity(Integer capacity) {
            this.capacity = capacity;
            return this;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder active(Boolean active) {
            this.active = active;
            return this;
        }

        public Bus build() {
            return new Bus(id, name, busNumber, fromLocation, toLocation,
                    departureTime, arrivalTime, capacity, category, active);
        }
    }
}