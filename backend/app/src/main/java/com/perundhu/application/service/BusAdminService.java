package com.perundhu.application.service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.port.BusRepository;

import lombok.RequiredArgsConstructor;

/**
 * Application service for admin bus management operations.
 * Follows hexagonal architecture - uses domain ports, not infrastructure
 * repositories.
 */
@Service
@RequiredArgsConstructor
public class BusAdminService {

  private static final Logger log = LoggerFactory.getLogger(BusAdminService.class);
  private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

  private final BusRepository busRepository;

  /**
   * Get bus details by ID
   * 
   * @param id Bus ID
   * @return Optional containing bus details if found
   */
  public Optional<BusDetails> getBusById(Long id) {
    log.info("Getting bus details for ID: {}", id);
    return busRepository.findById(id)
        .map(this::toBusDetails);
  }

  /**
   * Update bus timing information
   * 
   * @param id            Bus ID
   * @param departureTime New departure time (HH:mm format), or null to skip
   * @param arrivalTime   New arrival time (HH:mm format), or null to skip
   * @return Result of the update operation
   */
  @Transactional
  public UpdateResult updateBusTiming(Long id, String departureTime, String arrivalTime) {
    log.info("Updating bus timing for ID: {} with departure={}, arrival={}", id, departureTime, arrivalTime);

    Optional<Bus> optBus = busRepository.findById(id);
    if (optBus.isEmpty()) {
      return UpdateResult.notFound();
    }

    Bus bus = optBus.get();
    boolean updated = false;

    // Update departure time if provided
    if (departureTime != null && !departureTime.isBlank()) {
      try {
        LocalTime newDepartureTime = LocalTime.parse(departureTime, TIME_FORMATTER);
        LocalTime oldDepartureTime = bus.departureTime();
        bus = bus.withDepartureTime(newDepartureTime);
        updated = true;
        log.info("Updated bus {} departure time from {} to {}", id, oldDepartureTime, newDepartureTime);
      } catch (DateTimeParseException e) {
        log.warn("Invalid departure time format: {}", departureTime);
        return UpdateResult.validationError(
            "Invalid departure time format. Expected HH:mm", departureTime);
      }
    }

    // Update arrival time if provided
    if (arrivalTime != null && !arrivalTime.isBlank()) {
      try {
        LocalTime newArrivalTime = LocalTime.parse(arrivalTime, TIME_FORMATTER);
        LocalTime oldArrivalTime = bus.arrivalTime();
        bus = bus.withArrivalTime(newArrivalTime);
        updated = true;
        log.info("Updated bus {} arrival time from {} to {}", id, oldArrivalTime, newArrivalTime);
      } catch (DateTimeParseException e) {
        log.warn("Invalid arrival time format: {}", arrivalTime);
        return UpdateResult.validationError(
            "Invalid arrival time format. Expected HH:mm", arrivalTime);
      }
    }

    if (!updated) {
      return UpdateResult.validationError(
          "No valid timing data provided",
          "Please provide departureTime and/or arrivalTime in HH:mm format");
    }

    // Save the updated bus
    Bus savedBus = busRepository.save(bus);
    log.info("Successfully updated bus {} timing", id);

    return UpdateResult.success(toBusDetails(savedBus));
  }

  /**
   * Deactivate a bus (set active = false)
   * 
   * @param id Bus ID
   * @return true if bus was deactivated, false if not found
   */
  @Transactional
  public boolean deactivateBus(Long id) {
    Optional<Bus> optBus = busRepository.findById(id);
    if (optBus.isEmpty()) {
      return false;
    }

    Bus bus = optBus.get();
    Bus deactivatedBus = bus.withActive(false);
    busRepository.save(deactivatedBus);
    log.info("Deactivated bus {} (ID: {})", bus.busNumber(), id);
    return true;
  }

  private BusDetails toBusDetails(Bus bus) {
    return new BusDetails(
        bus.id().value(),
        bus.name(),
        bus.busNumber(),
        bus.departureTime() != null ? bus.departureTime().format(TIME_FORMATTER) : null,
        bus.arrivalTime() != null ? bus.arrivalTime().format(TIME_FORMATTER) : null,
        bus.fromLocation() != null ? bus.fromLocation().name() : null,
        bus.toLocation() != null ? bus.toLocation().name() : null,
        bus.category(),
        bus.capacity(),
        bus.active());
  }

  /**
   * Bus details DTO for API responses
   */
  public record BusDetails(
      Long id,
      String name,
      String busNumber,
      String departureTime,
      String arrivalTime,
      String fromLocation,
      String toLocation,
      String category,
      Integer capacity,
      Boolean active) {
  }

  /**
   * Result of an update operation
   */
  public sealed interface UpdateResult {
    static UpdateResult success(BusDetails busDetails) {
      return new Success(busDetails);
    }

    static UpdateResult notFound() {
      return new NotFound();
    }

    static UpdateResult validationError(String error, String details) {
      return new ValidationError(error, details);
    }

    record Success(BusDetails busDetails) implements UpdateResult {
    }

    record NotFound() implements UpdateResult {
    }

    record ValidationError(String error, String details) implements UpdateResult {
    }
  }
}
