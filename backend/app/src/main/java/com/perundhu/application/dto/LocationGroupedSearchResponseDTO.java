package com.perundhu.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * DTO for grouped location search response
 * Contains a list of location groups organized by city/base name
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LocationGroupedSearchResponseDTO(
        @JsonProperty("groups") List<LocationGroupDTO> groups,
        @JsonProperty("totalCount") int totalCount) {

    /**
     * Factory method to create a new response
     */
    public static LocationGroupedSearchResponseDTO of(List<LocationGroupDTO> groups) {
        int total = groups.stream()
                .mapToInt(LocationGroupDTO::getItemCount)
                .sum();
        return new LocationGroupedSearchResponseDTO(groups, total);
    }

    /**
     * Factory method for empty response
     */
    public static LocationGroupedSearchResponseDTO empty() {
        return new LocationGroupedSearchResponseDTO(List.of(), 0);
    }

    /**
     * Check if response has any results
     */
    public boolean isEmpty() {
        return groups.isEmpty() || totalCount == 0;
    }
}
