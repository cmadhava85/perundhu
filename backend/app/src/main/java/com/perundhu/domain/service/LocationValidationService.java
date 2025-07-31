package com.perundhu.domain.service;

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
     * @throws IllegalArgumentException if the location is invalid
     */
    void validateLocation(Location location);
}
