package com.perundhu.application.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing a connecting route with multiple legs
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectingRouteDTO {
    private Long id;
    private String connectionPoint;
    private String connectionPointTranslated;  // Added translated connection point field
    private Integer waitTime; // in minutes
    private Integer totalDuration; // in minutes
    private Double totalDistance; // in kilometers
    
    // First leg of the journey
    private BusRouteSegmentDTO firstLeg;
    
    // Second leg of the journey
    private BusRouteSegmentDTO secondLeg;
    
    // Potential intermediate stops at connection point
    private List<StopDTO> connectionStops;
}