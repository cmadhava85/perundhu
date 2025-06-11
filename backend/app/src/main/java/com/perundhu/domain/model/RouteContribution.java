package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Domain model for route contributions from users
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteContribution {
    private String id;
    private String userId;
    private String busNumber;
    private String busName;
    private String fromLocationName;
    private String toLocationName;
    private Double fromLatitude;
    private Double fromLongitude;
    private Double toLatitude;
    private Double toLongitude;
    private String departureTime;
    private String arrivalTime;
    private String scheduleInfo;
    private String status;
    private LocalDateTime submissionDate;
    private LocalDateTime processedDate;
    private String additionalNotes;
    private String validationMessage;
    
    @Builder.Default
    private List<StopContribution> stops = new ArrayList<>();
    
    /**
     * Inner class for stop contributions in a route
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StopContribution {
        private String name;
        private Double latitude;
        private Double longitude;
        private String arrivalTime;
        private String departureTime;
        private Integer stopOrder;
    }
}