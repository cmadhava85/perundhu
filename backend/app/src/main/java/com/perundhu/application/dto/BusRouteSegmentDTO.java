package com.perundhu.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a segment of a bus route in a connecting journey
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusRouteSegmentDTO {
    private Long busId;
    private String busNumber;
    private String busName;
    private String busNameTranslated; // Added translated name field
    private String from;
    private String fromTranslated;   // Added translated from field
    private String to;
    private String toTranslated;     // Added translated to field
    private String departureTime;
    private String arrivalTime;
    private Integer duration; // in minutes
    private Double distance; // in kilometers
}