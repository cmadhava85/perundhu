package com.perundhu.adapter.in.rest;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.service.BusAdminService;
import com.perundhu.application.service.BusAdminService.BusDetails;
import com.perundhu.application.service.BusAdminService.UpdateResult;

import lombok.Data;
import lombok.RequiredArgsConstructor;

/**
 * REST controller for admin bus management operations.
 * Allows admins to update bus timing information based on user reports.
 * 
 * Follows hexagonal architecture - uses application service, not infrastructure
 * repositories.
 */
@RestController
@RequestMapping("/api/v1/admin/buses")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class BusAdminController {

  private static final Logger log = LoggerFactory.getLogger(BusAdminController.class);

  private final BusAdminService busAdminService;

  /**
   * Get bus details by ID
   * 
   * @param id Bus ID
   * @return Bus details
   */
  @GetMapping("/{id}")
  public ResponseEntity<?> getBusById(@PathVariable Long id) {
    log.info("Admin request to get bus details for ID: {}", id);

    return busAdminService.getBusById(id)
        .map(bus -> ResponseEntity.ok(Map.of(
            "id", bus.id(),
            "name", bus.name(),
            "busNumber", bus.busNumber(),
            "departureTime", bus.departureTime() != null ? bus.departureTime() : "",
            "arrivalTime", bus.arrivalTime() != null ? bus.arrivalTime() : "",
            "fromLocation", bus.fromLocation() != null ? bus.fromLocation() : "",
            "toLocation", bus.toLocation() != null ? bus.toLocation() : "",
            "category", bus.category() != null ? bus.category() : "",
            "capacity", bus.capacity() != null ? bus.capacity() : 50,
            "active", bus.active() != null ? bus.active() : true)))
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

    UpdateResult result = busAdminService.updateBusTiming(id, request.getDepartureTime(), request.getArrivalTime());

    if (result instanceof UpdateResult.Success success) {
      BusDetails bus = success.busDetails();
      return ResponseEntity.ok(Map.of(
          "success", true,
          "message", "Bus timing updated successfully",
          "bus", Map.of(
              "id", bus.id(),
              "name", bus.name(),
              "busNumber", bus.busNumber(),
              "departureTime", bus.departureTime() != null ? bus.departureTime() : "",
              "arrivalTime", bus.arrivalTime() != null ? bus.arrivalTime() : "",
              "fromLocation", bus.fromLocation() != null ? bus.fromLocation() : "",
              "toLocation", bus.toLocation() != null ? bus.toLocation() : "")));
    } else if (result instanceof UpdateResult.NotFound) {
      return ResponseEntity.notFound().build();
    } else if (result instanceof UpdateResult.ValidationError error) {
      return ResponseEntity.badRequest().body(Map.of(
          "error", error.error(),
          "provided", error.details()));
    }
    return ResponseEntity.internalServerError().body(Map.of("error", "Unexpected error"));
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
