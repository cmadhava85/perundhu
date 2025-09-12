package com.perundhu.domain.model;

import java.time.LocalTime;
import java.util.List;
import java.util.ArrayList;

import lombok.Value;
import lombok.Builder;
import lombok.AllArgsConstructor;

@Value
@Builder
@AllArgsConstructor
public class Bus implements Translatable<Bus> {
    BusId id;
    String name;
    String busNumber;
    Location fromLocation;
    Location toLocation;
    LocalTime departureTime;
    LocalTime arrivalTime;
    Integer capacity;
    String category;
    @Builder.Default
    List<Stop> stops = new ArrayList<>();
    @Builder.Default
    List<Translation> translations = new ArrayList<>();
    @Builder.Default
    Boolean active = true;

    /**
     * Constructor for backward compatibility with tests
     * Uses default values for new fields
     */
    public Bus(BusId id, String name, String busNumber, Location fromLocation, Location toLocation,
            LocalTime departureTime, LocalTime arrivalTime) {
        this(id, name, busNumber, fromLocation, toLocation, departureTime, arrivalTime,
                50, "Regular", new ArrayList<>(), new ArrayList<>(), true);
    }

    /**
     * Constructor with capacity for backward compatibility
     */
    public Bus(BusId id, String name, String busNumber, Location fromLocation, Location toLocation,
            LocalTime departureTime, LocalTime arrivalTime, Integer capacity) {
        this(id, name, busNumber, fromLocation, toLocation, departureTime, arrivalTime,
                capacity, "Regular", new ArrayList<>(), new ArrayList<>(), true);
    }

    public String getCategory() {
        return category != null ? category : "Regular";
    }

    public boolean isActive() {
        return active != null ? active : true;
    }

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

    @Value
    @Builder
    public static class BusId {
        Long value;

        public BusId(Long value) {
            this.value = value;
        }
    }
}