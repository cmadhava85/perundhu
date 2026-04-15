package com.perundhu.infrastructure.service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.model.StopId;
import com.perundhu.application.service.LocationTranslationService;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.entity.StopJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.LocationJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.StopJpaRepository;

import static com.perundhu.infrastructure.config.CacheConfig.BUS_ADMIN_CACHE;

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
  private final LocationTranslationService locationTranslationService;

  /**
   * Get paginated list of buses with optional search and filters.
   * Pushes WHERE + LIMIT/OFFSET to DB via Specification; JOIN FETCH only the page's rows.
   * Cached for 5 minutes to improve admin panel performance.
   */
  @Transactional(readOnly = true)
  @Cacheable(value = BUS_ADMIN_CACHE, key = "'buses-' + #search + '-' + #originFilter + '-' + #destinationFilter + '-' + #activeOnly + '-' + #pageable.pageNumber + '-' + #pageable.pageSize")
  public Page<BusListItem> getBuses(
      String search,
      String originFilter,
      String destinationFilter,
      Boolean activeOnly,
      Pageable pageable) {

    log.info("Fetching buses - search: {}, origin: {}, destination: {}, activeOnly: {}, page: {}",
        search, originFilter, destinationFilter, activeOnly, pageable.getPageNumber());

    Specification<BusJpaEntity> spec = buildBusSpec(search, originFilter, destinationFilter, activeOnly);

    // Step 1: DB-side WHERE + COUNT + LIMIT/OFFSET — returns only the IDs we care about.
    // No JOIN FETCH here; accessing only .id avoids lazy-load triggers.
    Page<BusJpaEntity> idPage = busJpaRepository.findAll(spec, pageable);
    if (idPage.isEmpty()) {
      return new PageImpl<>(List.of(), pageable, 0);
    }

    List<Long> pageIds = idPage.map(BusJpaEntity::getId).getContent();

    // Step 2: JOIN FETCH only the page's entities — single query, no N+1 on locations.
    List<BusJpaEntity> buses = busJpaRepository.findByIdsWithLocations(pageIds);

    // Preserve the sort order from idPage (IN queries don't guarantee order).
    Map<Long, BusJpaEntity> busById = buses.stream()
        .collect(Collectors.toMap(BusJpaEntity::getId, Function.identity()));
    List<BusJpaEntity> orderedBuses = pageIds.stream()
        .map(busById::get)
        .filter(b -> b != null)
        .toList();

    // Step 3: Stop counts only for this page (small IN clause, not the whole filtered set).
    Map<Long, Integer> stopCounts = getStopCounts(pageIds);

    List<BusListItem> items = orderedBuses.stream()
        .map(bus -> toBusListItem(bus, stopCounts.getOrDefault(bus.getId(), 0)))
        .toList();

    return new PageImpl<>(items, pageable, idPage.getTotalElements());
  }

  private static Specification<BusJpaEntity> buildBusSpec(
      String search, String originFilter, String destinationFilter, Boolean activeOnly) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();

      if (activeOnly != null && activeOnly) {
        predicates.add(cb.or(cb.isTrue(root.get("active")), cb.isNull(root.get("active"))));
      }

      // Use reusable joins so search and originFilter don't double-join the same table
      Join<BusJpaEntity, LocationJpaEntity> fromJoin = root.join("fromLocation", JoinType.LEFT);
      Join<BusJpaEntity, LocationJpaEntity> toJoin = root.join("toLocation", JoinType.LEFT);

      if (originFilter != null && !originFilter.isBlank()) {
        predicates.add(cb.like(cb.lower(fromJoin.get("name")),
            "%" + originFilter.toLowerCase().trim() + "%"));
      }

      if (destinationFilter != null && !destinationFilter.isBlank()) {
        predicates.add(cb.like(cb.lower(toJoin.get("name")),
            "%" + destinationFilter.toLowerCase().trim() + "%"));
      }

      if (search != null && !search.isBlank()) {
        String pattern = "%" + search.toLowerCase().trim() + "%";
        predicates.add(cb.or(
            cb.like(cb.lower(root.get("busNumber")), pattern),
            cb.like(cb.lower(root.get("name")), pattern),
            cb.like(cb.lower(fromJoin.get("name")), pattern),
            cb.like(cb.lower(toJoin.get("name")), pattern)));
      }

      // Tell JPA this is a SELECT query (suppresses "query result type not selected" warning on count subqueries)
      if (query != null) {
        query.distinct(true);
      }

      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }

  /**
   * Get stop counts for multiple buses efficiently using a single query.
   * Uses GROUP BY to avoid N+1 query problem.
   */
  private java.util.Map<Long, Integer> getStopCounts(List<Long> busIds) {
    if (busIds == null || busIds.isEmpty()) {
      return java.util.Map.of();
    }

    // Single query with GROUP BY - much more efficient than N queries
    List<Object[]> results = stopJpaRepository.countStopsByBusIds(busIds);

    java.util.Map<Long, Integer> counts = new java.util.HashMap<>();
    for (Object[] result : results) {
      Long busId = (Long) result[0];
      Long count = (Long) result[1];
      counts.put(busId, count.intValue());
    }

    return counts;
  }

  /**
   * Get detailed stops for a specific bus
   * Cached to avoid repeated queries for same bus
   */
  @Transactional(readOnly = true)
  @Cacheable(value = BUS_ADMIN_CACHE, key = "'stops-' + #busId")
  public List<StopDetail> getStopsForBus(Long busId) {
    log.info("Fetching stops for bus ID: {}", busId);

    List<StopJpaEntity> stops = stopJpaRepository.findByBusIdOrderByStopOrder(busId);

    return stops.stream()
        .map(this::toStopDetail)
        .toList();
  }

  /**
   * Get bus details by ID
   * Cached to improve performance when viewing same bus repeatedly
   */
  @Transactional(readOnly = true)
  @Cacheable(value = BUS_ADMIN_CACHE, key = "'bus-' + #busId")
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
   * Evicts all bus admin caches when data changes
   */
  @Transactional
  @CacheEvict(value = BUS_ADMIN_CACHE, allEntries = true)
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
   * Evicts all bus admin caches when status changes
   */
  @Transactional
  @CacheEvict(value = BUS_ADMIN_CACHE, allEntries = true)
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
    
    // Save Tamil translation if provided
    if (input.tamilName() != null && !input.tamilName().trim().isEmpty()) {
      Location domainLocation = toDomainLocation(location);
      locationTranslationService.saveLocationTranslation(domainLocation, input.tamilName());
      log.info("Saved Tamil translation for location {}: {}", input.locationName(), input.tamilName());
    }

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
      
      // Save Tamil translation if provided
      if (input.tamilName() != null && !input.tamilName().trim().isEmpty()) {
        Location domainLocation = toDomainLocation(location);
        locationTranslationService.saveLocationTranslation(domainLocation, input.tamilName());
        log.info("Saved Tamil translation for location {}: {}", input.locationName(), input.tamilName());
      }
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
    // Single DB query returning only names — no entity loading needed
    return busJpaRepository.findDistinctOriginNames();
  }

  /**
   * Get all unique destination locations for filter dropdown
   */
  @Transactional(readOnly = true)
  public List<String> getUniqueDestinations() {
    // Single DB query returning only names — no entity loading needed
    return busJpaRepository.findDistinctDestinationNames();
  }

  /**
   * Search locations for autocomplete
   */
  @Transactional(readOnly = true)
  public List<LocationSuggestion> searchLocations(String query) {
    if (query == null || query.isBlank()) {
      return List.of();
    }

    String trimmedQuery = query.trim();
    // Push filtering to the DB — do not load ALL locations into memory
    return locationJpaRepository.findByNameContainingIgnoreCase(trimmedQuery).stream()
        .limit(20)
        .map(loc -> new LocationSuggestion(loc.getId(), loc.getName(), loc.getDistrict()))
        .toList();
  }

  // Helper methods

  private LocationJpaEntity findOrCreateLocation(String locationName) {
    // Push the equality check to the DB — do not load ALL locations into memory
    var found = locationJpaRepository.findFirstByNameEqualsIgnoreCase(locationName.trim());
    if (found.isPresent()) {
      return found.get();
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
    String originName = bus.getFromLocation() != null ? bus.getFromLocation().getName() : null;
    String destinationName = bus.getToLocation() != null ? bus.getToLocation().getName() : null;
    String originTa = originName != null
        ? locationTranslationService.translateToTamil(originName).orElse(null)
        : null;
    String destinationTa = destinationName != null
        ? locationTranslationService.translateToTamil(destinationName).orElse(null)
        : null;
    return new BusListItem(
        bus.getId(),
        bus.getBusNumber(),
        bus.getName(),
        originName,
        destinationName,
        bus.getDepartureTime() != null ? bus.getDepartureTime().format(TIME_FORMATTER) : null,
        bus.getArrivalTime() != null ? bus.getArrivalTime().format(TIME_FORMATTER) : null,
        bus.getCategory(),
        stopCount,
        bus.getActive() != null ? bus.getActive() : true,
        originTa,
        destinationTa);
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
      boolean active,
      String originTa,
      String destinationTa) {
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
      String tamilName,
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

  /**
   * Convert LocationJpaEntity to domain Location object
   */
  private Location toDomainLocation(LocationJpaEntity locationJpa) {
    return new Location(
        new LocationId(locationJpa.getId()),
        locationJpa.getName(),
        null, // nameLocalLanguage is stored separately in translations table
        locationJpa.getLatitude(),
        locationJpa.getLongitude(),
        locationJpa.getDistrict(),
        locationJpa.getNearbyCity()
    );
  }
}
