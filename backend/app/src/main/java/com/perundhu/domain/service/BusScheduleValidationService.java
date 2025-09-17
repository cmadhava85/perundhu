package com.perundhu.domain.service;

import com.perundhu.domain.model.BusSchedule;
import com.perundhu.domain.model.Location;
import java.time.LocalTime;
import java.util.List;

/**
 * Domain service interface for validating bus schedule data.
 * This service ensures that bus schedules have valid bus numbers, times, and
 * locations.
 */
public interface BusScheduleValidationService {

    /**
     * Validates a bus schedule.
     * 
     * @param busSchedule The bus schedule to validate
     * @return true if the bus schedule is valid, false otherwise
     */
    boolean validateBusSchedule(BusSchedule busSchedule);

    /**
     * Validates the timing of a bus schedule.
     * 
     * @param departureTime The departure time
     * @param arrivalTime   The arrival time
     * @return true if the timing is valid, false otherwise
     */
    boolean isValidScheduleTiming(LocalTime departureTime, LocalTime arrivalTime);

    /**
     * Validates a route between two locations.
     * 
     * @param fromLocation The origin location
     * @param toLocation   The destination location
     * @return true if the route is valid, false otherwise
     */
    boolean isValidRoute(Location fromLocation, Location toLocation);

    /**
     * Validates the consistency of multiple bus schedules.
     * 
     * @param schedules The list of bus schedules to validate
     * @return true if all schedules are consistent, false otherwise
     */
    boolean validateScheduleConsistency(List<BusSchedule> schedules);
}
