package com.perundhu.domain.service;

import com.perundhu.domain.model.Location;

/**
 * Domain service interface for validating routes between locations.
 * This service ensures that routes have valid origin and destination points.
 */
public interface RouteValidationService {

    /**
     * Validates a route between two locations.
     * 
     * @param from The origin location
     * @param to   The destination location
     * @throws IllegalArgumentException if the route is invalid
     */
    void validateRoute(Location from, Location to);

    /**
     * Calculates the distance between two points on Earth using the Haversine
     * formula.
     * 
     * @param lat1 Latitude of point 1
     * @param lon1 Longitude of point 1
     * @param lat2 Latitude of point 2
     * @param lon2 Longitude of point 2
     * @return Distance in kilometers
     */
    double calculateDistance(double lat1, double lon1, double lat2, double lon2);
}
