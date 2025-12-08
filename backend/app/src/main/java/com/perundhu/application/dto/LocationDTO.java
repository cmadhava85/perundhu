package com.perundhu.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * DTO for Location information using Java 17 record
 * Enhanced to support duplicate village names near different cities/towns
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LocationDTO(
        @JsonProperty("id") Long id,
        @JsonProperty("name") String name,
        @JsonProperty("translatedName") String translatedName,
        @JsonProperty("latitude") Double latitude,
        @JsonProperty("longitude") Double longitude,
        @JsonProperty("district") String district,
        @JsonProperty("nearbyCity") String nearbyCity,
        @JsonProperty("displayName") String displayName) {
    
    /**
     * Constructor without translation for non-language methods
     */
    public LocationDTO(Long id, String name, Double latitude, Double longitude) {
        this(id, name, name, latitude, longitude, null, null, name);
    }
    
    /**
     * Constructor with translation but without district info
     */
    public LocationDTO(Long id, String name, String translatedName, Double latitude, Double longitude) {
        this(id, name, translatedName, latitude, longitude, null, null, translatedName != null ? translatedName : name);
    }

    /**
     * Factory method for creating a basic location
     */
    public static LocationDTO of(Long id, String name) {
        return new LocationDTO(id, name, name, null, null, null, null, name);
    }

    /**
     * Factory method with coordinates
     */
    public static LocationDTO withCoordinates(Long id, String name, Double latitude, Double longitude) {
        return new LocationDTO(id, name, name, latitude, longitude, null, null, name);
    }

    /**
     * Factory method with full details including translation
     */
    public static LocationDTO withTranslation(Long id, String name, String translatedName,
            Double latitude, Double longitude) {
        return new LocationDTO(id, name, translatedName, latitude, longitude, null, null, 
                translatedName != null ? translatedName : name);
    }
    
    /**
     * Factory method with district/nearby city info for disambiguation
     */
    public static LocationDTO withDistrict(Long id, String name, String translatedName,
            Double latitude, Double longitude, String district, String nearbyCity) {
        String display = buildDisplayName(translatedName != null ? translatedName : name, district, nearbyCity);
        return new LocationDTO(id, name, translatedName, latitude, longitude, district, nearbyCity, display);
    }
    
    /**
     * Build display name with district/nearby city for disambiguation
     * e.g., "Kovilpatti (near Thoothukudi)" or "Kovilpatti, Virudhunagar District"
     */
    private static String buildDisplayName(String name, String district, String nearbyCity) {
        if (nearbyCity != null && !nearbyCity.isBlank()) {
            return name + " (near " + nearbyCity + ")";
        }
        if (district != null && !district.isBlank()) {
            return name + ", " + district;
        }
        return name;
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
    
    public String getDistrict() {
        return district;
    }
    
    public String getNearbyCity() {
        return nearbyCity;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}