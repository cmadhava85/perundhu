package com.perundhu.application.service;

import java.util.regex.Pattern;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.perundhu.domain.model.RouteContribution;

/**
 * Backend validation service that matches frontend validation requirements
 * Simplified for Java 17 compatibility
 */
@Service
public class RouteContributionValidationService {

  private static final Logger log = LoggerFactory.getLogger(RouteContributionValidationService.class);
  private static final Pattern TIME_PATTERN = Pattern.compile("^([01]?[0-9]|2[0-3]):[0-5][0-9]$");

  /**
   * Simple validation result record for Java 17
   */
  public record SimpleValidationResult(boolean isValid, String message) {
  }

  /**
   * Validate a route contribution - simplified Java 17 compatible version
   */
  public SimpleValidationResult validateContribution(RouteContribution contribution) {
    log.info("Validating route contribution ID: {}", contribution.getId());

    // Basic null checks
    if (contribution.getBusNumber() == null || contribution.getBusNumber().trim().isEmpty()) {
      return new SimpleValidationResult(false, "Bus number is required");
    }

    if (contribution.getFromLocationName() == null || contribution.getFromLocationName().trim().isEmpty()) {
      return new SimpleValidationResult(false, "From location is required");
    }

    if (contribution.getToLocationName() == null || contribution.getToLocationName().trim().isEmpty()) {
      return new SimpleValidationResult(false, "To location is required");
    }

    // Validate bus number format
    if (!isValidBusNumber(contribution.getBusNumber())) {
      return new SimpleValidationResult(false, "Bus number format is invalid");
    }

    // Validate location names
    if (!isValidLocationName(contribution.getFromLocationName())) {
      return new SimpleValidationResult(false, "From location name format is invalid");
    }

    if (!isValidLocationName(contribution.getToLocationName())) {
      return new SimpleValidationResult(false, "To location name format is invalid");
    }

    // Check that from and to locations are different
    if (contribution.getFromLocationName().trim().equalsIgnoreCase(contribution.getToLocationName().trim())) {
      return new SimpleValidationResult(false, "Source and destination locations cannot be the same");
    }

    log.info("Route contribution validation passed for ID: {}", contribution.getId());
    return new SimpleValidationResult(true, "Validation successful");
  }

  /**
   * Java 17 compatible validation methods
   */
  private boolean isValidBusNumber(String busNumber) {
    if (busNumber == null || busNumber.trim().isEmpty()) {
      return false;
    }

    String trimmed = busNumber.trim();
    if (trimmed.length() < 1 || trimmed.length() > 20) {
      return false;
    }

    // Allow alphanumeric characters, spaces, hyphens, and slashes
    return trimmed.matches("^[A-Za-z0-9\\s\\-/]+$");
  }

  private boolean isValidLocationName(String locationName) {
    if (locationName == null || locationName.trim().isEmpty()) {
      return false;
    }

    String trimmed = locationName.trim();
    if (trimmed.length() < 2 || trimmed.length() > 100) {
      return false;
    }

    // Allow letters, numbers, spaces, and common punctuation
    return trimmed.matches("^[A-Za-z0-9\\s,.\\-()]+$");
  }

  private boolean isValidTimeFormat(String time) {
    if (time == null || time.trim().isEmpty()) {
      return true; // Time is optional
    }

    return TIME_PATTERN.matcher(time.trim()).matches();
  }

  /**
   * Validate coordinates if present
   */
  public boolean areValidCoordinates(Double latitude, Double longitude) {
    if (latitude == null && longitude == null) {
      return true; // Both null is acceptable
    }

    if (latitude == null || longitude == null) {
      return false; // One null, one not null is invalid
    }

    return latitude >= -90.0 && latitude <= 90.0 &&
        longitude >= -180.0 && longitude <= 180.0;
  }

  /**
   * Enhanced coordinate validation using Optional for null safety
   */
  public Optional<String> validateCoordinates(Double fromLat, Double fromLon, Double toLat, Double toLon) {
    // Check from coordinates
    if (!areValidCoordinates(fromLat, fromLon)) {
      return Optional.of("Invalid from location coordinates");
    }

    // Check to coordinates
    if (!areValidCoordinates(toLat, toLon)) {
      return Optional.of("Invalid to location coordinates");
    }

    return Optional.empty(); // No validation errors
  }
}