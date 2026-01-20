package com.perundhu.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standardized error response for all API endpoints
 * Provides consistent error format for frontend consumption
 * 
 * Features:
 * - Consistent structure across all error types
 * - Trace ID for debugging and log correlation
 * - Field-level validation errors for form submissions
 * - Timestamp for error occurrence tracking
 * 
 * @param timestamp        When the error occurred
 * @param status           HTTP status code
 * @param error            Error category/type
 * @param message          Human-readable error message
 * @param traceId          Unique trace ID for log correlation
 * @param path             Request path where error occurred
 * @param validationErrors Field-level validation errors (optional)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    LocalDateTime timestamp,
    int status,
    String error,
    String message,
    String traceId,
    String path,
    Map<String, String> validationErrors) {

  /**
   * Builder pattern for flexible construction
   */
  public static class Builder {
    private LocalDateTime timestamp = LocalDateTime.now();
    private int status;
    private String error;
    private String message;
    private String traceId;
    private String path;
    private Map<String, String> validationErrors;

    public Builder timestamp(LocalDateTime timestamp) {
      this.timestamp = timestamp;
      return this;
    }

    public Builder status(int status) {
      this.status = status;
      return this;
    }

    public Builder error(String error) {
      this.error = error;
      return this;
    }

    public Builder message(String message) {
      this.message = message;
      return this;
    }

    public Builder traceId(String traceId) {
      this.traceId = traceId;
      return this;
    }

    public Builder path(String path) {
      this.path = path;
      return this;
    }

    public Builder validationErrors(Map<String, String> validationErrors) {
      this.validationErrors = validationErrors;
      return this;
    }

    public ErrorResponse build() {
      return new ErrorResponse(timestamp, status, error, message, traceId, path, validationErrors);
    }
  }

  public static Builder builder() {
    return new Builder();
  }

  /**
   * Simple error response without validation errors
   */
  public ErrorResponse(LocalDateTime timestamp, int status, String error, String message, String traceId, String path) {
    this(timestamp, status, error, message, traceId, path, null);
  }
}
