package com.perundhu.domain.model;

import lombok.Builder;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

/**
 * Domain model for route contributions submitted by users
 */
@Data
@Builder(toBuilder = true)
@AllArgsConstructor
@NoArgsConstructor
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
    private String validationMessage;
    private String additionalNotes;
    private String submittedBy;
    private List<StopContribution> stops;

    /**
     * Get stops list
     */
    public List<StopContribution> getStops() {
        return stops != null ? stops : new ArrayList<>();
    }

    /**
     * Set stops list
     */
    public void setStops(List<StopContribution> stops) {
        this.stops = stops;
    }
}