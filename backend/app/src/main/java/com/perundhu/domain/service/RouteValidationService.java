package com.perundhu.domain.service;

import com.perundhu.domain.model.Location;

/**
 * Domain service interface for validating routes between locations.
 * This service ensures that routes have valid origin and destination points.
 */
public interface RouteValidationService {

    /**
     * Validates if a route between two locations is valid.
     * 
     * @param fromLocation The origin location
     * @param toLocation   The destination location
     * @return true if the route is valid, false otherwise
     */
    boolean isValidRoute(Location fromLocation, Location toLocation);

    /**
     * Validates if the distance between two locations is reasonable for a bus
     * route.
     * 
     * @param fromLocation The origin location
     * @param toLocation   The destination location
     * @return true if the distance is valid, false otherwise
     */
    boolean isValidRouteDistance(Location fromLocation, Location toLocation);

    /**
     * Validates the locations used in a route.
     * 
     * @param fromLocation The origin location
     * @param toLocation   The destination location
     * @return true if the locations are valid, false otherwise
     */
    boolean validateRouteLocations(Location fromLocation, Location toLocation);

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
