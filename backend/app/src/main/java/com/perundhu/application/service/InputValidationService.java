package com.perundhu.application.service;

import com.perundhu.domain.port.InputValidationPort;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.regex.Pattern;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Arrays;

/**
 * Application service implementing input validation domain port
 * Protects against XSS, SQL injection, and other malicious inputs
 */
@Service
@Slf4j
public class InputValidationService implements InputValidationPort {

  private static final Logger log = LoggerFactory.getLogger(InputValidationService.class);

  // Malicious pattern detection
  private static final List<Pattern> MALICIOUS_PATTERNS = Arrays.asList(
      Pattern.compile("(?i)<script[^>]*>.*?</script>", Pattern.DOTALL),
      Pattern.compile("(?i)javascript:", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?i)on\\w+\\s*=", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?i)(union|select|insert|update|delete|drop|create|alter)\\s+(all\\s+|distinct\\s+)?(\\*|\\w+)",
          Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?i)(\\bor\\b|\\band\\b)\\s+\\d+\\s*=\\s*\\d+", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?i)\\b(exec|execute|sp_|xp_)\\w*\\b", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?i)\\b(eval|function|constructor)\\s*\\(", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?i)data:(text/html|application/javascript)", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?i)(\\.|%2e){2,}(\\\\|/|%2f|%5c)", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?i)\\$\\{.*\\}", Pattern.CASE_INSENSITIVE), // Template injection
      Pattern.compile("(?i)\\#\\{.*\\}", Pattern.CASE_INSENSITIVE) // EL injection
  );

  // Suspicious user agent patterns
  private static final List<Pattern> SUSPICIOUS_USER_AGENTS = Arrays.asList(
      Pattern.compile("(?i)(bot|crawler|spider|scraper)", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?i)(wget|curl|python|java|php)", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?i)(postman|insomnia|httpclient)", Pattern.CASE_INSENSITIVE),
      Pattern.compile("(?i)^\\s*$", Pattern.CASE_INSENSITIVE), // Empty user agents
      Pattern.compile(".{200,}", Pattern.CASE_INSENSITIVE) // Overly long user agents
  );

  // Valid characters for different input types
  private static final Pattern VALID_BUS_NUMBER = Pattern.compile("^[A-Z0-9-_\\s]{1,20}$");
  private static final Pattern VALID_LOCATION_NAME = Pattern.compile("^[\\p{L}\\p{N}\\s.,'-]{2,100}$",
      Pattern.UNICODE_CHARACTER_CLASS);
  private static final Pattern VALID_EMAIL = Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

  // Rate limiting for validation requests
  private final Map<String, ValidationRateLimit> validationRequests = new ConcurrentHashMap<>();

  @Override
  public String sanitizeTextInput(String input) {
    if (input == null)
      return null;

    // Remove null bytes
    input = input.replace("\0", "");

    // Normalize whitespace
    input = input.replaceAll("\\s+", " ").trim();

    // Remove control characters except common ones
    input = input.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "");

    // HTML encode dangerous characters
    input = input.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#x27;")
        .replace("/", "&#x2F;");

    // Limit length
    if (input.length() > 1000) {
      log.warn("Input truncated due to excessive length: {} characters", input.length());
      input = input.substring(0, 1000);
    }

    return input;
  }

  @Override
  public ValidationResult validateLocationName(String locationName) {
    if (locationName == null || locationName.trim().isEmpty()) {
      return new ValidationResult(false, "Location name cannot be empty", null);
    }

    String sanitized = sanitizeTextInput(locationName);

    // Check for malicious patterns
    if (containsMaliciousPatterns(sanitized)) {
      log.warn("Malicious pattern detected in location name: {}", sanitized);
      return new ValidationResult(false, "Invalid characters in location name", null);
    }

    // Validate format
    if (!VALID_LOCATION_NAME.matcher(sanitized).matches()) {
      return new ValidationResult(false, "Location name contains invalid characters", null);
    }

    return new ValidationResult(true, "Valid location name", sanitized);
  }

  @Override
  public ValidationResult validateBusNumber(String busNumber) {
    // Bus number is optional - return valid if not provided
    if (busNumber == null || busNumber.trim().isEmpty()) {
      return new ValidationResult(true, "Bus number not provided (optional)", null);
    }

    String sanitized = sanitizeTextInput(busNumber).toUpperCase();

    // Check for malicious patterns
    if (containsMaliciousPatterns(sanitized)) {
      log.warn("Malicious pattern detected in bus number: {}", sanitized);
      return new ValidationResult(false, "Invalid characters in bus number", null);
    }

    // Validate format
    if (!VALID_BUS_NUMBER.matcher(sanitized).matches()) {
      return new ValidationResult(false, "Bus number format is invalid", null);
    }

    return new ValidationResult(true, "Valid bus number", sanitized);
  }

  @Override
  public ValidationResult validateCoordinates(Double latitude, Double longitude) {
    if (latitude == null || longitude == null) {
      return new ValidationResult(false, "Coordinates cannot be null", null);
    }

    // Validate latitude range
    if (latitude < -90.0 || latitude > 90.0) {
      return new ValidationResult(false, "Latitude must be between -90 and 90", null);
    }

    // Validate longitude range
    if (longitude < -180.0 || longitude > 180.0) {
      return new ValidationResult(false, "Longitude must be between -180 and 180", null);
    }

    // Check for suspicious precision (possible fake data)
    String latStr = latitude.toString();
    String lngStr = longitude.toString();

    if (latStr.contains(".") && latStr.split("\\.")[1].length() > 8) {
      log.warn("Suspicious coordinate precision detected: lat={}", latitude);
    }

    if (lngStr.contains(".") && lngStr.split("\\.")[1].length() > 8) {
      log.warn("Suspicious coordinate precision detected: lng={}", longitude);
    }

    return new ValidationResult(true, "Valid coordinates", null);
  }

  @Override
  public ValidationResult validateEmail(String email) {
    if (email == null || email.trim().isEmpty()) {
      return new ValidationResult(false, "Email cannot be empty", null);
    }

    String sanitized = email.trim().toLowerCase();

    if (!VALID_EMAIL.matcher(sanitized).matches()) {
      return new ValidationResult(false, "Invalid email format", null);
    }

    // Check for suspicious patterns
    if (containsMaliciousPatterns(sanitized)) {
      return new ValidationResult(false, "Email contains invalid characters", null);
    }

    return new ValidationResult(true, "Valid email", sanitized);
  }

  @Override
  public boolean isSuspiciousUserAgent(String userAgent) {
    if (userAgent == null || userAgent.trim().isEmpty()) {
      return true;
    }

    for (Pattern pattern : SUSPICIOUS_USER_AGENTS) {
      if (pattern.matcher(userAgent).find()) {
        log.warn("Suspicious user agent detected: {}", userAgent);
        return true;
      }
    }

    return false;
  }

  @Override
  public boolean containsMaliciousPatterns(String input) {
    if (input == null)
      return false;

    for (Pattern pattern : MALICIOUS_PATTERNS) {
      if (pattern.matcher(input).find()) {
        return true;
      }
    }

    return false;
  }

  @Override
  public ContributionValidationResult validateContributionData(Map<String, Object> data) {
    Map<String, String> errors = new ConcurrentHashMap<>();
    Map<String, Object> sanitizedValues = new ConcurrentHashMap<>();

    // Validate bus number
    if (data.containsKey("busNumber")) {
      ValidationResult busResult = validateBusNumber((String) data.get("busNumber"));
      if (!busResult.valid()) {
        errors.put("busNumber", busResult.message());
      } else if (busResult.sanitizedValue() != null) {
        sanitizedValues.put("busNumber", busResult.sanitizedValue());
      }
    }

    // Validate locations
    if (data.containsKey("fromLocationName")) {
      ValidationResult fromResult = validateLocationName((String) data.get("fromLocationName"));
      if (!fromResult.valid()) {
        errors.put("fromLocationName", fromResult.message());
      } else if (fromResult.sanitizedValue() != null) {
        sanitizedValues.put("fromLocationName", fromResult.sanitizedValue());
      }
    }

    if (data.containsKey("toLocationName")) {
      ValidationResult toResult = validateLocationName((String) data.get("toLocationName"));
      if (!toResult.valid()) {
        errors.put("toLocationName", toResult.message());
      } else if (toResult.sanitizedValue() != null) {
        sanitizedValues.put("toLocationName", toResult.sanitizedValue());
      }
    }

    // Validate coordinates
    if (data.containsKey("fromLatitude") && data.containsKey("fromLongitude")) {
      ValidationResult coordResult = validateCoordinates(
          (Double) data.get("fromLatitude"),
          (Double) data.get("fromLongitude"));
      if (!coordResult.valid()) {
        errors.put("fromCoordinates", coordResult.message());
      }
    }

    if (data.containsKey("toLatitude") && data.containsKey("toLongitude")) {
      ValidationResult coordResult = validateCoordinates(
          (Double) data.get("toLatitude"),
          (Double) data.get("toLongitude"));
      if (!coordResult.valid()) {
        errors.put("toCoordinates", coordResult.message());
      }
    }

    // Pass through other fields that don't require validation (with null-safety for ConcurrentHashMap)
    // Coordinates
    putIfNotNull(sanitizedValues, "fromLatitude", data.get("fromLatitude"));
    putIfNotNull(sanitizedValues, "fromLongitude", data.get("fromLongitude"));
    putIfNotNull(sanitizedValues, "toLatitude", data.get("toLatitude"));
    putIfNotNull(sanitizedValues, "toLongitude", data.get("toLongitude"));
    
    // Time fields
    putIfNotNull(sanitizedValues, "departureTime", data.get("departureTime"));
    putIfNotNull(sanitizedValues, "arrivalTime", data.get("arrivalTime"));
    
    // Additional metadata fields
    putIfNotNull(sanitizedValues, "additionalNotes", data.get("additionalNotes"));
    putIfNotNull(sanitizedValues, "scheduleInfo", data.get("scheduleInfo"));
    putIfNotNull(sanitizedValues, "stops", data.get("stops"));
    putIfNotNull(sanitizedValues, "busName", data.get("busName"));
    
    // ADD_STOPS contribution fields
    putIfNotNull(sanitizedValues, "sourceBusId", data.get("sourceBusId"));
    putIfNotNull(sanitizedValues, "contributionType", data.get("contributionType"));
    
    // Additional paste contribution fields
    putIfNotNull(sanitizedValues, "submittedBy", data.get("submittedBy"));
    putIfNotNull(sanitizedValues, "source", data.get("source"));
    putIfNotNull(sanitizedValues, "confidenceScore", data.get("confidenceScore"));
    putIfNotNull(sanitizedValues, "validationWarnings", data.get("validationWarnings"));

    return new ContributionValidationResult(errors.isEmpty(), errors, sanitizedValues);
  }
  
  /**
   * Helper method to safely put a value into a ConcurrentHashMap (which doesn't allow null values)
   */
  private void putIfNotNull(Map<String, Object> map, String key, Object value) {
    if (value != null) {
      map.put(key, value);
    }
  }

  @Override
  public boolean checkValidationRateLimit(String clientId, int maxRequests, long windowMs) {
    ValidationRateLimit rateLimit = validationRequests.computeIfAbsent(
        clientId,
        k -> new ValidationRateLimit());

    long now = System.currentTimeMillis();

    // Clean old requests outside window
    rateLimit.requests.removeIf(timestamp -> now - timestamp > windowMs);

    // Check if limit exceeded
    if (rateLimit.requests.size() >= maxRequests) {
      log.warn("Validation rate limit exceeded for client: {}", clientId);
      return false;
    }

    // Add current request
    rateLimit.requests.add(now);
    return true;
  }

  @Override
  public void cleanupRateLimitData() {
    long cutoff = System.currentTimeMillis() - 3600000; // 1 hour
    validationRequests.entrySet().removeIf(entry -> {
      entry.getValue().requests.removeIf(timestamp -> timestamp < cutoff);
      return entry.getValue().requests.isEmpty();
    });

    log.debug("Cleaned up validation rate limit data");
  }

  @Override
  public boolean isValidFileUpload(byte[] fileContent, String contentType) {
    if (fileContent == null || fileContent.length == 0) {
      return false;
    }

    // Check file size (max 10MB)
    if (fileContent.length > 10 * 1024 * 1024) {
      log.warn("File upload too large: {} bytes", fileContent.length);
      return false;
    }

    // Check content type
    if (contentType == null || !contentType.startsWith("image/")) {
      log.warn("Invalid file content type: {}", contentType);
      return false;
    }

    // Basic file signature validation
    if (fileContent.length < 4) {
      return false;
    }

    // Check for valid image signatures
    return hasValidImageSignature(fileContent);
  }

  @Override
  public boolean isValidTimeFormat(String time) {
    if (time == null || time.trim().isEmpty()) {
      return false;
    }

    String sanitized = time.trim();

    // Check for common time formats: HH:MM, H:MM, HH:MM AM/PM, etc.
    Pattern timePattern = Pattern.compile("^([0-1]?[0-9]|2[0-3]):[0-5][0-9](\\s*(AM|PM|am|pm))?$");

    if (!timePattern.matcher(sanitized).matches()) {
      // Try 12-hour format without leading zero
      Pattern time12Pattern = Pattern.compile("^(1[0-2]|[1-9]):[0-5][0-9]\\s*(AM|PM|am|pm)$");
      return time12Pattern.matcher(sanitized).matches();
    }

    return true;
  }

  private boolean hasValidImageSignature(byte[] content) {
    if (content.length < 4) {
      return false;
    }

    // JPEG: FF D8 FF
    if (content[0] == (byte) 0xFF && content[1] == (byte) 0xD8 && content[2] == (byte) 0xFF) {
      return true;
    }

    // PNG: 89 50 4E 47
    if (content[0] == (byte) 0x89 && content[1] == 0x50 && content[2] == 0x4E && content[3] == 0x47) {
      return true;
    }

    // WebP: starts with "RIFF" and contains "WEBP"
    if (content.length >= 12 &&
        content[0] == 0x52 && content[1] == 0x49 && content[2] == 0x46 && content[3] == 0x46 && // "RIFF"
        content[8] == 0x57 && content[9] == 0x45 && content[10] == 0x42 && content[11] == 0x50) { // "WEBP"
      return true;
    }

    return false;
  }

  // Supporting classes - implementing the domain port records
  private static class ValidationRateLimit {
    private final List<Long> requests = new java.util.concurrent.CopyOnWriteArrayList<>();
  }
}