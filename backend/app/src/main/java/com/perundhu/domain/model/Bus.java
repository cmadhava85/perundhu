package com.perundhu.domain.model;

import java.time.LocalTime;

import lombok.Value;

@Value
public class Bus implements Translatable<Bus> {
    BusId id;
    String name;
    String busNumber;
    Location fromLocation;
    Location toLocation;
    LocalTime departureTime;
    LocalTime arrivalTime;
    
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
    public static class BusId {
        Long value;
    }
}