package com.perundhu.domain.model;

/**
 * Domain entity representing a location (city, town, or village) using Java 17
 * record
 * Enhanced to support duplicate village names near different cities/towns
 */
public record Location(
        LocationId id,
        String name,
        String nameLocalLanguage,
        Double latitude,
        Double longitude,
        String district,
        String nearbyCity) {

    /**
     * Constructor with validation (backward compatible - without
     * district/nearbyCity)
     */
    public Location(LocationId id, String name, String nameLocalLanguage, Double latitude, Double longitude) {
        this(id, name, nameLocalLanguage, latitude, longitude, null, null);
    }

    /**
     * Full constructor with validation
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

    public String getDistrict() {
        return district;
    }

    public String getNearbyCity() {
        return nearbyCity;
    }

    /**
     * Get display name with disambiguation info
     */
    public String getDisplayName() {
        if (nearbyCity != null && !nearbyCity.isBlank()) {
            return name + " (near " + nearbyCity + ")";
        }
        if (district != null && !district.isBlank()) {
            return name + ", " + district;
        }
        return name;
    }

    /**
     * Factory method to create a location reference by ID
     */
    public static Location reference(Long id) {
        return new Location(new LocationId(id), "Reference", null, null, null, null, null);
    }

    /**
     * Factory method to create a location with coordinates
     */
    public static Location withCoordinates(LocationId id, String name, Double latitude, Double longitude) {
        return new Location(id, name, null, latitude, longitude, null, null);
    }

    /**
     * Factory method to create a location with district info for disambiguation
     */
    public static Location withDistrict(LocationId id, String name, Double latitude, Double longitude,
            String district, String nearbyCity) {
        return new Location(id, name, null, latitude, longitude, district, nearbyCity);
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
     * Check if this location needs disambiguation (has district or nearby city
     * info)
     */
    public boolean needsDisambiguation() {
        return (district != null && !district.isBlank()) ||
                (nearbyCity != null && !nearbyCity.isBlank());
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
