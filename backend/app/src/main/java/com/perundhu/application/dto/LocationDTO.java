package com.perundhu.application.dto;

import lombok.Value;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude;

@Value
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LocationDTO {
    @JsonProperty("id")
    Long id;

    @JsonProperty("name")
    String name;

    @JsonProperty("translatedName")
    String translatedName;

    @JsonProperty("latitude")
    Double latitude;

    @JsonProperty("longitude")
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