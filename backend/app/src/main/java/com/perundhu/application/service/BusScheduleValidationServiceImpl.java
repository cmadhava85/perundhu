package com.perundhu.application.service;

import com.perundhu.domain.model.BusSchedule;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.service.BusScheduleValidationService;
import com.perundhu.domain.service.LocationValidationService;
import com.perundhu.domain.service.RouteValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;

/**
 * Implementation of bus schedule validation service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BusScheduleValidationServiceImpl implements BusScheduleValidationService {

  private final LocationValidationService locationValidationService;
  private final RouteValidationService routeValidationService;

  @Override
  public boolean validateBusSchedule(BusSchedule schedule) {
    if (schedule == null) {
      return false;
    }

    // Validate bus number
    if (schedule.busNumber() == null || schedule.busNumber().trim().isEmpty()) {
      log.warn("Bus schedule validation failed: Missing bus number");
      return false;
    }

    // Validate locations
    if (schedule.origin() == null || schedule.destination() == null) {
      log.warn("Bus schedule validation failed: Missing locations");
      return false;
    }

    // Validate departure and arrival times
    if (schedule.departureTime() == null || schedule.arrivalTime() == null) {
      log.warn("Bus schedule validation failed: Missing departure or arrival time");
      return false;
    }

    // Validate timing sequence
    if (!isValidScheduleTiming(schedule.departureTime(), schedule.arrivalTime())) {
      log.warn("Bus schedule validation failed: Invalid timing sequence");
      return false;
    }

    // Validate route
    if (!isValidRoute(schedule.origin(), schedule.destination())) {
      log.warn("Bus schedule validation failed: Invalid route");
      return false;
    }

    return true;
  }

  @Override
  public boolean isValidScheduleTiming(LocalTime departureTime, LocalTime arrivalTime) {
    if (departureTime == null || arrivalTime == null) {
      return false;
    }

    // Departure time must be before arrival time
    if (!departureTime.isBefore(arrivalTime)) {
      return false;
    }

    // Check for reasonable schedule timing (e.g., max 24 hours travel time)
    long hoursBetween = java.time.Duration.between(departureTime, arrivalTime).toHours();
    return hoursBetween >= 0 && hoursBetween <= 24;
  }

  @Override
  public boolean isValidRoute(Location fromLocation, Location toLocation) {
    if (fromLocation == null || toLocation == null) {
      return false;
    }

    // Validate both locations exist and are valid
    if (!locationValidationService.isValidLocation(fromLocation.name()) ||
        !locationValidationService.isValidLocation(toLocation.name())) {
      return false;
    }

    // Use route validation service to check if this is a valid route
    return routeValidationService.isValidRoute(fromLocation, toLocation);
  }

  @Override
  public boolean validateScheduleConsistency(List<BusSchedule> schedules) {
    if (schedules == null || schedules.isEmpty()) {
      return true; // Empty list is considered valid
    }

    for (BusSchedule schedule : schedules) {
      if (!validateBusSchedule(schedule)) {
        return false;
      }
    }

    // Additional consistency checks can be added here
    // e.g., checking for overlapping schedules, reasonable time gaps, etc.

    return true;
  }
}