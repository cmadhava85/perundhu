package com.perundhu.domain.port;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Domain port for routing-based validation of contributions.
 * Provides contracts for validating route feasibility, stop ordering, and realistic travel times.
 * Implementation should use a routing engine (e.g., GraphHopper) to determine if:
 * - Travel times are realistic for the route and vehicle type
 * - Stops are in logical geographic order
 * - Segment speeds don't indicate impossible conditions (e.g., 300 km/h for buses)
 */
public interface RoutingValidationPort {
    
    /**
     * Validates if the journey duration between two points is realistic.
     *
     * @param fromLat Starting latitude
     * @param fromLng Starting longitude
     * @param toLat Destination latitude
     * @param toLng Destination longitude
     * @param departureTime Journey start time
     * @param arrivalTime Journey end time
     * @param vehicleType Type of vehicle (e.g., "bus", "van")
     * @return RouteValidationResult containing feasibility assessment and details
     */
    RouteValidationResult validateJourneyDuration(
            double fromLat,
            double fromLng,
            double toLat,
            double toLng,
            LocalDateTime departureTime,
            LocalDateTime arrivalTime,
            String vehicleType
    );
    
    /**
     * Validates that stops are in logical geographic order along the route.
     * Detects if a stop significantly deviates from the main route path.
     *
     * @param startLat Starting point latitude
     * @param startLng Starting point longitude
     * @param stops List of intermediate stops with coordinates
     * @param endLat Final destination latitude
     * @param endLng Final destination longitude
     * @return RouteValidationResult indicating order validity and detailing any out-of-order stops
     */
    RouteValidationResult validateStopSequence(
            double startLat,
            double startLng,
            List<Stop> stops,
            double endLat,
            double endLng
    );
    
    /**
     * Validates segment speeds between consecutive stops don't suggest impossible conditions.
     * Checks for unrealistic speeds that would require:
     * - Flying (> 150 km/h for buses on ground)
     * - Teleportation (instant movement)
     * - Extreme acceleration/deceleration
     *
     * @param segments List of segments with distance and time data
     * @param vehicleType Type of vehicle to determine speed limits
     * @return RouteValidationResult indicating speed feasibility
     */
    RouteValidationResult validateSegmentSpeeds(
            List<RouteSegment> segments,
            String vehicleType
    );
    
    /**
     * Represents an intermediate stop with coordinates and timing.
     */
    record Stop(
            String name,
            double latitude,
            double longitude,
            LocalDateTime arrivalTime,
            LocalDateTime departureTime
    ) {}
    
    /**
     * Represents a segment of the route between two points.
     */
    record RouteSegment(
            double startLat,
            double startLng,
            double endLat,
            double endLng,
            long distanceMeters,
            long durationSeconds
    ) {}
    
    /**
     * Result of a routing validation check.
     *
     * @param isValid True if the aspect being validated is feasible
     * @param confidenceScore 0-100 indicating confidence in feasibility (100 = certain)
     * @param validationType The specific validation performed
     * @param issue Description of the issue if invalid
     * @param expectedRange Expected range of values (e.g., "6-8 hours")
     * @param actualValue Actual measured/provided value
     */
    record RouteValidationResult(
            boolean isValid,
            int confidenceScore,
            ValidationType validationType,
            String issue,
            String expectedRange,
            String actualValue
    ) {}
    
    /**
     * Types of validations that can be performed.
     */
    enum ValidationType {
        JOURNEY_DURATION("Journey Duration"),
        STOP_SEQUENCE("Stop Sequence"),
        SEGMENT_SPEED("Segment Speed");
        
        public final String displayName;
        
        ValidationType(String displayName) {
            this.displayName = displayName;
        }
    }
}
