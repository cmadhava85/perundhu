package com.perundhu.domain.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Location.LocationId;

/**
 * Tests for the RouteValidationService in the hexagonal architecture.
 */
@Tag("hexagonal")
public class RouteValidationServiceTest {
    
    private final LocationValidationService locationValidationService = new LocationValidationService();
    private final RouteValidationService routeValidationService = new RouteValidationService(locationValidationService);
    
    @Test
    void testValidRoute() {
        // Set up valid locations with a reasonable distance between them
        Location chennai = new Location(
            new LocationId(1L),
            "Chennai",
            13.0827,
            80.2707
        );
        
        Location bangalore = new Location(
            new LocationId(2L),
            "Bangalore",
            12.9716,
            77.5946
        );
        
        // Validate the route - should not throw any exceptions
        assertDoesNotThrow(() -> routeValidationService.validateRoute(chennai, bangalore));
    }
    
    @Test
    void testSameOriginAndDestination() {
        // Set up the same location for both origin and destination
        Location chennai = new Location(
            new LocationId(1L),
            "Chennai",
            13.0827,
            80.2707
        );
        
        // Validate the route - should throw IllegalArgumentException
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> routeValidationService.validateRoute(chennai, chennai)
        );
        
        // Assert the error message
        assertEquals("Origin and destination locations cannot be the same", exception.getMessage());
    }
    
    @Test
    void testTooDistantLocations() {
        // Set up locations with a very large distance between them
        // Chennai, India
        Location chennai = new Location(
            new LocationId(1L),
            "Chennai",
            13.0827,
            80.2707
        );
        
        // New York, USA - very far from Chennai
        Location newYork = new Location(
            new LocationId(2L),
            "New York",
            40.7128,
            -74.0060
        );
        
        // Validate the route - should throw IllegalArgumentException
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> routeValidationService.validateRoute(chennai, newYork)
        );
        
        // Assert that the error message contains the expected text
        assertEquals(true, exception.getMessage().contains("exceeds maximum allowed distance"));
    }
    
    @Test
    void testInvalidLocationInRoute() {
        // Set up one valid location and one with an invalid name
        Location chennai = new Location(
            new LocationId(1L),
            "Chennai",
            13.0827,
            80.2707
        );
        
        Location invalidLocation = new Location(
            new LocationId(2L),
            "", // Invalid empty name
            12.9716,
            77.5946
        );
        
        // Validate the route - should throw IllegalArgumentException
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> routeValidationService.validateRoute(chennai, invalidLocation)
        );
        
        // Assert the error message
        assertEquals("Location name cannot be empty", exception.getMessage());
    }
}