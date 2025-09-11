package com.perundhu.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Domain model for stop contributions within a route contribution
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StopContribution {

    private String name;
    private Double latitude;
    private Double longitude;
    private String arrivalTime;
    private String departureTime;
    private Integer stopOrder;
}