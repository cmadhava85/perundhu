package com.perundhu.domain.service;

import org.springframework.stereotype.Service;

import com.perundhu.domain.model.Location;

/**
 * Domain service for validating location data.
 * This service ensures that locations have valid names and coordinates.
 */
@Service
public class LocationValidationService {
    
    /**
     * Validates a location's data.
     * 
     * @param location The location to validate
     * @return The validated location
     * @throws IllegalArgumentException if the location is invalid
     */
    public Location validateLocation(Location location) {
        // Validate name
        if (location.getName() == null || location.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Location name cannot be empty");
        }
        
        // Validate latitude (must be between -90 and 90 degrees)
        if (location.getLatitude() < -90 || location.getLatitude() > 90) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        
        // Validate longitude (must be between -180 and 180 degrees)
        if (location.getLongitude() < -180 || location.getLongitude() > 180) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
        
        // Return the validated location
        return location;
    }
}