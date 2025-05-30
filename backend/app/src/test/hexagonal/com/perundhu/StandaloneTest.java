package com.perundhu;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalTime;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.model.Translation;

/**
 * Standalone tests for domain models in the hexagonal architecture.
 * These tests verify the basic functionality of domain models without
 * requiring a Spring context or database.
 */
@Tag("hexagonal")
public class StandaloneTest {
    
    @Test
    void testLocationModel() {
        // Create a Location object
        Location location = new Location(
            new Location.LocationId(1L),
            "Chennai",
            13.0827,
            80.2707
        );
        
        // Verify
        assertEquals(1L, location.getId().getValue());
        assertEquals("Chennai", location.getName());
        assertEquals(13.0827, location.getLatitude());
        assertEquals(80.2707, location.getLongitude());
        
        // Verify Translatable implementation
        assertEquals("location", location.getEntityType());
        assertEquals(1L, location.getEntityId());
        assertEquals("Chennai", location.getDefaultValue("name"));
    }
    
    @Test
    void testBusModel() {
        // Create locations
        Location fromLocation = new Location(
            new Location.LocationId(1L),
            "Chennai",
            13.0827,
            80.2707
        );
        
        Location toLocation = new Location(
            new Location.LocationId(2L),
            "Bangalore",
            12.9716,
            77.5946
        );
        
        // Create a Bus with all required parameters
        Bus bus = new Bus(
            new Bus.BusId(1L),
            "Express Bus",
            "XP123",
            fromLocation,
            toLocation,
            LocalTime.of(8, 0),
            LocalTime.of(14, 0)
        );
        
        // Verify
        assertEquals(1L, bus.getId().getValue());
        assertEquals("Express Bus", bus.getName());
        assertEquals("XP123", bus.getBusNumber());
        assertEquals(fromLocation, bus.getFromLocation());
        assertEquals(toLocation, bus.getToLocation());
        assertEquals(LocalTime.of(8, 0), bus.getDepartureTime());
        assertEquals(LocalTime.of(14, 0), bus.getArrivalTime());
        
        // Verify Translatable implementation
        assertEquals("bus", bus.getEntityType());
        assertEquals(1L, bus.getEntityId());
        assertEquals("Express Bus", bus.getDefaultValue("name"));
    }
    
    @Test
    void testStopModel() {
        // Reset the stop order tracking to ensure test isolation
        Stop.resetStopOrders();

        // Create a Location
        Location location = new Location(
            new Location.LocationId(1L),
            "Chennai",
            13.0827,
            80.2707
        );
        
        // Create a Bus with all required parameters
        Bus bus = new Bus(
            new Bus.BusId(1L),
            "Express Bus",
            "XP123",
            location,  // fromLocation
            location,  // toLocation (using the same location for simplicity in test)
            LocalTime.of(8, 0),
            LocalTime.of(14, 0)
        );
        
        // Create a Stop with all required parameters
        Stop stop = new Stop(
            new Stop.StopId(1L),
            "Chennai Central",
            bus,
            location,
            LocalTime.of(8, 0),
            LocalTime.of(8, 15),
            1
        );
        
        // Verify
        assertEquals(1L, stop.getId().getValue());
        assertEquals("Chennai Central", stop.getName());
        assertEquals(1, stop.getStopOrder());
        assertEquals(location, stop.getLocation());
        assertEquals(bus, stop.getBus());
        assertEquals(LocalTime.of(8, 0), stop.getArrivalTime());
        assertEquals(LocalTime.of(8, 15), stop.getDepartureTime());
        
        // Verify Translatable implementation
        assertEquals("stop", stop.getEntityType());
        assertEquals(1L, stop.getEntityId());
        assertEquals("Chennai Central", stop.getDefaultValue("name"));
    }
    
    @Test
    void testTranslationModel() {
        // Create a Translation
        Translation translation = new Translation(
            1L,
            "location",
            2L,
            "ta",
            "name",
            "சென்னை"
        );
        
        // Verify
        assertEquals(1L, translation.getId());
        assertEquals("location", translation.getEntityType());
        assertEquals(2L, translation.getEntityId());
        assertEquals("ta", translation.getLanguageCode());
        assertEquals("name", translation.getFieldName());
        assertEquals("சென்னை", translation.getTranslatedValue());
    }

    @Test
    void testAddTranslationToLocation() {
        // Create a Location
        Location location = new Location(
            new Location.LocationId(1L),
            "Chennai",
            13.0827,
            80.2707
        );

        // Create a Translation for this location
        Translation translation = new Translation(
            1L,
            "location",
            1L,
            "ta",
            "name",
            "சென்னை"
        );

        // Add the translation to the location
        location.getTranslations().add(translation);

        // Verify translation was added
        assertNotNull(location.getTranslations());
        assertTrue(location.getTranslations().size() > 0);
        assertEquals(translation, location.getTranslations().get(0));
    }
}
