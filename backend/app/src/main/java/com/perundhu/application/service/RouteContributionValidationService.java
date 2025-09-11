package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.perundhu.domain.model.RouteContribution;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Backend validation service that matches frontend validation requirements
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class RouteContributionValidationService {

  private final RestTemplate restTemplate = new RestTemplate();
  private final ObjectMapper objectMapper = new ObjectMapper();

  // Validation patterns
  private static final Pattern TIME_PATTERN = Pattern.compile("^([01]?[0-9]|2[0-3]):[0-5][0-9]$");
  private static final Pattern BUS_NUMBER_PATTERN = Pattern.compile("^[A-Z0-9\\-\\s]+$", Pattern.CASE_INSENSITIVE);

  // OpenStreetMap API configuration
  private static final String NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
  private static final long REQUEST_DELAY = 1100; // Rate limit: 1 req/sec
  private static long lastRequestTime = 0;

  /**
   * Comprehensive validation result
   */
  public static class ValidationResult {
    private final boolean valid;
    private final List<String> errors;
    private final List<String> warnings;

    public ValidationResult(boolean valid, List<String> errors, List<String> warnings) {
      this.valid = valid;
      this.errors = errors != null ? errors : new ArrayList<>();
      this.warnings = warnings != null ? warnings : new ArrayList<>();
    }

    public boolean isValid() {
      return valid;
    }

    public List<String> getErrors() {
      return errors;
    }

    public List<String> getWarnings() {
      return warnings;
    }
  }

  /**
   * Simple validation result for single contribution validation
   */
  public static class SimpleValidationResult {
    private final boolean valid;
    private final String message;

    public SimpleValidationResult(boolean valid, String message) {
      this.valid = valid;
      this.message = message;
    }

    public boolean isValid() {
      return valid;
    }

    public String getMessage() {
      return message;
    }
  }

  /**
   * Location coordinates for distance calculations
   */
  public static class LocationCoordinates {
    private final double latitude;
    private final double longitude;
    private final String name;

    public LocationCoordinates(double latitude, double longitude, String name) {
      this.latitude = latitude;
      this.longitude = longitude;
      this.name = name;
    }

    public double getLatitude() {
      return latitude;
    }

    public double getLongitude() {
      return longitude;
    }

    public String getName() {
      return name;
    }
  }

  /**
   * Main validation method for route contributions
   */
  public ValidationResult validateRouteContribution(Map<String, Object> data) {
    List<String> errors = new ArrayList<>();
    List<String> warnings = new ArrayList<>();

    // 1. Bus identification validation (either bus number OR route name required)
    ValidationResult busIdentificationResult = validateBusIdentification(data);
    if (!busIdentificationResult.isValid()) {
      errors.addAll(busIdentificationResult.getErrors());
    }

    // 2. Origin and destination validation (mandatory)
    ValidationResult locationResult = validateOriginDestination(data);
    if (!locationResult.isValid()) {
      errors.addAll(locationResult.getErrors());
    }

    // 3. Timing validation (either departure OR arrival time required)
    ValidationResult timingResult = validateTiming(data);
    if (!timingResult.isValid()) {
      errors.addAll(timingResult.getErrors());
    }
    warnings.addAll(timingResult.getWarnings());

    // 4. Stop validation with OpenStreetMap route checking
    ValidationResult stopsResult = validateStops(data);
    if (!stopsResult.isValid()) {
      errors.addAll(stopsResult.getErrors());
    }
    warnings.addAll(stopsResult.getWarnings());

    return new ValidationResult(errors.isEmpty(), errors, warnings);
  }

  /**
   * Validate bus identification (either bus number OR route name required)
   */
  private ValidationResult validateBusIdentification(Map<String, Object> data) {
    List<String> errors = new ArrayList<>();

    String busNumber = getStringValue(data, "busNumber");
    String routeName = getStringValue(data, "route", "busName");

    if (isEmpty(busNumber) && isEmpty(routeName)) {
      errors.add("Either Bus Number or Route Name must be provided");
      return new ValidationResult(false, errors, null);
    }

    // Validate bus number format if provided
    if (!isEmpty(busNumber)) {
      if (busNumber.length() < 2) {
        errors.add("Bus Number must be at least 2 characters long");
      }
      if (!BUS_NUMBER_PATTERN.matcher(busNumber).matches()) {
        errors.add("Bus Number contains invalid characters. Use only letters, numbers, hyphens, and spaces");
      }
    }

    // Validate route name if provided
    if (!isEmpty(routeName)) {
      if (routeName.length() < 3) {
        errors.add("Route Name must be at least 3 characters long");
      }
      if (routeName.length() > 100) {
        errors.add("Route Name must be less than 100 characters");
      }
    }

    return new ValidationResult(errors.isEmpty(), errors, null);
  }

  /**
   * Validate origin and destination (mandatory)
   */
  private ValidationResult validateOriginDestination(Map<String, Object> data) {
    List<String> errors = new ArrayList<>();

    String origin = getStringValue(data, "origin", "fromLocationName");
    String destination = getStringValue(data, "destination", "toLocationName");

    if (isEmpty(origin)) {
      errors.add("Origin location is mandatory");
    } else if (origin.length() < 2) {
      errors.add("Origin location must be at least 2 characters long");
    }

    if (isEmpty(destination)) {
      errors.add("Destination location is mandatory");
    } else if (destination.length() < 2) {
      errors.add("Destination location must be at least 2 characters long");
    }

    // Check if origin and destination are the same
    if (!isEmpty(origin) && !isEmpty(destination) &&
        origin.trim().equalsIgnoreCase(destination.trim())) {
      errors.add("Origin and destination cannot be the same");
    }

    return new ValidationResult(errors.isEmpty(), errors, null);
  }

  /**
   * Validate timing (either departure OR arrival time required)
   */
  private ValidationResult validateTiming(Map<String, Object> data) {
    List<String> errors = new ArrayList<>();
    List<String> warnings = new ArrayList<>();

    String departureTime = getStringValue(data, "departureTime");
    String arrivalTime = getStringValue(data, "arrivalTime");

    // At least one time must be provided
    if (isEmpty(departureTime) && isEmpty(arrivalTime)) {
      errors.add("Either Departure Time or Arrival Time must be provided");
      return new ValidationResult(false, errors, warnings);
    }

    // Validate time format if provided
    if (!isEmpty(departureTime) && !TIME_PATTERN.matcher(departureTime).matches()) {
      errors.add("Departure Time must be in HH:MM format (24-hour)");
    }

    if (!isEmpty(arrivalTime) && !TIME_PATTERN.matcher(arrivalTime).matches()) {
      errors.add("Arrival Time must be in HH:MM format (24-hour)");
    }

    // If both times are provided, validate logical sequence
    if (!isEmpty(departureTime) && !isEmpty(arrivalTime) &&
        TIME_PATTERN.matcher(departureTime).matches() &&
        TIME_PATTERN.matcher(arrivalTime).matches()) {

      int depMinutes = timeToMinutes(departureTime);
      int arrMinutes = timeToMinutes(arrivalTime);

      if (depMinutes >= arrMinutes) {
        warnings.add("Arrival time is before departure time. Please verify if this is an overnight journey.");
      }

      // Calculate journey duration
      int duration = arrMinutes - depMinutes;
      if (duration < 0)
        duration += 24 * 60; // Handle overnight

      if (duration < 15) {
        warnings.add("Journey duration is very short (less than 15 minutes). Please verify timing.");
      } else if (duration > 24 * 60) {
        errors.add("Journey duration cannot exceed 24 hours");
      }
    }

    return new ValidationResult(errors.isEmpty(), errors, warnings);
  }

  /**
   * Validate stops using OpenStreetMap API for route checking
   */
  @SuppressWarnings("unchecked")
  private ValidationResult validateStops(Map<String, Object> data) {
    List<String> errors = new ArrayList<>();
    List<String> warnings = new ArrayList<>();

    Object stopsObj = data.get("detailedStops");
    if (stopsObj == null) {
      return new ValidationResult(true, errors, warnings); // No stops to validate
    }

    List<Map<String, Object>> stops;
    try {
      stops = (List<Map<String, Object>>) stopsObj;
    } catch (ClassCastException e) {
      warnings.add("Could not process stops data format");
      return new ValidationResult(true, errors, warnings);
    }

    String origin = getStringValue(data, "origin", "fromLocationName");
    String destination = getStringValue(data, "destination", "toLocationName");

    if (isEmpty(origin) || isEmpty(destination)) {
      return new ValidationResult(true, errors, warnings); // Skip stop validation if origin/destination not set
    }

    try {
      // Get coordinates for origin and destination using OpenStreetMap
      LocationCoordinates originCoords = getLocationCoordinates(origin);
      LocationCoordinates destCoords = getLocationCoordinates(destination);

      if (originCoords == null) {
        warnings.add("Could not find coordinates for origin: " + origin);
        return new ValidationResult(true, errors, warnings);
      }

      if (destCoords == null) {
        warnings.add("Could not find coordinates for destination: " + destination);
        return new ValidationResult(true, errors, warnings);
      }

      // Validate each stop
      for (int i = 0; i < stops.size(); i++) {
        Map<String, Object> stop = stops.get(i);
        String stopName = getStringValue(stop, "name");

        if (isEmpty(stopName)) {
          errors.add("Stop " + (i + 1) + ": Stop name is required");
          continue;
        }

        // Get coordinates for the stop
        LocationCoordinates stopCoords = getLocationCoordinates(stopName);

        if (stopCoords == null) {
          warnings.add("Stop " + (i + 1) + ": Could not find coordinates for \"" + stopName + "\"");
          continue;
        }

        // Check if stop is roughly on the route
        RouteValidationResult routeValidation = validateStopOnRoute(
            originCoords, destCoords, stopCoords, stopName);
        if (!routeValidation.isValid()) {
          warnings.add("Stop " + (i + 1) + ": " + routeValidation.getMessage());
        }

        // Validate stop timing if provided
        ValidationResult timingValidation = validateStopTiming(stop, i + 1);
        if (!timingValidation.isValid()) {
          errors.addAll(timingValidation.getErrors());
        }
      }

      // Validate stop sequence timing
      ValidationResult sequenceValidation = validateStopSequence(
          stops, getStringValue(data, "departureTime"), getStringValue(data, "arrivalTime"));
      if (!sequenceValidation.isValid()) {
        errors.addAll(sequenceValidation.getErrors());
      }
      warnings.addAll(sequenceValidation.getWarnings());

    } catch (Exception e) {
      log.error("Error validating stops with OpenStreetMap API", e);
      warnings.add("Could not validate stop locations due to geocoding service issues");
    }

    return new ValidationResult(errors.isEmpty(), errors, warnings);
  }

  /**
   * Get location coordinates using OpenStreetMap Nominatim API
   */
  private LocationCoordinates getLocationCoordinates(String locationName) {
    try {
      // Rate limiting
      long now = System.currentTimeMillis();
      long timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < REQUEST_DELAY) {
        Thread.sleep(REQUEST_DELAY - timeSinceLastRequest);
      }
      lastRequestTime = System.currentTimeMillis();

      String searchQuery = locationName + ", Tamil Nadu, India";
      String url = NOMINATIM_BASE_URL + "/search?q=" +
          java.net.URLEncoder.encode(searchQuery, "UTF-8") +
          "&format=json&countrycodes=in&limit=1&addressdetails=1";

      log.debug("Querying Nominatim for location: {}", locationName);

      String response = restTemplate.getForObject(url, String.class);
      JsonNode results = objectMapper.readTree(response);

      if (results.isArray() && results.size() > 0) {
        JsonNode result = results.get(0);
        double lat = result.get("lat").asDouble();
        double lon = result.get("lon").asDouble();
        String displayName = result.get("display_name").asText();

        log.debug("Found coordinates for {}: lat={}, lon={}", locationName, lat, lon);
        return new LocationCoordinates(lat, lon, displayName);
      } else {
        log.warn("No coordinates found for location: {}", locationName);
        return null;
      }

    } catch (Exception e) {
      log.error("Error getting coordinates for location: " + locationName, e);
      return null;
    }
  }

  /**
   * Route validation result for stop checking
   */
  private static class RouteValidationResult {
    private final boolean valid;
    private final String message;

    public RouteValidationResult(boolean valid, String message) {
      this.valid = valid;
      this.message = message;
    }

    public boolean isValid() {
      return valid;
    }

    public String getMessage() {
      return message;
    }
  }

  /**
   * Check if a stop is reasonably on the route between origin and destination
   */
  private RouteValidationResult validateStopOnRoute(
      LocationCoordinates origin,
      LocationCoordinates destination,
      LocationCoordinates stop,
      String stopName) {

    // Calculate distances using Haversine formula
    double originToStop = calculateDistance(
        origin.getLatitude(), origin.getLongitude(),
        stop.getLatitude(), stop.getLongitude());
    double stopToDestination = calculateDistance(
        stop.getLatitude(), stop.getLongitude(),
        destination.getLatitude(), destination.getLongitude());
    double directDistance = calculateDistance(
        origin.getLatitude(), origin.getLongitude(),
        destination.getLatitude(), destination.getLongitude());

    // Check if stop creates a reasonable detour
    double totalViaStop = originToStop + stopToDestination;
    double detourRatio = totalViaStop / directDistance;

    // Allow up to 50% detour for reasonable stops
    if (detourRatio > 1.5) {
      return new RouteValidationResult(false,
          "\"" + stopName + "\" appears to be significantly off the direct route (" +
              Math.round((detourRatio - 1) * 100) + "% detour)");
    }

    // Check if stop is too close to origin or destination
    if (originToStop < 5) {
      return new RouteValidationResult(false,
          "\"" + stopName + "\" is very close to the origin (" + Math.round(originToStop) + "km)");
    }

    if (stopToDestination < 5) {
      return new RouteValidationResult(false,
          "\"" + stopName + "\" is very close to the destination (" + Math.round(stopToDestination) + "km)");
    }

    return new RouteValidationResult(true, "Stop location is valid");
  }

  /**
   * Validate individual stop timing
   */
  private ValidationResult validateStopTiming(Map<String, Object> stop, int stopNumber) {
    List<String> errors = new ArrayList<>();

    String arrivalTime = getStringValue(stop, "arrivalTime");
    String departureTime = getStringValue(stop, "departureTime");

    if (!isEmpty(arrivalTime) && !TIME_PATTERN.matcher(arrivalTime).matches()) {
      errors.add("Stop " + stopNumber + ": Arrival time must be in HH:MM format");
    }

    if (!isEmpty(departureTime) && !TIME_PATTERN.matcher(departureTime).matches()) {
      errors.add("Stop " + stopNumber + ": Departure time must be in HH:MM format");
    }

    // If both times provided, departure should be after arrival
    if (!isEmpty(arrivalTime) && !isEmpty(departureTime) &&
        TIME_PATTERN.matcher(arrivalTime).matches() &&
        TIME_PATTERN.matcher(departureTime).matches()) {

      int arrMinutes = timeToMinutes(arrivalTime);
      int depMinutes = timeToMinutes(departureTime);

      if (depMinutes < arrMinutes) {
        errors.add("Stop " + stopNumber + ": Departure time cannot be before arrival time");
      }
    }

    return new ValidationResult(errors.isEmpty(), errors, null);
  }

  /**
   * Validate stop sequence timing
   */
  @SuppressWarnings("unchecked")
  private ValidationResult validateStopSequence(
      List<Map<String, Object>> stops, String routeDepartureTime, String routeArrivalTime) {
    List<String> errors = new ArrayList<>();
    List<String> warnings = new ArrayList<>();

    if (stops.isEmpty()) {
      return new ValidationResult(true, errors, warnings);
    }

    // Check timing sequence between consecutive stops
    for (int i = 0; i < stops.size() - 1; i++) {
      Map<String, Object> currentStop = stops.get(i);
      Map<String, Object> nextStop = stops.get(i + 1);

      String currentDepartureTime = getStringValue(currentStop, "departureTime");
      String nextArrivalTime = getStringValue(nextStop, "arrivalTime");

      if (!isEmpty(currentDepartureTime) && !isEmpty(nextArrivalTime)) {
        int currentDepMinutes = timeToMinutes(currentDepartureTime);
        int nextArrMinutes = timeToMinutes(nextArrivalTime);

        if (nextArrMinutes <= currentDepMinutes) {
          errors.add("Stop sequence error: Stop " + (i + 2) +
              " arrival time must be after Stop " + (i + 1) + " departure time");
        }
      }
    }

    // Check first stop against route departure time
    if (!isEmpty(routeDepartureTime) && !stops.isEmpty()) {
      String firstStopArrivalTime = getStringValue(stops.get(0), "arrivalTime");
      if (!isEmpty(firstStopArrivalTime)) {
        int routeDepMinutes = timeToMinutes(routeDepartureTime);
        int firstStopArrMinutes = timeToMinutes(firstStopArrivalTime);

        if (firstStopArrMinutes <= routeDepMinutes) {
          errors.add("First stop arrival time must be after route departure time");
        }
      }
    }

    // Check last stop against route arrival time
    if (!isEmpty(routeArrivalTime) && !stops.isEmpty()) {
      String lastStopDepartureTime = getStringValue(stops.get(stops.size() - 1), "departureTime");
      if (!isEmpty(lastStopDepartureTime)) {
        int routeArrMinutes = timeToMinutes(routeArrivalTime);
        int lastStopDepMinutes = timeToMinutes(lastStopDepartureTime);

        if (lastStopDepMinutes >= routeArrMinutes) {
          errors.add("Last stop departure time must be before route arrival time");
        }
      }
    }

    return new ValidationResult(errors.isEmpty(), errors, warnings);
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    final double R = 6371; // Earth's radius in km
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert time string to minutes since midnight
   */
  private int timeToMinutes(String timeStr) {
    String[] parts = timeStr.split(":");
    return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
  }

  /**
   * Helper method to get string value from map with fallback keys
   */
  private String getStringValue(Map<String, Object> map, String... keys) {
    for (String key : keys) {
      Object value = map.get(key);
      if (value != null) {
        String str = value.toString().trim();
        if (!str.isEmpty()) {
          return str;
        }
      }
    }
    return null;
  }

  /**
   * Check if string is null or empty
   */
  private boolean isEmpty(String str) {
    return str == null || str.trim().isEmpty();
  }

  /**
   * Validate a route contribution - simplified version
   */
  public SimpleValidationResult validateContribution(RouteContribution contribution) {
    log.info("Validating route contribution ID: {}", contribution.getId());

    // Check required fields
    if (contribution.getBusNumber() == null || contribution.getBusNumber().trim().isEmpty()) {
      return new SimpleValidationResult(false, "Bus number is required");
    }

    if (contribution.getFromLocationName() == null || contribution.getFromLocationName().trim().isEmpty()) {
      return new SimpleValidationResult(false, "Source location is required");
    }

    if (contribution.getToLocationName() == null || contribution.getToLocationName().trim().isEmpty()) {
      return new SimpleValidationResult(false, "Destination location is required");
    }

    // Validate bus number format (example: should be alphanumeric with optional
    // hyphens)
    if (!contribution.getBusNumber().matches("^[A-Z0-9\\-]+$")) {
      return new SimpleValidationResult(false, "Bus number format is invalid. Use only letters, numbers, and hyphens.");
    }

    // Validate time formats if provided
    if (contribution.getDepartureTime() != null && !isValidTimeFormat(contribution.getDepartureTime())) {
      return new SimpleValidationResult(false, "Departure time format is invalid. Use HH:MM format.");
    }

    if (contribution.getArrivalTime() != null && !isValidTimeFormat(contribution.getArrivalTime())) {
      return new SimpleValidationResult(false, "Arrival time format is invalid. Use HH:MM format.");
    }

    // Validate coordinates if provided
    if (contribution.getFromLatitude() != null &&
        (contribution.getFromLatitude() < -90 || contribution.getFromLatitude() > 90)) {
      return new SimpleValidationResult(false, "Source latitude must be between -90 and 90 degrees");
    }

    if (contribution.getFromLongitude() != null &&
        (contribution.getFromLongitude() < -180 || contribution.getFromLongitude() > 180)) {
      return new SimpleValidationResult(false, "Source longitude must be between -180 and 180 degrees");
    }

    if (contribution.getToLatitude() != null &&
        (contribution.getToLatitude() < -90 || contribution.getToLatitude() > 90)) {
      return new SimpleValidationResult(false, "Destination latitude must be between -90 and 90 degrees");
    }

    if (contribution.getToLongitude() != null &&
        (contribution.getToLongitude() < -180 || contribution.getToLongitude() > 180)) {
      return new SimpleValidationResult(false, "Destination longitude must be between -180 and 180 degrees");
    }

    // Check if source and destination are different
    if (contribution.getFromLocationName().equalsIgnoreCase(contribution.getToLocationName())) {
      return new SimpleValidationResult(false, "Source and destination locations cannot be the same");
    }

    log.info("Route contribution validation passed for ID: {}", contribution.getId());
    return new SimpleValidationResult(true, "Validation successful");
  }

  /**
   * Validate time format (HH:MM)
   */
  private boolean isValidTimeFormat(String time) {
    if (time == null || time.trim().isEmpty()) {
      return false;
    }

    try {
      java.time.LocalTime.parse(time.trim());
      return true;
    } catch (java.time.format.DateTimeParseException e) {
      return false;
    }
  }
}