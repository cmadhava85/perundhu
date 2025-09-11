package com.perundhu.domain.port;

import java.util.Map;

/**
 * Domain port for input validation and sanitization operations
 * Defines the contract for secure data validation and cleaning
 */
public interface InputValidationPort {

  /**
   * Sanitize general text input to prevent XSS and other attacks
   */
  String sanitizeTextInput(String input);

  /**
   * Validate and sanitize location name
   */
  ValidationResult validateLocationName(String locationName);

  /**
   * Validate and sanitize bus number
   */
  ValidationResult validateBusNumber(String busNumber);

  /**
   * Validate geographic coordinates
   */
  ValidationResult validateCoordinates(Double latitude, Double longitude);

  /**
   * Validate email format and content
   */
  ValidationResult validateEmail(String email);

  /**
   * Check if user agent appears suspicious
   */
  boolean isSuspiciousUserAgent(String userAgent);

  /**
   * Check for malicious patterns in input
   */
  boolean containsMaliciousPatterns(String input);

  /**
   * Validate and sanitize contribution data
   */
  ContributionValidationResult validateContributionData(Map<String, Object> data);

  /**
   * Check validation rate limiting for a client
   */
  boolean checkValidationRateLimit(String clientId, int maxRequests, long windowMs);

  /**
   * Clean up old rate limit data
   */
  void cleanupRateLimitData();

  /**
   * Validate file upload
   */
  boolean isValidFileUpload(byte[] fileContent, String contentType);

  /**
   * Validate time format
   */
  boolean isValidTimeFormat(String time);

  /**
   * Result of validation operation
   */
  record ValidationResult(
      boolean valid,
      String message,
      String sanitizedValue) {
  }

  /**
   * Result of contribution data validation
   */
  record ContributionValidationResult(
      boolean valid,
      Map<String, String> errors,
      Map<String, Object> sanitizedValues) {
  }
}