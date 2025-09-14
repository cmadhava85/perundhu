package com.perundhu.application.dto;

/**
 * DTO for Bus Route Segment information using Java 17 record
 * Used in connecting routes to represent individual legs of a journey
 */
public record BusRouteSegmentDTO(
        Long busId,
        String busName,
        String busNumber,
        String from,
        String to,
        String departureTime,
        String arrivalTime,
        Integer duration,
        Double distance,
        String osmRouteRef,
        String osmNetwork,
        String osmOperator) {
    /**
     * Compact constructor for validation
     */
    public BusRouteSegmentDTO {
        if (duration != null && duration < 0) {
            throw new IllegalArgumentException("Duration must be non-negative");
        }
        if (distance != null && distance < 0) {
            throw new IllegalArgumentException("Distance must be non-negative");
        }
    }

    /**
     * Factory method for creating a basic segment
     */
    public static BusRouteSegmentDTO of(Long busId, String busName, String busNumber,
            String from, String to) {
        return new BusRouteSegmentDTO(busId, busName, busNumber, from, to,
                null, null, null, null, null, null, null);
    }

    /**
     * Factory method with timing information
     */
    public static BusRouteSegmentDTO withTimes(Long busId, String busName, String busNumber,
            String from, String to,
            String departureTime, String arrivalTime) {
        return new BusRouteSegmentDTO(busId, busName, busNumber, from, to,
                departureTime, arrivalTime, null, null, null, null, null);
    }

    /**
     * Factory method with full details
     */
    public static BusRouteSegmentDTO withDetails(Long busId, String busName, String busNumber,
            String from, String to,
            String departureTime, String arrivalTime,
            Integer duration, Double distance) {
        return new BusRouteSegmentDTO(busId, busName, busNumber, from, to,
                departureTime, arrivalTime, duration, distance, null, null, null);
    }

    /**
     * Convenience getter methods for backward compatibility
     */
    public String getBusName() {
        return busName;
    }

    public String getBusNumber() {
        return busNumber;
    }

    public String getFrom() {
        return from;
    }

    public String getTo() {
        return to;
    }
}