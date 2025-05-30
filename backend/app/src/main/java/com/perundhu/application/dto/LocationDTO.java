package com.perundhu.application.dto;

import lombok.Value;

@Value
public class LocationDTO {
    Long id;
    String name;
    String translatedName;
    Double latitude;
    Double longitude;
    
    // Constructor without translation for non-language methods
    public LocationDTO(Long id, String name, Double latitude, Double longitude) {
        this.id = id;
        this.name = name;
        this.translatedName = name; // Default to the original name
        this.latitude = latitude;
        this.longitude = longitude;
    }
    
    // Constructor with translation for language-specific methods
    public LocationDTO(Long id, String name, String translatedName, Double latitude, Double longitude) {
        this.id = id;
        this.name = name;
        this.translatedName = translatedName;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}