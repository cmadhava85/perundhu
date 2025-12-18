package com.perundhu.adapter.in.rest;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.infrastructure.service.BusDatabaseService;
import com.perundhu.infrastructure.service.BusDatabaseService.BusDetail;
import com.perundhu.infrastructure.service.BusDatabaseService.BusListItem;
import com.perundhu.infrastructure.service.BusDatabaseService.LocationSuggestion;
import com.perundhu.infrastructure.service.BusDatabaseService.StopDetail;
import com.perundhu.infrastructure.service.BusDatabaseService.StopInput;
import com.perundhu.infrastructure.service.BusDatabaseService.StopResult;
import com.perundhu.infrastructure.service.BusDatabaseService.UpdateResult;

import lombok.RequiredArgsConstructor;

/**
 * REST controller for admin bus database management.
 * Provides paginated access to all buses with search, filter, and CRUD
 * operations.
 */
@RestController
@RequestMapping("/api/v1/admin/bus-database")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class BusDatabaseAdminController {

  private static final Logger log = LoggerFactory.getLogger(BusDatabaseAdminController.class);

  private final BusDatabaseService busDatabaseService;

  /**
   * Get paginated list of buses with optional search and filters
   *
   * @param page        Page number (0-indexed)
   * @param size        Page size (default 100)
   * @param search      Search query (matches bus number, name, locations)
   * @param origin      Filter by origin location
   * @param destination Filter by destination location
   * @param activeOnly  If true, only return active buses
   * @param sortBy      Sort field (default: busNumber)
   * @param sortDir     Sort direction (asc/desc)
   * @return Paginated list of buses
   */
  @GetMapping("/buses")
  public ResponseEntity<Page<BusListItem>> getBuses(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "100") int size,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) String origin,
      @RequestParam(required = false) String destination,
      @RequestParam(required = false) Boolean activeOnly,
      @RequestParam(defaultValue = "busNumber") String sortBy,
      @RequestParam(defaultValue = "asc") String sortDir) {

    log.info("Admin fetching buses - page: {}, size: {}, search: {}", page, size, search);

    Sort sort = sortDir.equalsIgnoreCase("desc")
        ? Sort.by(sortBy).descending()
        : Sort.by(sortBy).ascending();

    Pageable pageable = PageRequest.of(page, size, sort);

    Page<BusListItem> result = busDatabaseService.getBuses(
        search, origin, destination, activeOnly, pageable);

    return ResponseEntity.ok(result);
  }

  /**
   * Get bus details by ID including all stops
   */
  @GetMapping("/buses/{id}")
  public ResponseEntity<?> getBusById(@PathVariable Long id) {
    log.info("Admin fetching bus details for ID: {}", id);

    return busDatabaseService.getBusById(id)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  /**
   * Get stops for a specific bus
   */
  @GetMapping("/buses/{id}/stops")
  public ResponseEntity<List<StopDetail>> getStopsForBus(@PathVariable Long id) {
    log.info("Admin fetching stops for bus ID: {}", id);

    List<StopDetail> stops = busDatabaseService.getStopsForBus(id);
    return ResponseEntity.ok(stops);
  }

  /**
   * Update bus timing
   */
  @PutMapping("/buses/{id}/timing")
  public ResponseEntity<?> updateBusTiming(
      @PathVariable Long id,
      @RequestBody TimingUpdateRequest request) {

    log.info("Admin updating timing for bus ID: {} - departure: {}, arrival: {}",
        id, request.departureTime, request.arrivalTime);

    UpdateResult result = busDatabaseService.updateBusTiming(
        id, request.departureTime, request.arrivalTime);

    return switch (result) {
      case UpdateResult.Success(BusDetail bus) -> ResponseEntity.ok(Map.of(
          "success", true,
          "message", "Bus timing updated successfully",
          "bus", bus));
      case UpdateResult.NotFound() -> ResponseEntity.notFound().build();
      case UpdateResult.ValidationError(String error, String details) -> ResponseEntity.badRequest()
          .body(Map.of("error", error, "details", details));
    };
  }

  /**
   * Toggle bus active status
   */
  @PutMapping("/buses/{id}/active")
  public ResponseEntity<?> toggleBusActive(
      @PathVariable Long id,
      @RequestBody ActiveToggleRequest request) {

    log.info("Admin toggling active status for bus ID: {} to {}", id, request.active);

    UpdateResult result = busDatabaseService.toggleBusActive(id, request.active);

    return switch (result) {
      case UpdateResult.Success(BusDetail bus) -> ResponseEntity.ok(Map.of(
          "success", true,
          "message", request.active ? "Bus activated" : "Bus deactivated",
          "bus", bus));
      case UpdateResult.NotFound() -> ResponseEntity.notFound().build();
      case UpdateResult.ValidationError(String error, String details) -> ResponseEntity.badRequest()
          .body(Map.of("error", error, "details", details));
    };
  }

  /**
   * Add a new stop to a bus
   */
  @PostMapping("/buses/{busId}/stops")
  public ResponseEntity<?> addStop(
      @PathVariable Long busId,
      @RequestBody StopInputRequest request) {

    log.info("Admin adding stop to bus ID: {} - location: {}", busId, request.locationName);

    StopInput input = new StopInput(
        request.locationName,
        request.stopOrder,
        request.arrivalTime,
        request.departureTime);

    StopResult result = busDatabaseService.addStop(busId, input);

    return switch (result) {
      case StopResult.Success(StopDetail stop) -> ResponseEntity.ok(Map.of(
          "success", true,
          "message", "Stop added successfully",
          "stop", stop));
      case StopResult.BusNotFound() -> ResponseEntity.notFound().build();
      case StopResult.StopNotFound() -> ResponseEntity.notFound().build();
      case StopResult.Deleted() -> ResponseEntity.ok(Map.of("success", true));
    };
  }

  /**
   * Update an existing stop
   */
  @PutMapping("/stops/{stopId}")
  public ResponseEntity<?> updateStop(
      @PathVariable Long stopId,
      @RequestBody StopInputRequest request) {

    log.info("Admin updating stop ID: {}", stopId);

    StopInput input = new StopInput(
        request.locationName,
        request.stopOrder,
        request.arrivalTime,
        request.departureTime);

    StopResult result = busDatabaseService.updateStop(stopId, input);

    return switch (result) {
      case StopResult.Success(StopDetail stop) -> ResponseEntity.ok(Map.of(
          "success", true,
          "message", "Stop updated successfully",
          "stop", stop));
      case StopResult.BusNotFound() -> ResponseEntity.notFound().build();
      case StopResult.StopNotFound() -> ResponseEntity.notFound().build();
      case StopResult.Deleted() -> ResponseEntity.ok(Map.of("success", true));
    };
  }

  /**
   * Delete a stop
   */
  @DeleteMapping("/stops/{stopId}")
  public ResponseEntity<?> deleteStop(@PathVariable Long stopId) {
    log.info("Admin deleting stop ID: {}", stopId);

    StopResult result = busDatabaseService.deleteStop(stopId);

    return switch (result) {
      case StopResult.Success(StopDetail stop) -> ResponseEntity.ok(Map.of("success", true));
      case StopResult.BusNotFound() -> ResponseEntity.notFound().build();
      case StopResult.StopNotFound() -> ResponseEntity.notFound().build();
      case StopResult.Deleted() -> ResponseEntity.ok(Map.of(
          "success", true,
          "message", "Stop deleted successfully"));
    };
  }

  /**
   * Get unique origins for filter dropdown
   */
  @GetMapping("/filters/origins")
  public ResponseEntity<List<String>> getUniqueOrigins() {
    return ResponseEntity.ok(busDatabaseService.getUniqueOrigins());
  }

  /**
   * Get unique destinations for filter dropdown
   */
  @GetMapping("/filters/destinations")
  public ResponseEntity<List<String>> getUniqueDestinations() {
    return ResponseEntity.ok(busDatabaseService.getUniqueDestinations());
  }

  /**
   * Search locations for autocomplete
   */
  @GetMapping("/locations/search")
  public ResponseEntity<List<LocationSuggestion>> searchLocations(
      @RequestParam String query) {
    return ResponseEntity.ok(busDatabaseService.searchLocations(query));
  }

  // Request DTOs

  public record TimingUpdateRequest(
      String departureTime,
      String arrivalTime) {
  }

  public record ActiveToggleRequest(
      boolean active) {
  }

  public record StopInputRequest(
      String locationName,
      Integer stopOrder,
      String arrivalTime,
      String departureTime) {
  }
}
