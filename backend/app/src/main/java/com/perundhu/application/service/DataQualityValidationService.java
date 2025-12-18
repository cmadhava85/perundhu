package com.perundhu.application.service;

import java.time.LocalTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.StopContribution;

import lombok.extern.slf4j.Slf4j;

/**
 * Data Quality Validation Service
 * 
 * Provides comprehensive data quality checks for bus route contributions
 * beyond basic input sanitization. Validates:
 * - Geographic reasonableness (Tamil Nadu bounds, distance validation)
 * - Time consistency (arrival after departure, reasonable duration for
 * distance)
 * - Data integrity (unique stops, proper sequencing)
 * - Business rules (minimum/maximum distances, operating hours)
 */
@Service
@Slf4j
public class DataQualityValidationService {

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  // Tamil Nadu approximate geographical bounds
  private static final double TN_MIN_LATITUDE = 8.0;
  private static final double TN_MAX_LATITUDE = 14.0;
  private static final double TN_MIN_LONGITUDE = 76.0;
  private static final double TN_MAX_LONGITUDE = 81.0;

  // Extended bounds for border areas (Kerala, Karnataka, Andhra Pradesh)
  private static final double EXTENDED_MIN_LATITUDE = 7.5;
  private static final double EXTENDED_MAX_LATITUDE = 15.0;
  private static final double EXTENDED_MIN_LONGITUDE = 74.0;
  private static final double EXTENDED_MAX_LONGITUDE = 82.0;

  // Bus speed assumptions (km/h)
  private static final double MIN_BUS_SPEED_KMH = 20.0; // Town bus with many stops
  private static final double AVG_BUS_SPEED_KMH = 45.0; // Average intercity bus
  private static final double MAX_BUS_SPEED_KMH = 85.0; // Express highway bus

  // Distance limits
  private static final double MIN_ROUTE_DISTANCE_KM = 1.0; // Minimum 1 km
  private static final double MAX_ROUTE_DISTANCE_KM = 1000.0; // Maximum 1000 km

  // Time format pattern
  private static final Pattern TIME_PATTERN = Pattern.compile("^([01]?[0-9]|2[0-3]):([0-5][0-9])$");

  // ============================================================================
  // RESULT TYPES
  // ============================================================================

  /**
   * Comprehensive validation result with severity levels
   */
  public record DataQualityResult(
      boolean valid,
      Severity severity,
      String code,
      String message,
      Object details) {
    public enum Severity {
      INFO, // Informational - may proceed
      WARNING, // Warning - review recommended
      ERROR // Error - must fix
    }

    public static DataQualityResult success() {
      return new DataQualityResult(true, Severity.INFO, "OK", "Validation passed", null);
    }

    public static DataQualityResult success(String message) {
      return new DataQualityResult(true, Severity.INFO, "OK", message, null);
    }

    public static DataQualityResult warning(String code, String message) {
      return new DataQualityResult(true, Severity.WARNING, code, message, null);
    }

    public static DataQualityResult warning(String code, String message, Object details) {
      return new DataQualityResult(true, Severity.WARNING, code, message, details);
    }

    public static DataQualityResult error(String code, String message) {
      return new DataQualityResult(false, Severity.ERROR, code, message, null);
    }

    public static DataQualityResult error(String code, String message, Object details) {
      return new DataQualityResult(false, Severity.ERROR, code, message, details);
    }
  }

  /**
   * Aggregated validation results
   */
  public record ValidationReport(
      boolean valid,
      List<DataQualityResult> errors,
      List<DataQualityResult> warnings,
      List<DataQualityResult> info) {
    public static ValidationReport create(List<DataQualityResult> results) {
      List<DataQualityResult> errors = new ArrayList<>();
      List<DataQualityResult> warnings = new ArrayList<>();
      List<DataQualityResult> info = new ArrayList<>();

      for (DataQualityResult result : results) {
        switch (result.severity()) {
          case ERROR -> errors.add(result);
          case WARNING -> warnings.add(result);
          case INFO -> info.add(result);
        }
      }

      return new ValidationReport(errors.isEmpty(), errors, warnings, info);
    }
  }

  // ============================================================================
  // MAIN VALIDATION METHODS
  // ============================================================================

  /**
   * Perform comprehensive data quality validation on a route contribution
   */
  public ValidationReport validateRouteContribution(RouteContribution contribution) {
    List<DataQualityResult> results = new ArrayList<>();

    // 1. Location validations
    results.add(validateLocationsDifferent(
        contribution.getFromLocationName(),
        contribution.getToLocationName()));

    // 2. Coordinate validations (if provided)
    if (hasCoordinates(contribution)) {
      results.add(validateCoordinatesInServiceArea(
          contribution.getFromLatitude(),
          contribution.getFromLongitude(),
          "origin"));
      results.add(validateCoordinatesInServiceArea(
          contribution.getToLatitude(),
          contribution.getToLongitude(),
          "destination"));
      results.add(validateRouteDistance(
          contribution.getFromLatitude(),
          contribution.getFromLongitude(),
          contribution.getToLatitude(),
          contribution.getToLongitude()));

      // 3. Time-distance validation (if times and coordinates provided)
      if (hasValidTimes(contribution)) {
        results.add(validateJourneyDuration(
            contribution.getDepartureTime(),
            contribution.getArrivalTime(),
            contribution.getFromLatitude(),
            contribution.getFromLongitude(),
            contribution.getToLatitude(),
            contribution.getToLongitude()));
      }
    }

    // 4. Time format validation
    if (contribution.getDepartureTime() != null) {
      results.add(validateTimeFormat(contribution.getDepartureTime(), "departure"));
    }
    if (contribution.getArrivalTime() != null) {
      results.add(validateTimeFormat(contribution.getArrivalTime(), "arrival"));
    }

    // 5. Arrival after departure validation
    if (hasValidTimes(contribution)) {
      results.add(validateArrivalAfterDeparture(
          contribution.getDepartureTime(),
          contribution.getArrivalTime()));
    }

    // Filter out successful results for cleaner report
    List<DataQualityResult> significantResults = results.stream()
        .filter(r -> r.severity() != DataQualityResult.Severity.INFO || !r.valid())
        .toList();

    return ValidationReport
        .create(significantResults.isEmpty() ? List.of(DataQualityResult.success("All data quality checks passed"))
            : significantResults);
  }

  /**
   * Validate stops for a contribution
   */
  public ValidationReport validateStops(List<StopContribution> stops) {
    List<DataQualityResult> results = new ArrayList<>();

    if (stops == null || stops.isEmpty()) {
      return ValidationReport.create(List.of(DataQualityResult.success("No stops to validate")));
    }

    // Check for duplicate stop names
    results.add(validateUniqueStopNames(stops));

    // Check stop time sequence
    results.add(validateStopTimeSequence(stops));

    // Validate each stop's coordinates if provided
    for (StopContribution stop : stops) {
      if (stop.getLatitude() != null && stop.getLongitude() != null) {
        results.add(validateCoordinatesInServiceArea(
            stop.getLatitude(),
            stop.getLongitude(),
            "stop:" + stop.getName()));
      }
    }

    return ValidationReport.create(results);
  }

  // ============================================================================
  // LOCATION VALIDATIONS
  // ============================================================================

  /**
   * Validate that origin and destination are different
   */
  public DataQualityResult validateLocationsDifferent(String origin, String destination) {
    if (origin == null || destination == null) {
      return DataQualityResult.error("MISSING_LOCATION", "Origin and destination are required");
    }

    String normalizedOrigin = normalizeLocationName(origin);
    String normalizedDestination = normalizeLocationName(destination);

    if (normalizedOrigin.equals(normalizedDestination)) {
      return DataQualityResult.error(
          "SAME_ORIGIN_DESTINATION",
          "Origin and destination cannot be the same location",
          java.util.Map.of("origin", origin, "destination", destination));
    }

    // Check for very similar names (possible typo)
    double similarity = calculateSimilarity(normalizedOrigin, normalizedDestination);
    if (similarity > 0.85) {
      return DataQualityResult.warning(
          "SIMILAR_LOCATIONS",
          String.format("Origin '%s' and destination '%s' are very similar. Please verify.", origin, destination),
          java.util.Map.of("similarity", similarity));
    }

    return DataQualityResult.success();
  }

  /**
   * Validate coordinates are within Tamil Nadu service area
   */
  public DataQualityResult validateCoordinatesInServiceArea(Double latitude, Double longitude, String locationLabel) {
    if (latitude == null || longitude == null) {
      return DataQualityResult.success(); // Coordinates are optional
    }

    // Check basic coordinate validity
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return DataQualityResult.error(
          "INVALID_COORDINATES",
          String.format("Invalid coordinates for %s: %.6f, %.6f", locationLabel, latitude, longitude));
    }

    // Check if within Tamil Nadu bounds
    if (latitude >= TN_MIN_LATITUDE && latitude <= TN_MAX_LATITUDE &&
        longitude >= TN_MIN_LONGITUDE && longitude <= TN_MAX_LONGITUDE) {
      return DataQualityResult.success();
    }

    // Check if within extended bounds (neighboring states)
    if (latitude >= EXTENDED_MIN_LATITUDE && latitude <= EXTENDED_MAX_LATITUDE &&
        longitude >= EXTENDED_MIN_LONGITUDE && longitude <= EXTENDED_MAX_LONGITUDE) {
      return DataQualityResult.warning(
          "OUTSIDE_TN_BOUNDS",
          String.format("Location '%s' appears to be outside Tamil Nadu. Is this a cross-state route?", locationLabel),
          java.util.Map.of("latitude", latitude, "longitude", longitude));
    }

    // Outside service area
    return DataQualityResult.error(
        "OUTSIDE_SERVICE_AREA",
        String.format("Location '%s' (%.4f, %.4f) is outside the service area", locationLabel, latitude, longitude),
        java.util.Map.of("latitude", latitude, "longitude", longitude, "serviceArea",
            "Tamil Nadu and neighboring states"));
  }

  /**
   * Validate route distance is reasonable
   */
  public DataQualityResult validateRouteDistance(Double fromLat, Double fromLng, Double toLat, Double toLng) {
    if (fromLat == null || fromLng == null || toLat == null || toLng == null) {
      return DataQualityResult.success(); // Coordinates are optional
    }

    double distanceKm = calculateHaversineDistance(fromLat, fromLng, toLat, toLng);

    if (distanceKm < MIN_ROUTE_DISTANCE_KM) {
      return DataQualityResult.error(
          "ROUTE_TOO_SHORT",
          String.format("Route distance (%.1f km) is too short. Minimum is %.1f km.", distanceKm,
              MIN_ROUTE_DISTANCE_KM),
          java.util.Map.of("distance", distanceKm, "minimum", MIN_ROUTE_DISTANCE_KM));
    }

    if (distanceKm > MAX_ROUTE_DISTANCE_KM) {
      return DataQualityResult.error(
          "ROUTE_TOO_LONG",
          String.format("Route distance (%.1f km) exceeds maximum (%.1f km).", distanceKm, MAX_ROUTE_DISTANCE_KM),
          java.util.Map.of("distance", distanceKm, "maximum", MAX_ROUTE_DISTANCE_KM));
    }

    if (distanceKm > 500) {
      return DataQualityResult.warning(
          "LONG_ROUTE",
          String.format("This is a long-distance route (%.1f km). Please verify the information.", distanceKm),
          java.util.Map.of("distance", distanceKm));
    }

    log.debug("Route distance validated: {:.1f} km", distanceKm);
    return DataQualityResult.success();
  }

  // ============================================================================
  // TIME VALIDATIONS
  // ============================================================================

  /**
   * Validate time format (HH:mm)
   */
  public DataQualityResult validateTimeFormat(String time, String fieldName) {
    if (time == null || time.trim().isEmpty()) {
      return DataQualityResult.success(); // Time is optional
    }

    if (!TIME_PATTERN.matcher(time.trim()).matches()) {
      return DataQualityResult.error(
          "INVALID_TIME_FORMAT",
          String.format("Invalid %s time format: '%s'. Expected HH:mm format.", fieldName, time));
    }

    return DataQualityResult.success();
  }

  /**
   * Validate arrival time is after departure time
   */
  public DataQualityResult validateArrivalAfterDeparture(String departureTime, String arrivalTime) {
    if (departureTime == null || arrivalTime == null) {
      return DataQualityResult.success();
    }

    try {
      LocalTime departure = parseTime(departureTime);
      LocalTime arrival = parseTime(arrivalTime);

      if (departure == null || arrival == null) {
        return DataQualityResult.error("INVALID_TIME", "Cannot parse departure or arrival time");
      }

      // Handle overnight journeys
      if (arrival.isBefore(departure)) {
        // Could be overnight journey - add warning but don't reject
        return DataQualityResult.warning(
            "OVERNIGHT_JOURNEY",
            String.format("Arrival time (%s) is before departure (%s). Is this an overnight journey?",
                arrivalTime, departureTime));
      }

      // Check for same time
      if (arrival.equals(departure)) {
        return DataQualityResult.error(
            "SAME_DEPARTURE_ARRIVAL",
            "Arrival time cannot be the same as departure time");
      }

      return DataQualityResult.success();
    } catch (Exception e) {
      log.warn("Error parsing times: departure={}, arrival={}", departureTime, arrivalTime, e);
      return DataQualityResult.error("TIME_PARSE_ERROR", "Error parsing time values: " + e.getMessage());
    }
  }

  /**
   * Validate journey duration is reasonable for the distance
   */
  public DataQualityResult validateJourneyDuration(
      String departureTime,
      String arrivalTime,
      Double fromLat,
      Double fromLng,
      Double toLat,
      Double toLng) {

    if (departureTime == null || arrivalTime == null) {
      return DataQualityResult.success();
    }

    if (fromLat == null || fromLng == null || toLat == null || toLng == null) {
      return DataQualityResult.success();
    }

    try {
      LocalTime departure = parseTime(departureTime);
      LocalTime arrival = parseTime(arrivalTime);

      if (departure == null || arrival == null) {
        return DataQualityResult.success();
      }

      double distanceKm = calculateHaversineDistance(fromLat, fromLng, toLat, toLng);

      // Calculate actual duration in minutes
      long durationMinutes = calculateDurationMinutes(departure, arrival);

      // Calculate expected duration range
      long minExpectedMinutes = (long) (distanceKm / MAX_BUS_SPEED_KMH * 60);
      long maxExpectedMinutes = (long) (distanceKm / MIN_BUS_SPEED_KMH * 60);

      // Too fast - physically impossible
      if (durationMinutes < minExpectedMinutes * 0.7) {
        return DataQualityResult.error(
            "JOURNEY_TOO_FAST",
            String.format("Journey time (%d min) is too short for %.1f km. Minimum expected: %d min.",
                durationMinutes, distanceKm, minExpectedMinutes),
            java.util.Map.of(
                "actualMinutes", durationMinutes,
                "distanceKm", distanceKm,
                "minExpectedMinutes", minExpectedMinutes));
      }

      // Too slow - unreasonably long
      if (durationMinutes > maxExpectedMinutes * 2) {
        return DataQualityResult.error(
            "JOURNEY_TOO_SLOW",
            String.format("Journey time (%d min) is too long for %.1f km. Maximum expected: %d min.",
                durationMinutes, distanceKm, maxExpectedMinutes * 2),
            java.util.Map.of(
                "actualMinutes", durationMinutes,
                "distanceKm", distanceKm,
                "maxExpectedMinutes", maxExpectedMinutes * 2));
      }

      // Warning: faster than average (express bus?)
      if (durationMinutes < minExpectedMinutes) {
        return DataQualityResult.warning(
            "FAST_JOURNEY",
            String.format("Journey time (%d min) seems fast for %.1f km. Is this an express bus?",
                durationMinutes, distanceKm));
      }

      // Warning: slower than average (local bus with many stops?)
      if (durationMinutes > maxExpectedMinutes) {
        return DataQualityResult.warning(
            "SLOW_JOURNEY",
            String.format("Journey time (%d min) seems slow for %.1f km. Does this bus have many stops?",
                durationMinutes, distanceKm));
      }

      return DataQualityResult.success(String.format("Journey duration validated: %d min for %.1f km",
          durationMinutes, distanceKm));

    } catch (Exception e) {
      log.warn("Error validating journey duration", e);
      return DataQualityResult.warning("DURATION_CHECK_FAILED",
          "Could not validate journey duration: " + e.getMessage());
    }
  }

  // ============================================================================
  // STOP VALIDATIONS
  // ============================================================================

  /**
   * Validate stop names are unique
   */
  public DataQualityResult validateUniqueStopNames(List<StopContribution> stops) {
    if (stops == null || stops.size() < 2) {
      return DataQualityResult.success();
    }

    List<String> normalizedNames = stops.stream()
        .map(s -> normalizeLocationName(s.getName()))
        .toList();

    List<String> duplicates = new ArrayList<>();
    for (int i = 0; i < normalizedNames.size(); i++) {
      for (int j = i + 1; j < normalizedNames.size(); j++) {
        if (normalizedNames.get(i).equals(normalizedNames.get(j))) {
          duplicates.add(stops.get(i).getName());
        }
      }
    }

    if (!duplicates.isEmpty()) {
      return DataQualityResult.error(
          "DUPLICATE_STOPS",
          "Duplicate stop names found: " + String.join(", ", duplicates),
          java.util.Map.of("duplicates", duplicates));
    }

    return DataQualityResult.success();
  }

  /**
   * Validate stops are in chronological order
   */
  public DataQualityResult validateStopTimeSequence(List<StopContribution> stops) {
    if (stops == null || stops.size() < 2) {
      return DataQualityResult.success();
    }

    LocalTime previousTime = null;
    String previousStopName = null;

    for (StopContribution stop : stops) {
      String timeStr = stop.getArrivalTime();
      if (timeStr == null || timeStr.trim().isEmpty()) {
        timeStr = stop.getDepartureTime();
      }

      if (timeStr == null || timeStr.trim().isEmpty()) {
        continue; // Skip stops without time
      }

      LocalTime currentTime = parseTime(timeStr);
      if (currentTime == null) {
        continue;
      }

      if (previousTime != null) {
        // Allow for overnight journeys by checking if time is much earlier
        boolean isPossibleOvernight = previousTime.isAfter(LocalTime.of(20, 0)) &&
            currentTime.isBefore(LocalTime.of(6, 0));

        if (currentTime.isBefore(previousTime) && !isPossibleOvernight) {
          return DataQualityResult.error(
              "STOP_TIME_SEQUENCE_ERROR",
              String.format("Stop '%s' time (%s) is before previous stop '%s' time (%s)",
                  stop.getName(), timeStr, previousStopName, previousTime.toString()),
              java.util.Map.of(
                  "currentStop", stop.getName(),
                  "currentTime", timeStr,
                  "previousStop", previousStopName,
                  "previousTime", previousTime.toString()));
        }
      }

      previousTime = currentTime;
      previousStopName = stop.getName();
    }

    return DataQualityResult.success();
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate Haversine distance between two points
   */
  private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
    final double R = 6371.0; // Earth's radius in km

    double lat1Rad = Math.toRadians(lat1);
    double lat2Rad = Math.toRadians(lat2);
    double deltaLat = Math.toRadians(lat2 - lat1);
    double deltaLon = Math.toRadians(lon2 - lon1);

    double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Parse time string to LocalTime
   */
  private LocalTime parseTime(String timeStr) {
    if (timeStr == null || timeStr.trim().isEmpty()) {
      return null;
    }

    try {
      String[] parts = timeStr.trim().split(":");
      if (parts.length >= 2) {
        int hour = Integer.parseInt(parts[0]);
        int minute = Integer.parseInt(parts[1]);
        return LocalTime.of(hour, minute);
      }
    } catch (Exception e) {
      log.debug("Failed to parse time: {}", timeStr);
    }

    return null;
  }

  /**
   * Calculate duration in minutes between two times
   */
  private long calculateDurationMinutes(LocalTime departure, LocalTime arrival) {
    Duration duration;

    if (arrival.isBefore(departure)) {
      // Overnight journey - add 24 hours
      duration = Duration.between(departure, arrival).plusHours(24);
    } else {
      duration = Duration.between(departure, arrival);
    }

    return duration.toMinutes();
  }

  /**
   * Normalize location name for comparison
   */
  private String normalizeLocationName(String name) {
    if (name == null)
      return "";
    return name.trim()
        .toLowerCase()
        .replaceAll("\\s+", " ")
        .replaceAll("[^a-z0-9\\s]", "");
  }

  /**
   * Calculate string similarity (Jaro-Winkler like)
   */
  private double calculateSimilarity(String s1, String s2) {
    if (s1 == null || s2 == null)
      return 0.0;
    if (s1.equals(s2))
      return 1.0;
    if (s1.isEmpty() || s2.isEmpty())
      return 0.0;

    int matchDistance = Math.max(s1.length(), s2.length()) / 2 - 1;
    if (matchDistance < 0)
      matchDistance = 0;

    boolean[] s1Matches = new boolean[s1.length()];
    boolean[] s2Matches = new boolean[s2.length()];

    int matches = 0;
    int transpositions = 0;

    for (int i = 0; i < s1.length(); i++) {
      int start = Math.max(0, i - matchDistance);
      int end = Math.min(i + matchDistance + 1, s2.length());

      for (int j = start; j < end; j++) {
        if (s2Matches[j] || s1.charAt(i) != s2.charAt(j))
          continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches == 0)
      return 0.0;

    int k = 0;
    for (int i = 0; i < s1.length(); i++) {
      if (!s1Matches[i])
        continue;
      while (!s2Matches[k])
        k++;
      if (s1.charAt(i) != s2.charAt(k))
        transpositions++;
      k++;
    }

    return ((double) matches / s1.length() +
        (double) matches / s2.length() +
        (double) (matches - transpositions / 2) / matches) / 3.0;
  }

  /**
   * Check if contribution has valid coordinates
   */
  private boolean hasCoordinates(RouteContribution contribution) {
    return contribution.getFromLatitude() != null &&
        contribution.getFromLongitude() != null &&
        contribution.getToLatitude() != null &&
        contribution.getToLongitude() != null;
  }

  /**
   * Check if contribution has valid times
   */
  private boolean hasValidTimes(RouteContribution contribution) {
    return contribution.getDepartureTime() != null &&
        !contribution.getDepartureTime().trim().isEmpty() &&
        contribution.getArrivalTime() != null &&
        !contribution.getArrivalTime().trim().isEmpty() &&
        TIME_PATTERN.matcher(contribution.getDepartureTime().trim()).matches() &&
        TIME_PATTERN.matcher(contribution.getArrivalTime().trim()).matches();
  }
}
