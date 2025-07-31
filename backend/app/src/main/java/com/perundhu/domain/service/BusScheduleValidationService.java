package com.perundhu.domain.service;

import com.perundhu.domain.model.BusSchedule;

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
     * @throws IllegalArgumentException if the bus schedule is invalid
     */
    void validateBusSchedule(BusSchedule busSchedule);
}
