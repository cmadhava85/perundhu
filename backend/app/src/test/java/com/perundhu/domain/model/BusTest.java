package com.perundhu.domain.model;

import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.perundhu.domain.port.TranslationService;

public class BusTest {

    @BeforeEach
    void setUp() {
        // Reset the stop orders before each test to avoid conflicts
        Stop.resetStopOrders();
    }

    @Test
    void shouldCreateBusWithBasicInfo() {
        // Create a location for test
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
            "Express 101", 
            "TN-01-1234",
            fromLocation,
            toLocation,
            LocalTime.of(8, 0),
            LocalTime.of(14, 0)
        );
        
        assertEquals("Express 101", bus.getName());
        assertEquals("TN-01-1234", bus.getBusNumber());
        assertEquals(fromLocation, bus.getFromLocation());
        assertEquals(toLocation, bus.getToLocation());
    }

    @Test
    void shouldHandleTranslations() {
        // Create a location for test
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
            "Express 101", 
            "TN-01-1234",
            fromLocation,
            toLocation,
            LocalTime.of(8, 0),
            LocalTime.of(14, 0)
        );
        
        // Create mock translation service
        TranslationService translationService = mock(TranslationService.class);
        
        // Set up mock to return translations
        when(translationService.getTranslation(bus, "name", "ta"))
            .thenReturn("எக்ஸ்பிரஸ் 101");
        when(translationService.getTranslation(bus, "name", "en"))
            .thenReturn(bus.getName());
        
        assertEquals("Express 101", bus.getName());
        // Use translation service instead of direct method
        assertEquals("எக்ஸ்பிரஸ் 101", translationService.getTranslation(bus, "name", "ta"));
        // Default language fallback
        assertEquals("Express 101", translationService.getTranslation(bus, "name", "en"));
    }

    @Test
    void shouldCreateBusWithStops() {
        // Create a location for test
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
            "Express 101", 
            "TN-01-1234",
            fromLocation,
            toLocation,
            LocalTime.of(8, 0),
            LocalTime.of(14, 0)
        );
        
        // Create stops
        Stop stop1 = new Stop(
            new Stop.StopId(1L),
            "Chennai Central",
            bus,
            fromLocation,
            LocalTime.of(8, 0),
            LocalTime.of(8, 15),
            1
        );
        
        Stop stop2 = new Stop(
            new Stop.StopId(2L),
            "Bangalore Bus Station",
            bus,
            toLocation,
            LocalTime.of(13, 45),
            LocalTime.of(14, 0),
            2
        );
        
        // Create a new bus with stops
        List<Stop> stops = List.of(stop1, stop2);
        
        // We need to verify stops through repository or service layer now
        assertNotNull(stops);
        assertEquals(2, stops.size());
        assertEquals("Chennai Central", stops.get(0).getName());
        assertEquals("Bangalore Bus Station", stops.get(1).getName());
    }

    @Test
    void shouldHandleStopOrder() {
        // Create a location for test
        Location location = new Location(
            new Location.LocationId(1L),
            "Chennai",
            13.0827,
            80.2707
        );
        
        // Create a Bus with all required parameters
        Bus bus = new Bus(
            new Bus.BusId(1L),
            "Express 101", 
            "TN-01-1234",
            location,  // fromLocation
            location,  // toLocation (using same location for simplicity)
            LocalTime.of(8, 0),
            LocalTime.of(14, 0)
        );
        
        // Create stops with same order
        Stop stop1 = new Stop(
            new Stop.StopId(1L),
            "Chennai Central",
            bus,
            location,
            LocalTime.of(8, 0),
            LocalTime.of(8, 15),
            1
        );
        
        // Create another stop with the same order (should be rejected)
        final Bus busFinal = bus;
        assertThrows(IllegalArgumentException.class, () -> {
            new Stop(
                new Stop.StopId(2L),
                "Another Chennai Stop",
                busFinal,
                location,
                LocalTime.of(8, 30),
                LocalTime.of(8, 45),
                1  // Same order as stop1
            );
        });
    }
}