package com.perundhu.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for Location information using Java 17 record
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LocationDTO(
        @JsonProperty("id") Long id,
        @JsonProperty("name") String name,
        @JsonProperty("translatedName") String translatedName,
        @JsonProperty("latitude") Double latitude,
        @JsonProperty("longitude") Double longitude) {
    /**
     * Constructor without translation for non-language methods
     */
    public LocationDTO(Long id, String name, Double latitude, Double longitude) {
        this(id, name, name, latitude, longitude); // Default translatedName to name
    }

    /**
     * Factory method for creating a basic location
     */
    public static LocationDTO of(Long id, String name) {
        return new LocationDTO(id, name, name, null, null);
    }

    /**
     * Factory method with coordinates
     */
    public static LocationDTO withCoordinates(Long id, String name, Double latitude, Double longitude) {
        return new LocationDTO(id, name, name, latitude, longitude);
    }

    /**
     * Factory method with full details including translation
     */
    public static LocationDTO withTranslation(Long id, String name, String translatedName,
            Double latitude, Double longitude) {
        return new LocationDTO(id, name, translatedName, latitude, longitude);
    }

    /**
     * Convenience getter methods for backward compatibility
     */
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getTranslatedName() {
        return translatedName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }
}