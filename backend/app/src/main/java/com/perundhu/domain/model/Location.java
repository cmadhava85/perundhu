package com.perundhu.domain.model;

import lombok.Value;
import java.util.ArrayList;
import java.util.List;

@Value
public class Location implements Translatable<Location> {
    LocationId id;
    String name;
    Double latitude;
    Double longitude;
    List<Translation> translations;
    
    public Location(LocationId id, String name, Double latitude, Double longitude) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.translations = new ArrayList<>();
    }
    
    @Override
    public String getEntityType() {
        return "location";
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
    
    @Override
    public void addTranslation(String fieldName, String languageCode, String value) {
        // Since this is an immutable class (@Value), we can't modify the translations list directly
        // But we can add to it as it's initialized as a mutable ArrayList
        translations.add(new Translation(null, getEntityType(), getEntityId(), languageCode, fieldName, value));
    }
    
    /**
     * Creates a reference location with just an ID
     * Used when we only need the ID to look up the full entity
     */
    public static Location reference(Long id) {
        return new Location(
            new LocationId(id),
            "Reference Location", // Placeholder name
            0.0,  // Placeholder latitude
            0.0   // Placeholder longitude
        );
    }
    
    @Value
    public static class LocationId {
        Long value;
    }
}