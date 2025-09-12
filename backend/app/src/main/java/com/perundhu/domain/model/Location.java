package com.perundhu.domain.model;

import lombok.Value;
import lombok.Builder;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;

@Value
@Builder
@AllArgsConstructor
public class Location implements Translatable<Location> {
    LocationId id;
    String name;
    Double latitude;
    Double longitude;
    @Builder.Default
    List<Translation> translations = new ArrayList<>();

    /**
     * Constructor for backward compatibility with tests
     * Creates a Location with default empty translations list
     */
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
        translations.add(new Translation(null, getEntityType(), getEntityId(), languageCode, fieldName, value));
    }

    /**
     * Creates a reference location with just an ID
     * Used when we only need the ID to look up the full entity
     * WARNING: This creates a location with null coordinates - should only be used
     * for references
     */
    public static Location reference(Long id) {
        return Location.builder()
                .id(new LocationId(id))
                .name("Reference Location")
                .latitude(null) // Explicitly null instead of 0.0 to indicate missing data
                .longitude(null) // Explicitly null instead of 0.0 to indicate missing data
                .build();
    }

    /**
     * Creates a reference location with proper coordinates
     * Use this when you have the actual coordinate data
     */
    public static Location withCoordinates(Long id, String name, Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude and longitude cannot be null");
        }
        return Location.builder()
                .id(new LocationId(id))
                .name(name)
                .latitude(latitude)
                .longitude(longitude)
                .build();
    }

    /**
     * Check if this location has valid coordinates
     */
    public boolean hasValidCoordinates() {
        return latitude != null && longitude != null &&
                latitude >= -90.0 && latitude <= 90.0 &&
                longitude >= -180.0 && longitude <= 180.0;
    }

    @Value
    @Builder
    public static class LocationId {
        Long value;

        public LocationId(Long value) {
            this.value = value;
        }
    }
}