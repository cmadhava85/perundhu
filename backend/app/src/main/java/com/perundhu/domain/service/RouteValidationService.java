package com.perundhu.domain.service;

import org.springframework.stereotype.Service;

import com.perundhu.domain.model.Location;

/**
 * Domain service for validating routes between locations.
 * This service ensures that routes have valid origin and destination points.
 */
@Service
public class RouteValidationService {
    
    private final LocationValidationService locationValidationService;
    
    public RouteValidationService(LocationValidationService locationValidationService) {
        this.locationValidationService = locationValidationService;
    }
    
    /**
     * Validates a route between two locations.
     * 
     * @param from The origin location
     * @param to The destination location
     * @throws IllegalArgumentException if the route is invalid
     */
    public void validateRoute(Location from, Location to) {
        // First validate both locations
        locationValidationService.validateLocation(from);
        locationValidationService.validateLocation(to);
        
        // Check that origin and destination are not the same
        if (from.getId().getValue().equals(to.getId().getValue())) {
            throw new IllegalArgumentException("Origin and destination locations cannot be the same");
        }
        
        // Calculate approximate distance (using Haversine formula)
        double distance = calculateDistance(
            from.getLatitude(), from.getLongitude(),
            to.getLatitude(), to.getLongitude()
        );
        
        // Check if distance is reasonable (for example, < 500 km for a bus route)
        if (distance > 500) {
            throw new IllegalArgumentException(
                String.format("Route distance (%.2f km) exceeds maximum allowed distance (500 km)", distance)
            );
        }
    }
    
    /**
     * Calculates the distance between two points on Earth using the Haversine formula.
     * 
     * @param lat1 Latitude of point 1
     * @param lon1 Longitude of point 1
     * @param lat2 Latitude of point 2
     * @param lon2 Longitude of point 2
     * @return Distance in kilometers
     */
    public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Earth's radius in kilometers
        final double R = 6371.0;
        
        // Convert degrees to radians
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        
        // Haversine formula
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
}