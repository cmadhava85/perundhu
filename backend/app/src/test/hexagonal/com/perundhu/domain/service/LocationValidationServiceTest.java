package com.perundhu.domain.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Location.LocationId;

/**
 * Tests for the LocationValidationService in the hexagonal architecture.
 */
@Tag("hexagonal")
public class LocationValidationServiceTest {
    
    private final LocationValidationService validationService = new LocationValidationService();
    
    @Test
    void testValidLocation() {
        // Set up a valid location
        Location location = new Location(
            new LocationId(1L),
            "Chennai",
            13.0827,
            80.2707
        );
        
        // Validate the location
        Location validated = validationService.validateLocation(location);
        
        // Assert that the validated location matches the input
        assertEquals(location.getId(), validated.getId());
        assertEquals(location.getName(), validated.getName());
        assertEquals(location.getLatitude(), validated.getLatitude());
        assertEquals(location.getLongitude(), validated.getLongitude());
    }
    
    @Test
    void testInvalidName() {
        // Set up a location with empty name
        Location location = new Location(
            new LocationId(1L),
            "",
            13.0827,
            80.2707
        );
        
        // Validate the location - should throw IllegalArgumentException
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> validationService.validateLocation(location)
        );
        
        // Assert the error message
        assertEquals("Location name cannot be empty", exception.getMessage());
    }
    
    @Test
    void testInvalidCoordinates() {
        // Set up a location with invalid latitude
        Location location = new Location(
            new LocationId(1L),
            "Chennai",
            91.0, // Invalid latitude (out of range)
            80.2707
        );
        
        // Validate the location - should throw IllegalArgumentException
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> validationService.validateLocation(location)
        );
        
        // Assert the error message
        assertEquals("Latitude must be between -90 and 90", exception.getMessage());
        
        // Set up a location with invalid longitude
        Location locationWithInvalidLongitude = new Location(
            new LocationId(1L),
            "Chennai",
            13.0827,
            181.0 // Invalid longitude (out of range)
        );
        
        // Validate the location - should throw IllegalArgumentException
        IllegalArgumentException longitudeException = assertThrows(
            IllegalArgumentException.class,
            () -> validationService.validateLocation(locationWithInvalidLongitude)
        );
        
        // Assert the error message
        assertEquals("Longitude must be between -180 and 180", longitudeException.getMessage());
    }
}