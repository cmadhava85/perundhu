package com.perundhu.domain.model;

/**
 * Domain entity representing a location (city or town) using Java 17 record
 */
public record Location(
        LocationId id,
        String name,
        String nameLocalLanguage,
        Double latitude,
        Double longitude) {
    /**
     * Constructor with validation
     */
    public Location {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Location name cannot be null or empty");
        }
    }

    // Traditional getter methods for compatibility
    public LocationId getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getNameLocalLanguage() {
        return nameLocalLanguage;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    /**
     * Factory method to create a location reference by ID
     */
    public static Location reference(Long id) {
        return new Location(new LocationId(id), "Reference", null, null, null);
    }

    /**
     * Factory method to create a location with coordinates
     */
    public static Location withCoordinates(LocationId id, String name, Double latitude, Double longitude) {
        return new Location(id, name, null, latitude, longitude);
    }

    /**
     * Check if location has valid coordinates
     */
    public boolean hasValidCoordinates() {
        return latitude != null && longitude != null &&
                latitude >= -90.0 && latitude <= 90.0 &&
                longitude >= -180.0 && longitude <= 180.0;
    }

    /**
     * Get entity ID for translation purposes
     */
    public String getEntityId() {
        return id != null ? id.value().toString() : null;
    }

    /**
     * Get entity type for translation purposes
     */
    public String getEntityType() {
        return "LOCATION";
    }

}
