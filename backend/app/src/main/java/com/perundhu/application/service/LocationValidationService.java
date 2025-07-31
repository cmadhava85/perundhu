package com.perundhu.application.service;

import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service for validating location data
 */
@Service("applicationLocationValidationService")
public class LocationValidationService {

    private static final Logger log = LoggerFactory.getLogger(LocationValidationService.class);

    // Patterns for basic validation
    private static final Pattern COORDINATE_PATTERN = Pattern.compile("^-?\\d{1,3}\\.\\d{1,15}$");
    private static final double MIN_LATITUDE = -90.0;
    private static final double MAX_LATITUDE = 90.0;
    private static final double MIN_LONGITUDE = -180.0;
    private static final double MAX_LONGITUDE = 180.0;

    /**
     * Validates a location based on its name and coordinates
     *
     * @param name      The name of the location
     * @param latitude  The latitude coordinate
     * @param longitude The longitude coordinate
     * @return true if the location is valid, false otherwise
     */
    public boolean validateLocation(String name, Double latitude, Double longitude) {
        boolean nameValid = isValidLocationName(name);
        boolean coordinatesValid = latitude != null && longitude != null &&
                isValidCoordinates(latitude, longitude);

        log.debug("Validating location: name='{}', lat={}, lng={} - nameValid={}, coordinatesValid={}",
                name, latitude, longitude, nameValid, coordinatesValid);

        return nameValid && coordinatesValid;
    }

    /**
     * Validates if the given latitude is valid
     * 
     * @param latitude The latitude to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidLatitude(String latitude) {
        if (latitude == null || !COORDINATE_PATTERN.matcher(latitude).matches()) {
            return false;
        }

        try {
            double lat = Double.parseDouble(latitude);
            return lat >= MIN_LATITUDE && lat <= MAX_LATITUDE;
        } catch (NumberFormatException e) {
            log.warn("Invalid latitude format: {}", latitude);
            return false;
        }
    }

    /**
     * Validates if the given longitude is valid
     * 
     * @param longitude The longitude to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidLongitude(String longitude) {
        if (longitude == null || !COORDINATE_PATTERN.matcher(longitude).matches()) {
            return false;
        }

        try {
            double lon = Double.parseDouble(longitude);
            return lon >= MIN_LONGITUDE && lon <= MAX_LONGITUDE;
        } catch (NumberFormatException e) {
            log.warn("Invalid longitude format: {}", longitude);
            return false;
        }
    }

    /**
     * Validates both latitude and longitude coordinates
     * 
     * @param latitude  The latitude to validate
     * @param longitude The longitude to validate
     * @return true if both are valid, false otherwise
     */
    public boolean isValidCoordinates(String latitude, String longitude) {
        return isValidLatitude(latitude) && isValidLongitude(longitude);
    }

    /**
     * Validates both latitude and longitude coordinates as double values
     * 
     * @param latitude  The latitude to validate
     * @param longitude The longitude to validate
     * @return true if both are valid, false otherwise
     */
    public boolean isValidCoordinates(double latitude, double longitude) {
        return latitude >= MIN_LATITUDE && latitude <= MAX_LATITUDE &&
                longitude >= MIN_LONGITUDE && longitude <= MAX_LONGITUDE;
    }

    /**
     * Validates that a location name is not empty and meets minimum requirements
     * 
     * @param locationName The location name to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidLocationName(String locationName) {
        return locationName != null && !locationName.trim().isEmpty() && locationName.trim().length() >= 3;
    }
}
