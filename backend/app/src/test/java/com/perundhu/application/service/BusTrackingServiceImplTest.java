package com.perundhu.application.service;

import com.perundhu.application.dto.BusLocationDTO;
import com.perundhu.application.dto.BusLocationReportDTO;
import com.perundhu.application.dto.RewardPointsDTO;
import com.perundhu.domain.model.*;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.domain.service.RouteValidationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Bus Tracking Service Implementation Tests")
class BusTrackingServiceImplTest {

    @Mock
    private BusRepository busRepository;

    @Mock
    private StopRepository stopRepository;

    @Mock
    private RouteValidationService routeValidationService;

    @InjectMocks
    private BusTrackingServiceImpl busTrackingService;

    // Test data using records
    private record TestData(
            Bus bus,
            Stop stop,
            BusLocationReportDTO validReport,
            BusLocationReportDTO invalidReport) {
    }

    private TestData testData;

    @BeforeEach
    void setUp() {
        // Initialize mocks explicitly to avoid issues
        MockitoAnnotations.openMocks(this);

        // Set up test data
        var fromLocation = createLocation(101L, "Chennai", 13.0827, 80.2707);
        var toLocation = createLocation(102L, "Bangalore", 12.9716, 77.5946);

        var bus = createBus(1L, "Express Chennai-Bangalore", "XP101", fromLocation, toLocation);
        // Pass the actual fromLocation object rather than just its ID
        var stop = createStop(1L, "Chennai Central", fromLocation, 1, bus);
        var validReport = createValidReport();
        var invalidReport = createInvalidReport();

        testData = new TestData(bus, stop, validReport, invalidReport);
    }

    // Helper methods to create objects safely
    private Location createLocation(Long id, String name, double latitude, double longitude) {
        try {
            return new Location(new LocationId(id), name, null, latitude, longitude);
        } catch (Exception e) {
            // Fallback if constructor fails
            Location location = new Location(null, name, null, latitude, longitude);
            return location;
        }
    }

    private Bus createBus(Long id, String name, String busNumber, Location from, Location to) {
        try {
            return new Bus(
                    BusId.of(id),
                    busNumber != null ? busNumber : "",
                    name != null ? name : "",
                    "Test Operator",
                    "Express",
                    from,
                    to,
                    LocalTime.of(8, 30),
                    LocalTime.of(14, 0),
                    50,
                    Arrays.asList("AC"));
        } catch (Exception e) {
            // Fallback with minimal required parameters
            return new Bus(
                    BusId.of(id != null ? id : 0L),
                    busNumber != null ? busNumber : "",
                    name != null ? name : "",
                    "Default Operator",
                    "Local",
                    from != null ? from : createLocation(0L, "Default", 0.0, 0.0),
                    to != null ? to : createLocation(0L, "Default", 0.0, 0.0),
                    LocalTime.of(8, 30),
                    LocalTime.of(14, 0),
                    50,
                    Arrays.asList("Basic"));
        }
    }

    private Stop createStop(Long id, String name, Location location, int sequence, Bus bus) {
        try {
            // Create a proper Stop object with all required parameters
            return new Stop(
                    new StopId(id),
                    name,
                    location,
                    LocalTime.of(8, 30), // arrivalTime
                    LocalTime.of(8, 35), // departureTime
                    sequence, // stopOrder
                    Arrays.asList("Standard") // features
            );
        } catch (Exception e) {
            // Use Stop.create() factory method for record-based Stop
            return Stop.create(
                    new StopId(id),
                    name,
                    location,
                    LocalTime.of(8, 30),
                    LocalTime.of(8, 35),
                    sequence);
        }
    }

    private BusLocationReportDTO createValidReport() {
        return new BusLocationReportDTO(
                1L, // busId
                null, // stopId (null means en-route)
                "user123", // userId
                LocalDateTime.now().toString(), // timestamp as string
                13.0827, // latitude
                80.2707, // longitude
                10.0, // accuracy in meters
                45.0, // speed in meters per second
                90.0, // heading in degrees
                "Android Test Device" // deviceInfo
        );
    }

    private BusLocationReportDTO createInvalidReport() {
        return new BusLocationReportDTO(
                999L, // busId (invalid)
                null, // stopId
                "user123", // userId
                LocalDateTime.now().toString(), // timestamp as string
                13.0827, // latitude
                80.2707, // longitude
                10.0, // accuracy in meters
                45.0, // speed in meters per second
                90.0, // heading in degrees
                "Android Test Device" // deviceInfo
        );
    }

    @Nested
    @DisplayName("Process Location Report Tests")
    class ProcessLocationReportTests {
        // ...existing code...
    }
}
