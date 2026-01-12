package com.perundhu.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO for grouped location results
 * Groups related locations (city + bus stands + neighborhoods) together
 * for better UX when showing location variants like "Salem", "Salem - New Bus Stand", etc.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LocationGroupDTO(
        @JsonProperty("cityName") String cityName,
        @JsonProperty("cityOption") LocationDTO cityOption,
        @JsonProperty("busStands") List<LocationDTO> busStands,
        @JsonProperty("neighborhoods") List<LocationDTO> neighborhoods) {

    /**
     * Compact constructor that ensures non-null lists
     */
    public LocationGroupDTO {
        if (busStands == null) {
            busStands = new ArrayList<>();
        }
        if (neighborhoods == null) {
            neighborhoods = new ArrayList<>();
        }
    }

    /**
     * Factory method to create a new group
     */
    public static LocationGroupDTO of(String cityName, LocationDTO cityOption) {
        return new LocationGroupDTO(cityName, cityOption, new ArrayList<>(), new ArrayList<>());
    }

    /**
     * Add a bus stand to this group
     */
    public LocationGroupDTO addBusStand(LocationDTO busStand) {
        this.busStands.add(busStand);
        return this;
    }

    /**
     * Add a neighborhood/area to this group
     */
    public LocationGroupDTO addNeighborhood(LocationDTO neighborhood) {
        this.neighborhoods.add(neighborhood);
        return this;
    }

    /**
     * Check if this group has any results
     */
    public boolean isEmpty() {
        return (cityOption == null) && busStands.isEmpty() && neighborhoods.isEmpty();
    }

    /**
     * Get total count of items in this group
     */
    public int getItemCount() {
        int count = (cityOption != null) ? 1 : 0;
        count += busStands.size();
        count += neighborhoods.size();
        return count;
    }
}
