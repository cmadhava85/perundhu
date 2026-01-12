package com.perundhu.application.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Response wrapper for name-based connecting route searches.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ConnectingRoutesByNameDTO(
    @JsonProperty("fromLocationName") String fromLocationName,
    @JsonProperty("toLocationName") String toLocationName,
    @JsonProperty("fromLocations") List<ResolvedLocationInfo> fromLocations,
    @JsonProperty("toLocations") List<ResolvedLocationInfo> toLocations,
    @JsonProperty("routes") List<ConnectingRouteDTO> routes,
    @JsonProperty("totalFromLocations") int totalFromLocations,
    @JsonProperty("totalToLocations") int totalToLocations,
    @JsonProperty("totalRoutes") int totalRoutes) {
}
