package com.perundhu.domain.service;

import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import com.perundhu.domain.model.BusSchedule;
import com.perundhu.domain.model.Location;

/**
 * Unit tests for the BusScheduleValidationService using the hexagonal architecture.
 * These tests verify that the validation logic correctly identifies invalid bus schedules.
 */
@Tag("hexagonal")
public class BusScheduleValidationServiceTest {

    private BusScheduleValidationService validationService;
    private LocationValidationService locationValidationService;
    private RouteValidationService routeValidationService;

    @BeforeEach
    void setUp() {
        locationValidationService = new LocationValidationService();
        routeValidationService = new RouteValidationService(locationValidationService);
        validationService = new BusScheduleValidationService(locationValidationService, routeValidationService);
    }

    @Test
    void testValidBusSchedule() {
        Location fromLocation = Location.reference(1L);
        Location toLocation = Location.reference(2L);
        BusSchedule validSchedule = createValidBusSchedule(fromLocation, toLocation);
        assertDoesNotThrow(() -> validationService.validateBusSchedule(validSchedule));
    }

    @Test
    void testInvalidName() {
        Location fromLocation = Location.reference(1L);
        Location toLocation = Location.reference(2L);
        BusSchedule scheduleWithNullNumber = createBusScheduleWithNullNumber(fromLocation, toLocation);
        assertThrows(IllegalArgumentException.class, () -> validationService.validateBusSchedule(scheduleWithNullNumber));
        BusSchedule scheduleWithEmptyNumber = createBusScheduleWithEmptyNumber(fromLocation, toLocation);
        assertThrows(IllegalArgumentException.class, () -> validationService.validateBusSchedule(scheduleWithEmptyNumber));
    }

    @Test
    void testSameFromAndToLocation() {
        Location sameLocation = Location.reference(1L);
        BusSchedule scheduleWithSameLocations = createValidBusSchedule(sameLocation, sameLocation);
        assertThrows(IllegalArgumentException.class, () -> validationService.validateBusSchedule(scheduleWithSameLocations));
    }

    @Test
    void testInvalidTimes() {
        Location fromLocation = Location.reference(1L);
        Location toLocation = Location.reference(2L);
        BusSchedule scheduleWithInvalidTimes = createBusScheduleWithInvalidTimes(fromLocation, toLocation);
        assertThrows(IllegalArgumentException.class, () -> validationService.validateBusSchedule(scheduleWithInvalidTimes));
    }

    // Helper methods to create different bus schedule scenarios
    private BusSchedule createValidBusSchedule(Location fromLocation, Location toLocation) {
        LocalTime departureTime = LocalTime.of(8, 0);
        LocalTime arrivalTime = LocalTime.of(10, 0);
        return new BusSchedule(
            null,
            "XP123",
            fromLocation,
            toLocation,
            departureTime,
            arrivalTime
        );
    }

    private BusSchedule createBusScheduleWithNullNumber(Location fromLocation, Location toLocation) {
        LocalTime departureTime = LocalTime.of(8, 0);
        LocalTime arrivalTime = LocalTime.of(10, 0);
        return new BusSchedule(
            null,
            null,
            fromLocation,
            toLocation,
            departureTime,
            arrivalTime
        );
    }

    private BusSchedule createBusScheduleWithEmptyNumber(Location fromLocation, Location toLocation) {
        LocalTime departureTime = LocalTime.of(8, 0);
        LocalTime arrivalTime = LocalTime.of(10, 0);
        return new BusSchedule(
            null,
            "",
            fromLocation,
            toLocation,
            departureTime,
            arrivalTime
        );
    }

    private BusSchedule createBusScheduleWithInvalidTimes(Location fromLocation, Location toLocation) {
        LocalTime departureTime = LocalTime.of(12, 0);
        LocalTime arrivalTime = LocalTime.of(10, 0);
        return new BusSchedule(
            null,
            "XP123",
            fromLocation,
            toLocation,
            departureTime,
            arrivalTime
        );
    }
}