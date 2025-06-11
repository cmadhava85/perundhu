package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for validating geographic locations
 */
@Service("applicationLocationValidationService")
@RequiredArgsConstructor
@Slf4j
public class LocationValidationService {

    /**
     * Validates a location name and coordinates
     * 
     * @param name Location name
     * @param latitude Latitude of the location
     * @param longitude Longitude of the location
     * @return true if valid, false otherwise
     */
    public boolean validateLocation(String name, Double latitude, Double longitude) {
        // Simple validation for now
        if (name == null || name.trim().isEmpty()) {
            log.warn("Location name is empty");
            return false;
        }
        
        if (latitude == null || longitude == null) {
            // If coordinates are not provided, we allow it (for now)
            return true;
        }
        
        // Basic coordinate validation
        if (latitude < -90 || latitude > 90) {
            log.warn("Invalid latitude: {}", latitude);
            return false;
        }
        
        if (longitude < -180 || longitude > 180) {
            log.warn("Invalid longitude: {}", longitude);
            return false;
        }
        
        // In a real implementation, we would validate that the coordinates
        // actually correspond to the named location using a geocoding service
        
        return true;
    }
}

