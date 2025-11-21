package com.perundhu.adapter.in.rest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standardized API error response DTO
 * Provides consistent error information to clients
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

  /**
   * Machine-readable error code for client-side handling
   * Examples: "RESOURCE_NOT_FOUND", "VALIDATION_ERROR", "UNAUTHORIZED"
   */
  private String errorCode;

  /**
   * Technical error message for debugging
   */
  private String message;

  /**
   * User-friendly error message that can be displayed to end users
   * Should be internationalized in production
   */
  private String userMessage;

  /**
   * Timestamp when the error occurred
   */
  @Builder.Default
  private LocalDateTime timestamp = LocalDateTime.now();

  /**
   * Request path where the error occurred
   */
  private String path;

  /**
   * HTTP status code
   */
  private Integer status;

  /**
   * Field-level validation errors (for validation failures)
   * Key: field name, Value: error message
   */
  private Map<String, String> fieldErrors;

  /**
   * Request ID for tracing and correlation
   */
  private String requestId;

  /**
   * Additional context or details about the error
   */
  private Map<String, Object> details;

  /**
   * Create a simple error response with just a message
   */
  public static ApiErrorResponse of(String message) {
    return ApiErrorResponse.builder()
        .message(message)
        .userMessage(message)
        .build();
  }

  /**
   * Create an error response with error code and message
   */
  public static ApiErrorResponse of(String errorCode, String message) {
    return ApiErrorResponse.builder()
        .errorCode(errorCode)
        .message(message)
        .userMessage(message)
        .build();
  }

  /**
   * Create an error response with all basic fields
   */
  public static ApiErrorResponse of(String errorCode, String message, String userMessage, String path) {
    return ApiErrorResponse.builder()
        .errorCode(errorCode)
        .message(message)
        .userMessage(userMessage)
        .path(path)
        .build();
  }
}
