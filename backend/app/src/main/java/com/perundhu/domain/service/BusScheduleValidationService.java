package com.perundhu.domain.service;

import java.time.LocalTime;

import com.perundhu.domain.model.BusSchedule;
import com.perundhu.domain.model.Location;

/**
 * Domain service for validating bus schedule data.
 * This service ensures that bus schedules have valid bus numbers, times, and locations.
 */
public class BusScheduleValidationService {
    
    private final LocationValidationService locationValidationService;
    private final RouteValidationService routeValidationService;
    
    public BusScheduleValidationService(
        LocationValidationService locationValidationService,
        RouteValidationService routeValidationService
    ) {
        this.locationValidationService = locationValidationService;
        this.routeValidationService = routeValidationService;
    }
    
    /**
     * Validates a bus schedule.
     * 
     * @param busSchedule The bus schedule to validate
     * @throws IllegalArgumentException if the bus schedule is invalid
     */
    public void validateBusSchedule(BusSchedule busSchedule) {
        // Validate bus number
        if (busSchedule.getBusNumber() == null || busSchedule.getBusNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Bus number cannot be empty");
        }
        
        // Validate from and to locations using location validation service
        Location from = busSchedule.getOrigin();
        Location to = busSchedule.getDestination();
        
        locationValidationService.validateLocation(from);
        locationValidationService.validateLocation(to);
        
        // Validate route using route validation service
        routeValidationService.validateRoute(from, to);
        
        // Validate departure and arrival times
        LocalTime departureTime = busSchedule.getDepartureTime();
        LocalTime arrivalTime = busSchedule.getArrivalTime();
        
        if (departureTime == null) {
            throw new IllegalArgumentException("Departure time cannot be null");
        }
        
        if (arrivalTime == null) {
            throw new IllegalArgumentException("Arrival time cannot be null");
        }
        
        // Ensure that arrival time is after departure time
        if (!arrivalTime.isAfter(departureTime)) {
            throw new IllegalArgumentException("Arrival time must be after departure time");
        }
    }
}