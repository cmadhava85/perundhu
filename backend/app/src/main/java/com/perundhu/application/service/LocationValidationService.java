package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for validating location data
 */
@Service("applicationLocationValidationService")
@Slf4j
public class LocationValidationService {

    /**
     * Validate location coordinates and name
     */
    public boolean validateLocation(String locationName, Double latitude, Double longitude) {
        log.debug("Validating location: {} at ({}, {})", locationName, latitude, longitude);

        // Basic validation
        if (locationName == null || locationName.trim().isEmpty()) {
            log.warn("Location name is null or empty");
            return false;
        }

        // Validate coordinates if provided
        if (latitude != null && (latitude < -90 || latitude > 90)) {
            log.warn("Invalid latitude: {}", latitude);
            return false;
        }

        if (longitude != null && (longitude < -180 || longitude > 180)) {
            log.warn("Invalid longitude: {}", longitude);
            return false;
        }

        // Check for reasonable location name length
        if (locationName.trim().length() < 2) {
            log.warn("Location name too short: {}", locationName);
            return false;
        }

        log.debug("Location validation passed for: {}", locationName);
        return true;
    }

    /**
     * Validate if two locations are different
     */
    public boolean validateLocationsDifferent(String location1, String location2) {
        if (location1 == null || location2 == null) {
            return false;
        }

        return !location1.trim().equalsIgnoreCase(location2.trim());
    }
}
