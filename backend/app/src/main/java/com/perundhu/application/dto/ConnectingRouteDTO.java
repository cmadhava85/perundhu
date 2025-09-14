package com.perundhu.application.dto;

import java.util.List;

/**
 * DTO representing a connecting route with multiple legs using Java 17 record
 */
public record ConnectingRouteDTO(
        Long id,
        String connectionPoint,
        String connectionPointTranslated,
        Integer waitTime, // in minutes
        Integer totalDuration, // in minutes
        Double totalDistance, // in kilometers
        BusRouteSegmentDTO firstLeg,
        BusRouteSegmentDTO secondLeg,
        List<StopDTO> connectionStops,
        boolean isOSMDiscovered,
        String osmRouteRef,
        String osmNetwork,
        String osmOperator) {

    /**
     * Compact constructor for validation and immutability
     */
    public ConnectingRouteDTO {
        connectionStops = connectionStops != null ? List.copyOf(connectionStops) : List.of();
        // Set default values
        connectionPointTranslated = connectionPointTranslated != null ? connectionPointTranslated : connectionPoint;
    }

    /**
     * Factory method for creating basic connecting route
     */
    public static ConnectingRouteDTO of(Long id, String connectionPoint,
            BusRouteSegmentDTO firstLeg,
            BusRouteSegmentDTO secondLeg) {
        return new ConnectingRouteDTO(id, connectionPoint, connectionPoint,
                null, null, null, firstLeg, secondLeg,
                List.of(), false, null, null, null);
    }

    /**
     * Factory method with timing information
     */
    public static ConnectingRouteDTO withTiming(Long id, String connectionPoint,
            Integer waitTime, Integer totalDuration,
            BusRouteSegmentDTO firstLeg,
            BusRouteSegmentDTO secondLeg) {
        return new ConnectingRouteDTO(id, connectionPoint, connectionPoint,
                waitTime, totalDuration, null, firstLeg, secondLeg,
                List.of(), false, null, null, null);
    }

    /**
     * Factory method for OSM-discovered routes
     */
    public static ConnectingRouteDTO fromOSM(Long id, String connectionPoint,
            BusRouteSegmentDTO firstLeg,
            BusRouteSegmentDTO secondLeg,
            String osmRouteRef, String osmNetwork, String osmOperator) {
        return new ConnectingRouteDTO(id, connectionPoint, connectionPoint,
                null, null, null, firstLeg, secondLeg,
                List.of(), true, osmRouteRef, osmNetwork, osmOperator);
    }

    /**
     * Create a copy with updated connection stops
     */
    public ConnectingRouteDTO withConnectionStops(List<StopDTO> newConnectionStops) {
        return new ConnectingRouteDTO(id, connectionPoint, connectionPointTranslated,
                waitTime, totalDuration, totalDistance,
                firstLeg, secondLeg, newConnectionStops,
                isOSMDiscovered, osmRouteRef, osmNetwork, osmOperator);
    }

    /**
     * Create a copy with updated timing information
     */
    public ConnectingRouteDTO withTiming(Integer newWaitTime, Integer newTotalDuration, Double newTotalDistance) {
        return new ConnectingRouteDTO(id, connectionPoint, connectionPointTranslated,
                newWaitTime, newTotalDuration, newTotalDistance,
                firstLeg, secondLeg, connectionStops,
                isOSMDiscovered, osmRouteRef, osmNetwork, osmOperator);
    }

    /**
     * Convenience getter methods for backward compatibility
     */
    public Long getId() {
        return id;
    }

    public BusRouteSegmentDTO getFirstLeg() {
        return firstLeg;
    }

    public BusRouteSegmentDTO getSecondLeg() {
        return secondLeg;
    }
}