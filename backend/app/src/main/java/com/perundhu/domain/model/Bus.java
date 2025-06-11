package com.perundhu.domain.model;

import java.time.LocalTime;

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
    int capacity;  // Added capacity field
    
    /**
     * Constructor for backward compatibility with tests
     * Uses a default capacity value of 50
     */
    public Bus(BusId id, String name, String busNumber, Location fromLocation, Location toLocation, 
               LocalTime departureTime, LocalTime arrivalTime) {
        this(id, name, busNumber, fromLocation, toLocation, departureTime, arrivalTime, 50);
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