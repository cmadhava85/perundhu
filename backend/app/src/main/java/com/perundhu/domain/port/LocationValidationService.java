package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Location;

/**
 * Domain service interface for validating location data.
 * This service ensures that locations have valid names and coordinates.
 */
public interface LocationValidationService {

    /**
     * Validates a location's coordinates and name.
     *
     * @param location The location to validate
     * @return true if the location is valid, false otherwise
     */
    boolean validateLocation(Location location);

    /**
     * Validates if a location with the given name exists.
     *
     * @param locationName The name of the location to validate
     * @return true if the location exists, false otherwise
     */
    boolean isValidLocation(String locationName);

    /**
     * Validates if the given coordinates are valid.
     *
     * @param latitude  The latitude coordinate
     * @param longitude The longitude coordinate
     * @return true if the coordinates are valid, false otherwise
     */
    boolean isValidLocationCoordinates(double latitude, double longitude);

    /**
     * Finds a location by name.
     *
     * @param locationName The name of the location to find
     * @return Optional containing the location if found, empty otherwise
     */
    Optional<Location> findLocationByName(String locationName);

    /**
     * Finds locations similar to the given name.
     *
     * @param locationName The name to search for similar locations
     * @return List of similar locations
     */
    List<Location> findSimilarLocations(String locationName);
}
