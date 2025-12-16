package com.perundhu.adapter.in.rest;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;

import lombok.Data;
import lombok.RequiredArgsConstructor;

/**
 * REST controller for admin bus management operations.
 * Allows admins to update bus timing information based on user reports.
 */
@RestController
@RequestMapping("/api/v1/admin/buses")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class BusAdminController {

  private static final Logger log = LoggerFactory.getLogger(BusAdminController.class);
  private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

  private final BusJpaRepository busRepository;

  /**
   * Get bus details by ID
   * 
   * @param id Bus ID
   * @return Bus details
   */
  @GetMapping("/{id}")
  public ResponseEntity<?> getBusById(@PathVariable Long id) {
    log.info("Admin request to get bus details for ID: {}", id);

    return busRepository.findById(id)
        .map(bus -> {
          return ResponseEntity.ok(Map.of(
              "id", bus.getId(),
              "name", bus.getName(),
              "busNumber", bus.getBusNumber(),
              "departureTime", bus.getDepartureTime() != null ? bus.getDepartureTime().format(TIME_FORMATTER) : null,
              "arrivalTime", bus.getArrivalTime() != null ? bus.getArrivalTime().format(TIME_FORMATTER) : null,
              "fromLocation", bus.getFromLocation() != null ? bus.getFromLocation().getName() : null,
              "toLocation", bus.getToLocation() != null ? bus.getToLocation().getName() : null,
              "category", bus.getCategory(),
              "capacity", bus.getCapacity(),
              "active", bus.getActive()));
        })
        .orElse(ResponseEntity.notFound().build());
  }

  /**
   * Update bus timing information.
   * This endpoint is used by admins to apply timing corrections from user
   * reports.
   * 
   * @param id      Bus ID
   * @param request Update request containing new departure and/or arrival times
   * @return Updated bus details
   */
  @PutMapping("/{id}")
  public ResponseEntity<?> updateBusTiming(@PathVariable Long id, @RequestBody BusTimingUpdateRequest request) {
    log.info("Admin request to update bus timing for ID: {} with departure={}, arrival={}",
        id, request.getDepartureTime(), request.getArrivalTime());

    return busRepository.findById(id)
        .map(bus -> {
          boolean updated = false;

          // Update departure time if provided
          if (request.getDepartureTime() != null && !request.getDepartureTime().isBlank()) {
            try {
              LocalTime newDepartureTime = LocalTime.parse(request.getDepartureTime(), TIME_FORMATTER);
              LocalTime oldDepartureTime = bus.getDepartureTime();
              bus.setDepartureTime(newDepartureTime);
              updated = true;
              log.info("Updated bus {} departure time from {} to {}", id, oldDepartureTime, newDepartureTime);
            } catch (DateTimeParseException e) {
              log.warn("Invalid departure time format: {}", request.getDepartureTime());
              return ResponseEntity.badRequest().body(Map.of(
                  "error", "Invalid departure time format. Expected HH:mm",
                  "provided", request.getDepartureTime()));
            }
          }

          // Update arrival time if provided
          if (request.getArrivalTime() != null && !request.getArrivalTime().isBlank()) {
            try {
              LocalTime newArrivalTime = LocalTime.parse(request.getArrivalTime(), TIME_FORMATTER);
              LocalTime oldArrivalTime = bus.getArrivalTime();
              bus.setArrivalTime(newArrivalTime);
              updated = true;
              log.info("Updated bus {} arrival time from {} to {}", id, oldArrivalTime, newArrivalTime);
            } catch (DateTimeParseException e) {
              log.warn("Invalid arrival time format: {}", request.getArrivalTime());
              return ResponseEntity.badRequest().body(Map.of(
                  "error", "Invalid arrival time format. Expected HH:mm",
                  "provided", request.getArrivalTime()));
            }
          }

          if (!updated) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "No valid timing data provided",
                "message", "Please provide departureTime and/or arrivalTime in HH:mm format"));
          }

          // Save the updated bus
          BusJpaEntity savedBus = busRepository.save(bus);
          log.info("Successfully updated bus {} timing", id);

          return ResponseEntity.ok(Map.of(
              "success", true,
              "message", "Bus timing updated successfully",
              "bus", Map.of(
                  "id", savedBus.getId(),
                  "name", savedBus.getName(),
                  "busNumber", savedBus.getBusNumber(),
                  "departureTime",
                  savedBus.getDepartureTime() != null ? savedBus.getDepartureTime().format(TIME_FORMATTER) : null,
                  "arrivalTime",
                  savedBus.getArrivalTime() != null ? savedBus.getArrivalTime().format(TIME_FORMATTER) : null,
                  "fromLocation", savedBus.getFromLocation() != null ? savedBus.getFromLocation().getName() : null,
                  "toLocation", savedBus.getToLocation() != null ? savedBus.getToLocation().getName() : null)));
        })
        .orElse(ResponseEntity.notFound().build());
  }

  /**
   * Request DTO for bus timing updates
   */
  @Data
  public static class BusTimingUpdateRequest {
    private String departureTime; // Format: HH:mm
    private String arrivalTime; // Format: HH:mm
  }
}
