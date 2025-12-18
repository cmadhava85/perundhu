package com.perundhu.infrastructure.service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.model.StopId;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.entity.StopJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.LocationJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.StopJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Application service for browsing and managing the bus database.
 * Provides paginated access to all buses with search and filter capabilities.
 */
@Service
@RequiredArgsConstructor
public class BusDatabaseService {

  private static final Logger log = LoggerFactory.getLogger(BusDatabaseService.class);
  private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

  private final BusJpaRepository busJpaRepository;
  private final StopJpaRepository stopJpaRepository;
  private final LocationJpaRepository locationJpaRepository;

  /**
   * Get paginated list of buses with optional search and filters
   */
  @Transactional(readOnly = true)
  public Page<BusListItem> getBuses(
      String search,
      String originFilter,
      String destinationFilter,
      Boolean activeOnly,
      Pageable pageable) {

    log.info("Fetching buses - search: {}, origin: {}, destination: {}, activeOnly: {}, page: {}",
        search, originFilter, destinationFilter, activeOnly, pageable.getPageNumber());

    // Get all buses and filter in memory (for now - can optimize with custom
    // queries later)
    List<BusJpaEntity> allBuses = busJpaRepository.findAll();

    // Apply filters
    List<BusJpaEntity> filteredBuses = allBuses.stream()
        .filter(bus -> {
          // Active filter
          if (activeOnly != null && activeOnly && (bus.getActive() == null || !bus.getActive())) {
            return false;
          }

          // Search filter (bus number, name, locations)
          if (search != null && !search.isBlank()) {
            String lowerSearch = search.toLowerCase().trim();
            boolean matchesBusNumber = bus.getBusNumber() != null &&
                bus.getBusNumber().toLowerCase().contains(lowerSearch);
            boolean matchesName = bus.getName() != null &&
                bus.getName().toLowerCase().contains(lowerSearch);
            boolean matchesFrom = bus.getFromLocation() != null &&
                bus.getFromLocation().getName() != null &&
                bus.getFromLocation().getName().toLowerCase().contains(lowerSearch);
            boolean matchesTo = bus.getToLocation() != null &&
                bus.getToLocation().getName() != null &&
                bus.getToLocation().getName().toLowerCase().contains(lowerSearch);

            if (!matchesBusNumber && !matchesName && !matchesFrom && !matchesTo) {
              return false;
            }
          }

          // Origin filter
          if (originFilter != null && !originFilter.isBlank()) {
            if (bus.getFromLocation() == null ||
                bus.getFromLocation().getName() == null ||
                !bus.getFromLocation().getName().toLowerCase()
                    .contains(originFilter.toLowerCase().trim())) {
              return false;
            }
          }

          // Destination filter
          if (destinationFilter != null && !destinationFilter.isBlank()) {
            if (bus.getToLocation() == null ||
                bus.getToLocation().getName() == null ||
                !bus.getToLocation().getName().toLowerCase()
                    .contains(destinationFilter.toLowerCase().trim())) {
              return false;
            }
          }

          return true;
        })
        .toList();

    // Get stop counts for each bus
    List<Long> busIds = filteredBuses.stream().map(BusJpaEntity::getId).toList();
    var stopCounts = getStopCounts(busIds);

    // Convert to list items
    List<BusListItem> items = filteredBuses.stream()
        .map(bus -> toBusListItem(bus, stopCounts.getOrDefault(bus.getId(), 0)))
        .toList();

    // Apply pagination
    int start = (int) pageable.getOffset();
    int end = Math.min(start + pageable.getPageSize(), items.size());

    if (start >= items.size()) {
      return new PageImpl<>(List.of(), pageable, items.size());
    }

    List<BusListItem> pageContent = items.subList(start, end);
    return new PageImpl<>(pageContent, pageable, items.size());
  }

  /**
   * Get stop counts for multiple buses efficiently
   */
  private java.util.Map<Long, Integer> getStopCounts(List<Long> busIds) {
    if (busIds == null || busIds.isEmpty()) {
      return java.util.Map.of();
    }

    java.util.Map<Long, Integer> counts = new java.util.HashMap<>();
    for (Long busId : busIds) {
      List<StopJpaEntity> stops = stopJpaRepository.findByBusId(busId);
      counts.put(busId, stops.size());
    }
    return counts;
  }

  /**
   * Get detailed stops for a specific bus
   */
  @Transactional(readOnly = true)
  public List<StopDetail> getStopsForBus(Long busId) {
    log.info("Fetching stops for bus ID: {}", busId);

    List<StopJpaEntity> stops = stopJpaRepository.findByBusIdOrderByStopOrder(busId);

    return stops.stream()
        .map(this::toStopDetail)
        .toList();
  }

  /**
   * Get bus details by ID
   */
  @Transactional(readOnly = true)
  public Optional<BusDetail> getBusById(Long busId) {
    log.info("Fetching bus details for ID: {}", busId);

    return busJpaRepository.findById(busId)
        .map(bus -> {
          List<StopJpaEntity> stops = stopJpaRepository.findByBusIdOrderByStopOrder(busId);
          return toBusDetail(bus, stops);
        });
  }

  /**
   * Update bus timing
   */
  @Transactional
  public UpdateResult updateBusTiming(Long busId, String departureTime, String arrivalTime) {
    log.info("Updating timing for bus ID: {} - departure: {}, arrival: {}", busId, departureTime, arrivalTime);

    Optional<BusJpaEntity> optBus = busJpaRepository.findById(busId);
    if (optBus.isEmpty()) {
      return UpdateResult.notFound();
    }

    BusJpaEntity bus = optBus.get();
    boolean updated = false;

    if (departureTime != null && !departureTime.isBlank()) {
      try {
        bus.setDepartureTime(LocalTime.parse(departureTime, TIME_FORMATTER));
        updated = true;
      } catch (DateTimeParseException e) {
        return UpdateResult.validationError("Invalid departure time format", departureTime);
      }
    }

    if (arrivalTime != null && !arrivalTime.isBlank()) {
      try {
        bus.setArrivalTime(LocalTime.parse(arrivalTime, TIME_FORMATTER));
        updated = true;
      } catch (DateTimeParseException e) {
        return UpdateResult.validationError("Invalid arrival time format", arrivalTime);
      }
    }

    if (!updated) {
      return UpdateResult.validationError("No timing data provided", "");
    }

    busJpaRepository.save(bus);
    List<StopJpaEntity> stops = stopJpaRepository.findByBusIdOrderByStopOrder(busId);
    return UpdateResult.success(toBusDetail(bus, stops));
  }

  /**
   * Toggle bus active status
   */
  @Transactional
  public UpdateResult toggleBusActive(Long busId, boolean active) {
    log.info("Toggling active status for bus ID: {} to {}", busId, active);

    Optional<BusJpaEntity> optBus = busJpaRepository.findById(busId);
    if (optBus.isEmpty()) {
      return UpdateResult.notFound();
    }

    BusJpaEntity bus = optBus.get();
    bus.setActive(active);
    busJpaRepository.save(bus);

    List<StopJpaEntity> stops = stopJpaRepository.findByBusIdOrderByStopOrder(busId);
    return UpdateResult.success(toBusDetail(bus, stops));
  }

  /**
   * Add a new stop to a bus
   */
  @Transactional
  public StopResult addStop(Long busId, StopInput input) {
    log.info("Adding stop to bus ID: {} - location: {}", busId, input.locationName());

    Optional<BusJpaEntity> optBus = busJpaRepository.findById(busId);
    if (optBus.isEmpty()) {
      return StopResult.busNotFound();
    }

    // Find or create location
    LocationJpaEntity location = findOrCreateLocation(input.locationName());

    // Get current stops to determine order
    List<StopJpaEntity> existingStops = stopJpaRepository.findByBusIdOrderByStopOrder(busId);
    int newOrder = input.stopOrder() != null ? input.stopOrder() : existingStops.size();

    // Shift existing stops if inserting in the middle
    if (newOrder < existingStops.size()) {
      for (StopJpaEntity stop : existingStops) {
        if (stop.getStopOrder() >= newOrder) {
          stop.setStopOrder(stop.getStopOrder() + 1);
          stopJpaRepository.save(stop);
        }
      }
    }

    // Create new stop
    StopJpaEntity newStop = StopJpaEntity.builder()
        .name(input.locationName())
        .bus(optBus.get())
        .location(location)
        .stopOrder(newOrder)
        .arrivalTime(parseTime(input.arrivalTime()))
        .departureTime(parseTime(input.departureTime()))
        .createdAt(java.time.LocalDateTime.now())
        .updatedAt(java.time.LocalDateTime.now())
        .build();

    StopJpaEntity saved = stopJpaRepository.save(newStop);
    return StopResult.success(toStopDetail(saved));
  }

  /**
   * Update an existing stop
   */
  @Transactional
  public StopResult updateStop(Long stopId, StopInput input) {
    log.info("Updating stop ID: {}", stopId);

    Optional<StopJpaEntity> optStop = stopJpaRepository.findById(stopId);
    if (optStop.isEmpty()) {
      return StopResult.stopNotFound();
    }

    StopJpaEntity stop = optStop.get();

    // Update location if changed
    if (input.locationName() != null && !input.locationName().isBlank()) {
      LocationJpaEntity location = findOrCreateLocation(input.locationName());
      stop.setName(input.locationName());
      stop.setLocation(location);
    }

    // Update timing
    if (input.arrivalTime() != null) {
      stop.setArrivalTime(parseTime(input.arrivalTime()));
    }
    if (input.departureTime() != null) {
      stop.setDepartureTime(parseTime(input.departureTime()));
    }

    // Update order if specified
    if (input.stopOrder() != null) {
      // Handle reordering logic
      Long busId = stop.getBus().getId();
      int oldOrder = stop.getStopOrder();
      int newOrder = input.stopOrder();

      if (oldOrder != newOrder) {
        List<StopJpaEntity> allStops = stopJpaRepository.findByBusIdOrderByStopOrder(busId);

        for (StopJpaEntity s : allStops) {
          if (s.getId().equals(stopId))
            continue;

          if (oldOrder < newOrder) {
            // Moving down - shift intermediate stops up
            if (s.getStopOrder() > oldOrder && s.getStopOrder() <= newOrder) {
              s.setStopOrder(s.getStopOrder() - 1);
              stopJpaRepository.save(s);
            }
          } else {
            // Moving up - shift intermediate stops down
            if (s.getStopOrder() >= newOrder && s.getStopOrder() < oldOrder) {
              s.setStopOrder(s.getStopOrder() + 1);
              stopJpaRepository.save(s);
            }
          }
        }
        stop.setStopOrder(newOrder);
      }
    }

    stop.setUpdatedAt(java.time.LocalDateTime.now());
    StopJpaEntity saved = stopJpaRepository.save(stop);
    return StopResult.success(toStopDetail(saved));
  }

  /**
   * Delete a stop
   */
  @Transactional
  public StopResult deleteStop(Long stopId) {
    log.info("Deleting stop ID: {}", stopId);

    Optional<StopJpaEntity> optStop = stopJpaRepository.findById(stopId);
    if (optStop.isEmpty()) {
      return StopResult.stopNotFound();
    }

    StopJpaEntity stop = optStop.get();
    Long busId = stop.getBus().getId();
    int deletedOrder = stop.getStopOrder();

    stopJpaRepository.deleteById(stopId);

    // Reorder remaining stops
    List<StopJpaEntity> remainingStops = stopJpaRepository.findByBusIdOrderByStopOrder(busId);
    for (StopJpaEntity s : remainingStops) {
      if (s.getStopOrder() > deletedOrder) {
        s.setStopOrder(s.getStopOrder() - 1);
        stopJpaRepository.save(s);
      }
    }

    return StopResult.deleted();
  }

  /**
   * Get all unique origin locations for filter dropdown
   */
  @Transactional(readOnly = true)
  public List<String> getUniqueOrigins() {
    return busJpaRepository.findAll().stream()
        .filter(bus -> bus.getFromLocation() != null && bus.getFromLocation().getName() != null)
        .map(bus -> bus.getFromLocation().getName())
        .distinct()
        .sorted()
        .toList();
  }

  /**
   * Get all unique destination locations for filter dropdown
   */
  @Transactional(readOnly = true)
  public List<String> getUniqueDestinations() {
    return busJpaRepository.findAll().stream()
        .filter(bus -> bus.getToLocation() != null && bus.getToLocation().getName() != null)
        .map(bus -> bus.getToLocation().getName())
        .distinct()
        .sorted()
        .toList();
  }

  /**
   * Search locations for autocomplete
   */
  @Transactional(readOnly = true)
  public List<LocationSuggestion> searchLocations(String query) {
    if (query == null || query.isBlank()) {
      return List.of();
    }

    String lowerQuery = query.toLowerCase().trim();
    return locationJpaRepository.findAll().stream()
        .filter(loc -> loc.getName() != null && loc.getName().toLowerCase().contains(lowerQuery))
        .limit(20)
        .map(loc -> new LocationSuggestion(loc.getId(), loc.getName(), loc.getDistrict()))
        .toList();
  }

  // Helper methods

  private LocationJpaEntity findOrCreateLocation(String locationName) {
    // Try to find existing location
    List<LocationJpaEntity> existing = locationJpaRepository.findAll().stream()
        .filter(loc -> loc.getName() != null && loc.getName().equalsIgnoreCase(locationName.trim()))
        .toList();

    if (!existing.isEmpty()) {
      return existing.get(0);
    }

    // Create new location
    LocationJpaEntity newLocation = LocationJpaEntity.builder()
        .name(locationName.trim())
        .latitude(0.0)
        .longitude(0.0)
        .build();

    return locationJpaRepository.save(newLocation);
  }

  private LocalTime parseTime(String timeStr) {
    if (timeStr == null || timeStr.isBlank()) {
      return null;
    }
    try {
      return LocalTime.parse(timeStr, TIME_FORMATTER);
    } catch (DateTimeParseException e) {
      return null;
    }
  }

  private BusListItem toBusListItem(BusJpaEntity bus, int stopCount) {
    return new BusListItem(
        bus.getId(),
        bus.getBusNumber(),
        bus.getName(),
        bus.getFromLocation() != null ? bus.getFromLocation().getName() : null,
        bus.getToLocation() != null ? bus.getToLocation().getName() : null,
        bus.getDepartureTime() != null ? bus.getDepartureTime().format(TIME_FORMATTER) : null,
        bus.getArrivalTime() != null ? bus.getArrivalTime().format(TIME_FORMATTER) : null,
        bus.getCategory(),
        stopCount,
        bus.getActive() != null ? bus.getActive() : true);
  }

  private BusDetail toBusDetail(BusJpaEntity bus, List<StopJpaEntity> stops) {
    return new BusDetail(
        bus.getId(),
        bus.getBusNumber(),
        bus.getName(),
        bus.getFromLocation() != null ? bus.getFromLocation().getName() : null,
        bus.getFromLocation() != null ? bus.getFromLocation().getId() : null,
        bus.getToLocation() != null ? bus.getToLocation().getName() : null,
        bus.getToLocation() != null ? bus.getToLocation().getId() : null,
        bus.getDepartureTime() != null ? bus.getDepartureTime().format(TIME_FORMATTER) : null,
        bus.getArrivalTime() != null ? bus.getArrivalTime().format(TIME_FORMATTER) : null,
        bus.getCategory(),
        bus.getCapacity(),
        bus.getActive() != null ? bus.getActive() : true,
        stops.stream().map(this::toStopDetail).toList());
  }

  private StopDetail toStopDetail(StopJpaEntity stop) {
    return new StopDetail(
        stop.getId(),
        stop.getName(),
        stop.getLocation() != null ? stop.getLocation().getId() : null,
        stop.getLocation() != null ? stop.getLocation().getName() : stop.getName(),
        stop.getStopOrder(),
        stop.getArrivalTime() != null ? stop.getArrivalTime().format(TIME_FORMATTER) : null,
        stop.getDepartureTime() != null ? stop.getDepartureTime().format(TIME_FORMATTER) : null);
  }

  // DTOs

  public record BusListItem(
      Long id,
      String busNumber,
      String name,
      String origin,
      String destination,
      String departureTime,
      String arrivalTime,
      String category,
      int stopCount,
      boolean active) {
  }

  public record BusDetail(
      Long id,
      String busNumber,
      String name,
      String origin,
      Long originId,
      String destination,
      Long destinationId,
      String departureTime,
      String arrivalTime,
      String category,
      Integer capacity,
      boolean active,
      List<StopDetail> stops) {
  }

  public record StopDetail(
      Long id,
      String name,
      Long locationId,
      String locationName,
      int stopOrder,
      String arrivalTime,
      String departureTime) {
  }

  public record StopInput(
      String locationName,
      Integer stopOrder,
      String arrivalTime,
      String departureTime) {
  }

  public record LocationSuggestion(
      Long id,
      String name,
      String district) {
  }

  public sealed interface UpdateResult {
    static UpdateResult success(BusDetail bus) {
      return new Success(bus);
    }

    static UpdateResult notFound() {
      return new NotFound();
    }

    static UpdateResult validationError(String error, String details) {
      return new ValidationError(error, details);
    }

    record Success(BusDetail bus) implements UpdateResult {
    }

    record NotFound() implements UpdateResult {
    }

    record ValidationError(String error, String details) implements UpdateResult {
    }
  }

  public sealed interface StopResult {
    static StopResult success(StopDetail stop) {
      return new Success(stop);
    }

    static StopResult busNotFound() {
      return new BusNotFound();
    }

    static StopResult stopNotFound() {
      return new StopNotFound();
    }

    static StopResult deleted() {
      return new Deleted();
    }

    record Success(StopDetail stop) implements StopResult {
    }

    record BusNotFound() implements StopResult {
    }

    record StopNotFound() implements StopResult {
    }

    record Deleted() implements StopResult {
    }
  }
}
