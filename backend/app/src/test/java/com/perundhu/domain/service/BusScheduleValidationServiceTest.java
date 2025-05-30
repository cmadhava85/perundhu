package com.perundhu.domain.service;

import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.perundhu.domain.model.BusSchedule;
import com.perundhu.domain.model.Location;

public class BusScheduleValidationServiceTest {

    // Instead of using mocks, we'll use simple test implementations
    private static class TestLocationValidationService extends LocationValidationService {
        private Location invalidLocation;
        
        public TestLocationValidationService() {
            // Default implementation that accepts all locations
            this.invalidLocation = null;
        }
        
        public void setInvalidLocation(Location location) {
            this.invalidLocation = location;
        }
        
        @Override
        public Location validateLocation(Location location) {
            if (invalidLocation != null && location.equals(invalidLocation)) {
                throw new IllegalArgumentException("Location name cannot be empty");
            }
            return location;
        }
    }
    
    private TestLocationValidationService locationValidationService;
    private RouteValidationService routeValidationService;
    private BusScheduleValidationService service;
    
    private Location validOrigin;
    private Location validDestination;
    
    @BeforeEach
    void setUp() {
        locationValidationService = new TestLocationValidationService();
        
        // Create a simple test implementation of RouteValidationService that uses our TestLocationValidationService
        routeValidationService = new RouteValidationService(locationValidationService) {
            @Override
            public void validateRoute(Location from, Location to) {
                // First validate both locations using the underlying service
                locationValidationService.validateLocation(from);
                locationValidationService.validateLocation(to);
                
                // Check that origin and destination are not the same (simplified version)
                if (from.equals(to)) {
                    throw new IllegalArgumentException("Origin and destination locations cannot be the same");
                }
            }
        };
        
        service = new BusScheduleValidationService(locationValidationService, routeValidationService);
        
        validOrigin = new Location(
            new Location.LocationId(1L),
            "Chennai Central",
            13.0827,
            80.2707
        );
        
        validDestination = new Location(
            new Location.LocationId(2L),
            "Bangalore City",
            12.9716,
            77.5946
        );
    }
    
    @Test
    void testValidBusSchedule() {
        // Given
        BusSchedule busSchedule = new BusSchedule(
            new BusSchedule.BusScheduleId(1L),
            "KA-01-F-7777",
            validOrigin,
            validDestination,
            LocalTime.of(10, 0),
            LocalTime.of(14, 0)
        );
        
        // When/Then
        assertDoesNotThrow(() -> service.validateBusSchedule(busSchedule));
    }
    
    @Test
    void testInvalidBusNumber() {
        // Given
        BusSchedule busSchedule = new BusSchedule(
            new BusSchedule.BusScheduleId(1L),
            "", // Empty bus number
            validOrigin,
            validDestination,
            LocalTime.of(10, 0),
            LocalTime.of(14, 0)
        );
        
        // When/Then
        assertThrows(IllegalArgumentException.class, 
                     () -> service.validateBusSchedule(busSchedule));
    }
    
    @Test
    void testInvalidTimes() {
        // Given
        BusSchedule busSchedule = new BusSchedule(
            new BusSchedule.BusScheduleId(1L),
            "KA-01-F-7777",
            validOrigin,
            validDestination,
            LocalTime.of(14, 0), // Departure after arrival
            LocalTime.of(10, 0)
        );
        
        // When/Then
        assertThrows(IllegalArgumentException.class, 
                     () -> service.validateBusSchedule(busSchedule));
    }
    
    @Test
    void testSameFromAndToLocation() {
        // Given
        BusSchedule busSchedule = new BusSchedule(
            new BusSchedule.BusScheduleId(1L),
            "KA-01-F-7777",
            validOrigin,
            validOrigin, // Same location for both from and to
            LocalTime.of(10, 0),
            LocalTime.of(14, 0)
        );
        
        // When/Then
        assertThrows(IllegalArgumentException.class, 
                     () -> service.validateBusSchedule(busSchedule));
    }
    
    @Test
    void testInvalidLocationInBusSchedule() {
        // Given
        Location invalidLocation = new Location(
            new Location.LocationId(3L),
            "", // Invalid name
            0.0,
            0.0
        );
        
        // Configure the test validation service to reject this location
        locationValidationService.setInvalidLocation(invalidLocation);
            
        BusSchedule busSchedule = new BusSchedule(
            new BusSchedule.BusScheduleId(1L),
            "KA-01-F-7777",
            invalidLocation,
            validDestination,
            LocalTime.of(10, 0),
            LocalTime.of(14, 0)
        );
        
        // When/Then
        assertThrows(IllegalArgumentException.class, 
                     () -> service.validateBusSchedule(busSchedule));
    }
}