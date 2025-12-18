package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.BusTimingRecord;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.BusTimingRecordRepository;
import com.perundhu.domain.port.LocationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for integrating approved BusTimingRecord entries into the main buses
 * table.
 * This bridges the gap between image-contributed timings and searchable bus
 * data.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class BusTimingRecordIntegrationService {

  private final BusTimingRecordRepository busTimingRecordRepository;
  private final BusRepository busRepository;
  private final LocationRepository locationRepository;

  /**
   * Result of integration operation
   */
  public record IntegrationResult(
      int integratedCount,
      int skippedDuplicates,
      int failedCount,
      List<String> errors) {
  }

  /**
   * Integrate all unintegrated BusTimingRecords into the buses table.
   * This resolves location names to IDs and creates Bus entries.
   */
  @Transactional
  public IntegrationResult integrateAllPendingRecords() {
    log.info("Starting integration of all pending BusTimingRecords into buses table");

    List<BusTimingRecord> allRecords = busTimingRecordRepository.findAll();
    log.info("Found {} total BusTimingRecords to check", allRecords.size());

    // Filter to records that don't have a busId (not yet integrated)
    List<BusTimingRecord> pendingRecords = allRecords.stream()
        .filter(record -> record.getBusId() == null)
        .toList();

    log.info("Found {} unintegrated BusTimingRecords", pendingRecords.size());

    return integrateRecords(pendingRecords);
  }

  /**
   * Integrate BusTimingRecords for a specific route (by location names)
   */
  @Transactional
  public IntegrationResult integrateRecordsForRoute(String fromLocationName, String toLocationName) {
    log.info("Integrating BusTimingRecords for route: {} -> {}", fromLocationName, toLocationName);

    List<BusTimingRecord> allRecords = busTimingRecordRepository.findAll();

    // Filter by route
    List<BusTimingRecord> routeRecords = allRecords.stream()
        .filter(record -> fromLocationName.equalsIgnoreCase(record.getFromLocationName())
            && toLocationName.equalsIgnoreCase(record.getToLocationName()))
        .filter(record -> record.getBusId() == null) // Not yet integrated
        .toList();

    log.info("Found {} unintegrated records for route {} -> {}",
        routeRecords.size(), fromLocationName, toLocationName);

    return integrateRecords(routeRecords);
  }

  /**
   * Integrate a list of BusTimingRecords into the buses table
   */
  private IntegrationResult integrateRecords(List<BusTimingRecord> records) {
    int integratedCount = 0;
    int skippedDuplicates = 0;
    int failedCount = 0;
    List<String> errors = new ArrayList<>();

    // Location cache to avoid repeated lookups
    Map<String, Location> locationCache = new HashMap<>();

    for (BusTimingRecord record : records) {
      try {
        // 1. Resolve from location
        Location fromLocation = resolveLocation(record.getFromLocationName(), locationCache);
        if (fromLocation == null) {
          errors.add("Could not resolve from location: " + record.getFromLocationName());
          failedCount++;
          continue;
        }

        // 2. Resolve to location
        Location toLocation = resolveLocation(record.getToLocationName(), locationCache);
        if (toLocation == null) {
          errors.add("Could not resolve to location: " + record.getToLocationName());
          failedCount++;
          continue;
        }

        // 3. Update the record with location IDs
        record.setFromLocationId(fromLocation.id().value());
        record.setToLocationId(toLocation.id().value());

        // 4. Check for duplicate bus entry (same route + departure time)
        LocalTime departureTime = record.getDepartureTime();
        LocalTime arrivalTime = record.getArrivalTime();

        // Estimate arrival time if not set
        if (arrivalTime == null && departureTime != null) {
          arrivalTime = estimateArrivalTime(departureTime,
              record.getFromLocationName(), record.getToLocationName());
        }

        // Check if this exact timing already exists in buses table
        List<Bus> existingBuses = busRepository.findBusesBetweenLocations(
            fromLocation.id().value(),
            toLocation.id().value());

        boolean isDuplicate = existingBuses.stream()
            .anyMatch(bus -> bus.getDepartureTime() != null
                && bus.getDepartureTime().equals(departureTime));

        if (isDuplicate) {
          // Link to existing bus and mark as integrated
          Bus existingBus = existingBuses.stream()
              .filter(bus -> bus.getDepartureTime() != null
                  && bus.getDepartureTime().equals(departureTime))
              .findFirst()
              .orElse(null);

          if (existingBus != null) {
            record.setBusId(existingBus.id().value());
            record.setVerified(true);
            busTimingRecordRepository.save(record);
            skippedDuplicates++;
            log.debug("Linked duplicate record {} to existing bus {}",
                record.getId(), existingBus.id().value());
          }
          continue;
        }

        // 5. Create new Bus entry
        String generatedBusNumber = generateBusNumber(
            record.getFromLocationName(),
            record.getToLocationName(),
            existingBuses.size() + 1);

        Bus newBus = Bus.create(
            new BusId(1L), // Temporary ID, will be replaced by database
            generatedBusNumber, // number (2nd param)
            "Bus Service", // name (3rd param)
            fromLocation,
            toLocation,
            departureTime,
            arrivalTime);

        Bus savedBus = busRepository.save(newBus);

        // 6. Update the timing record with the bus ID
        record.setBusId(savedBus.id().value());
        record.setFromLocationId(fromLocation.id().value());
        record.setToLocationId(toLocation.id().value());
        record.setVerified(true);
        record.setLastUpdated(LocalDateTime.now());
        busTimingRecordRepository.save(record);

        integratedCount++;
        log.debug("Integrated record {} -> bus {} (route: {} -> {})",
            record.getId(), savedBus.id().value(),
            record.getFromLocationName(), record.getToLocationName());

      } catch (Exception e) {
        log.error("Failed to integrate record {}: {}", record.getId(), e.getMessage(), e);
        errors.add("Record " + record.getId() + ": " + e.getMessage());
        failedCount++;
      }
    }

    log.info("Integration complete: {} integrated, {} duplicates linked, {} failed",
        integratedCount, skippedDuplicates, failedCount);

    return new IntegrationResult(integratedCount, skippedDuplicates, failedCount, errors);
  }

  /**
   * Resolve a location name to a Location entity, using cache
   */
  private Location resolveLocation(String locationName, Map<String, Location> cache) {
    if (locationName == null || locationName.isBlank()) {
      return null;
    }

    String cacheKey = locationName.toLowerCase().trim();
    if (cache.containsKey(cacheKey)) {
      return cache.get(cacheKey);
    }

    // Try multiple search strategies
    Location location = null;

    // Strategy 1: Exact match
    location = locationRepository.findByExactName(locationName.trim()).orElse(null);

    // Strategy 2: Case-insensitive match
    if (location == null) {
      location = locationRepository.findByExactName(normalizePlaceName(locationName)).orElse(null);
    }

    // Strategy 3: Uppercase match (for OCR-extracted names)
    if (location == null) {
      location = locationRepository.findByExactName(locationName.trim().toUpperCase()).orElse(null);
    }

    // Strategy 4: Partial match
    if (location == null) {
      List<Location> matches = locationRepository.findByName(locationName.trim());
      if (!matches.isEmpty()) {
        // Java 21 Sequenced Collections - getFirst()
        location = matches.getFirst();
      }
    }

    // Strategy 5: Create new location if not found
    if (location == null) {
      log.info("Creating new location: {}", normalizePlaceName(locationName));
      Location newLocation = Location.withCoordinates(
          null,
          normalizePlaceName(locationName),
          null, // No coordinates available
          null);
      location = locationRepository.save(newLocation);
    }

    cache.put(cacheKey, location);
    return location;
  }

  /**
   * Normalize place names to Title Case
   */
  private String normalizePlaceName(String name) {
    if (name == null || name.trim().isEmpty()) {
      return name;
    }

    String trimmed = name.trim();

    // If already looks like Title Case, keep it
    if (trimmed.length() > 1
        && Character.isUpperCase(trimmed.charAt(0))
        && Character.isLowerCase(trimmed.charAt(1))) {
      return trimmed;
    }

    // Convert to Title Case
    StringBuilder result = new StringBuilder();
    boolean capitalizeNext = true;

    for (char c : trimmed.toCharArray()) {
      if (Character.isWhitespace(c) || c == '-') {
        capitalizeNext = true;
        result.append(c);
      } else if (capitalizeNext) {
        result.append(Character.toUpperCase(c));
        capitalizeNext = false;
      } else {
        result.append(Character.toLowerCase(c));
      }
    }

    return result.toString();
  }

  /**
   * Generate a bus number for the new route
   */
  private String generateBusNumber(String from, String to, int sequence) {
    String fromPrefix = from.substring(0, Math.min(3, from.length())).toUpperCase();
    String toPrefix = to.substring(0, Math.min(3, to.length())).toUpperCase();
    return String.format("IMG-%s-%s-%03d", fromPrefix, toPrefix, sequence);
  }

  /**
   * Estimate arrival time based on route
   */
  private LocalTime estimateArrivalTime(LocalTime departureTime, String from, String to) {
    int durationMinutes = estimateJourneyDuration(from, to);
    return departureTime.plusMinutes(durationMinutes);
  }

  /**
   * Estimate journey duration in minutes
   */
  private int estimateJourneyDuration(String from, String to) {
    String fromUpper = from.toUpperCase().trim();
    String toUpper = to.toUpperCase().trim();

    // Known route durations
    if ((fromUpper.contains("SIVAKASI") && toUpper.contains("MADURAI"))
        || (fromUpper.contains("MADURAI") && toUpper.contains("SIVAKASI"))) {
      return 120; // 2 hours
    }
    if ((fromUpper.contains("SIVAKASI") && toUpper.contains("VIRUDHUNAGAR"))
        || (fromUpper.contains("VIRUDHUNAGAR") && toUpper.contains("SIVAKASI"))) {
      return 45;
    }
    if ((fromUpper.contains("SIVAKASI") && toUpper.contains("SATTUR"))
        || (fromUpper.contains("SATTUR") && toUpper.contains("SIVAKASI"))) {
      return 40;
    }
    if ((fromUpper.contains("SIVAKASI") && toUpper.contains("ARUPPUKOTTAI"))
        || (fromUpper.contains("ARUPPUKOTTAI") && toUpper.contains("SIVAKASI"))) {
      return 50;
    }
    if ((fromUpper.contains("MADURAI") && toUpper.contains("VIRUDHUNAGAR"))
        || (fromUpper.contains("VIRUDHUNAGAR") && toUpper.contains("MADURAI"))) {
      return 90;
    }

    // Default: 90 minutes
    return 90;
  }
}
