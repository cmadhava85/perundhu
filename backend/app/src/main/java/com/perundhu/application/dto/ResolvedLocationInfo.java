package com.perundhu.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Resolved location details returned by name-based connecting route search.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ResolvedLocationInfo(
    @JsonProperty("locationId") Long locationId,
    @JsonProperty("name") String name,
    @JsonProperty("type") String type,
    @JsonProperty("busStandName") String busStandName,
    @JsonProperty("busCount") Integer busCount) {
}
