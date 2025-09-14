package com.perundhu.domain.model;

/**
 * Location domain model using Java 17 record for immutability and reduced
 * boilerplate
 * Converted from Lombok @Value to native Java 17 features
 */
public record Location(
        LocationId id,
        String name,
        Double latitude,
        Double longitude) implements Translatable<Location> {

    /**
     * Compact constructor for validation
     */
    public Location {
        if (latitude != null && (latitude < -90.0 || latitude > 90.0)) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (longitude != null && (longitude < -180.0 || longitude > 180.0)) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
    }

    /**
     * Factory method to create a Location reference with just an ID
     * Used for creating references without full location data
     */
    public static Location reference(Long locationId) {
        return new Location(new LocationId(locationId), null, null, null);
    }

    /**
     * Factory method to create a Location with coordinates
     */
    public static Location withCoordinates(Long locationId, String name, Double latitude, Double longitude) {
        LocationId id = locationId != null ? new LocationId(locationId) : null;
        return new Location(id, name, latitude, longitude);
    }

    /**
     * Check if this location has valid coordinates
     */
    public boolean hasValidCoordinates() {
        return latitude != null && longitude != null
                && latitude >= -90.0 && latitude <= 90.0
                && longitude >= -180.0 && longitude <= 180.0;
    }

    /**
     * Convenience getter methods for compatibility
     */
    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public LocationId getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    /**
     * Value object for Location ID using Java 17 record
     */
    public record LocationId(Long value) {
        public LocationId {
            if (value == null) {
                throw new IllegalArgumentException("LocationId value cannot be null");
            }
        }

        public Long getValue() {
            return value;
        }
    }

    // Translatable implementation
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

    /**
     * Factory method for backward compatibility with builder pattern
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder class for backward compatibility
     */
    public static class Builder {
        private LocationId id;
        private String name;
        private Double latitude;
        private Double longitude;

        public Builder id(LocationId id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder latitude(Double latitude) {
            this.latitude = latitude;
            return this;
        }

        public Builder longitude(Double longitude) {
            this.longitude = longitude;
            return this;
        }

        public Location build() {
            return new Location(id, name, latitude, longitude);
        }
    }
}