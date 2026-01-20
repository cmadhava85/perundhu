package com.perundhu.infrastructure.exception;

import com.perundhu.application.dto.ErrorResponse;
import com.perundhu.domain.exception.DomainValidationException;
import com.perundhu.exception.BusinessException;
import com.perundhu.exception.InvalidRequestException;
import com.perundhu.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler for standardized error responses
 * 
 * Handles all exceptions thrown by controllers and provides consistent
 * error format for frontend consumption. Includes trace ID propagation
 * for debugging and log correlation.
 * 
 * Benefits:
 * - Consistent API error format
 * - Better client-side error handling
 * - Automatic trace ID propagation
 * - Cleaner controller code (removes repetitive error handling)
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
  private static final String TRACE_ID_HEADER = "X-Trace-Id";

  /**
   * Handle validation errors from @Valid annotations
   */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidationError(
      MethodArgumentNotValidException ex,
      HttpServletRequest request) {

    String traceId = request.getHeader(TRACE_ID_HEADER);
    log.warn("[{}] Validation error on {}: {}", traceId, request.getRequestURI(), ex.getMessage());

    Map<String, String> validationErrors = ex.getBindingResult()
        .getFieldErrors()
        .stream()
        .collect(Collectors.toMap(
            FieldError::getField,
            error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value",
            (existing, replacement) -> existing // Keep first error message for duplicate fields
        ));

    ErrorResponse error = ErrorResponse.builder()
        .timestamp(LocalDateTime.now())
        .status(HttpStatus.BAD_REQUEST.value())
        .error("Validation Error")
        .message("Input validation failed")
        .traceId(traceId)
        .path(request.getRequestURI())
        .validationErrors(validationErrors)
        .build();

    return ResponseEntity.badRequest().body(error);
  }

  /**
   * Handle constraint violations from @Validated
   */
  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ErrorResponse> handleConstraintViolation(
      ConstraintViolationException ex,
      HttpServletRequest request) {

    String traceId = request.getHeader(TRACE_ID_HEADER);
    log.warn("[{}] Constraint violation on {}: {}", traceId, request.getRequestURI(), ex.getMessage());

    Map<String, String> validationErrors = ex.getConstraintViolations()
        .stream()
        .collect(Collectors.toMap(
            violation -> violation.getPropertyPath().toString(),
            ConstraintViolation::getMessage,
            (existing, replacement) -> existing));

    ErrorResponse error = ErrorResponse.builder()
        .timestamp(LocalDateTime.now())
        .status(HttpStatus.BAD_REQUEST.value())
        .error("Constraint Violation")
        .message("Request constraint validation failed")
        .traceId(traceId)
        .path(request.getRequestURI())
        .validationErrors(validationErrors)
        .build();

    return ResponseEntity.badRequest().body(error);
  }

  /**
   * Handle resource not found exceptions
   */
  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleResourceNotFound(
      ResourceNotFoundException ex,
      HttpServletRequest request) {

    String traceId = request.getHeader(TRACE_ID_HEADER);
    log.warn("[{}] Resource not found on {}: {}", traceId, request.getRequestURI(), ex.getMessage());

    ErrorResponse error = ErrorResponse.builder()
        .timestamp(LocalDateTime.now())
        .status(HttpStatus.NOT_FOUND.value())
        .error("Resource Not Found")
        .message(ex.getMessage())
        .traceId(traceId)
        .path(request.getRequestURI())
        .build();

    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
  }

  /**
   * Handle business logic exceptions
   */
  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ErrorResponse> handleBusinessException(
      BusinessException ex,
      HttpServletRequest request) {

    String traceId = request.getHeader(TRACE_ID_HEADER);
    log.warn("[{}] Business exception on {}: {} (code: {})",
        traceId, request.getRequestURI(), ex.getMessage(), ex.getErrorCode());

    Map<String, String> details = null;
    if (!ex.getDetails().isEmpty()) {
      details = new HashMap<>();
      for (int i = 0; i < ex.getDetails().size(); i++) {
        BusinessException.ErrorDetail detail = ex.getDetails().get(i);
        details.put(detail.code() + "_" + i, detail.message());
      }
    }

    ErrorResponse error = ErrorResponse.builder()
        .timestamp(LocalDateTime.now())
        .status(HttpStatus.UNPROCESSABLE_ENTITY.value())
        .error("Business Rule Violation")
        .message(ex.getMessage())
        .traceId(traceId)
        .path(request.getRequestURI())
        .validationErrors(details)
        .build();

    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(error);
  }

  /**
   * Handle domain validation exceptions
   */
  @ExceptionHandler(DomainValidationException.class)
  public ResponseEntity<ErrorResponse> handleDomainValidation(
      DomainValidationException ex,
      HttpServletRequest request) {

    String traceId = request.getHeader(TRACE_ID_HEADER);
    log.warn("[{}] Domain validation error on {}: {}", traceId, request.getRequestURI(), ex.getMessage());

    ErrorResponse error = ErrorResponse.builder()
        .timestamp(LocalDateTime.now())
        .status(HttpStatus.BAD_REQUEST.value())
        .error("Domain Validation Error")
        .message(ex.getMessage())
        .traceId(traceId)
        .path(request.getRequestURI())
        .build();

    return ResponseEntity.badRequest().body(error);
  }

  /**
   * Handle invalid request exceptions
   */
  @ExceptionHandler(InvalidRequestException.class)
  public ResponseEntity<ErrorResponse> handleInvalidRequest(
      InvalidRequestException ex,
      HttpServletRequest request) {

    String traceId = request.getHeader(TRACE_ID_HEADER);
    log.warn("[{}] Invalid request on {}: {}", traceId, request.getRequestURI(), ex.getMessage());

    ErrorResponse error = ErrorResponse.builder()
        .timestamp(LocalDateTime.now())
        .status(HttpStatus.BAD_REQUEST.value())
        .error("Invalid Request")
        .message(ex.getMessage())
        .traceId(traceId)
        .path(request.getRequestURI())
        .build();

    return ResponseEntity.badRequest().body(error);
  }

  /**
   * Handle illegal argument exceptions
   */
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorResponse> handleIllegalArgument(
      IllegalArgumentException ex,
      HttpServletRequest request) {

    String traceId = request.getHeader(TRACE_ID_HEADER);
    log.warn("[{}] Illegal argument on {}: {}", traceId, request.getRequestURI(), ex.getMessage());

    ErrorResponse error = ErrorResponse.builder()
        .timestamp(LocalDateTime.now())
        .status(HttpStatus.BAD_REQUEST.value())
        .error("Invalid Argument")
        .message(ex.getMessage())
        .traceId(traceId)
        .path(request.getRequestURI())
        .build();

    return ResponseEntity.badRequest().body(error);
  }

  /**
   * Handle type mismatch errors (e.g., passing string where number expected)
   */
  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ErrorResponse> handleTypeMismatch(
      MethodArgumentTypeMismatchException ex,
      HttpServletRequest request) {

    String traceId = request.getHeader(TRACE_ID_HEADER);
    log.warn("[{}] Type mismatch on {}: {}", traceId, request.getRequestURI(), ex.getMessage());

    String message = String.format("Invalid value for parameter '%s': expected type %s",
        ex.getName(),
        ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");

    ErrorResponse error = ErrorResponse.builder()
        .timestamp(LocalDateTime.now())
        .status(HttpStatus.BAD_REQUEST.value())
        .error("Type Mismatch")
        .message(message)
        .traceId(traceId)
        .path(request.getRequestURI())
        .build();

    return ResponseEntity.badRequest().body(error);
  }

  /**
   * Handle rate limit exceptions
   */
  @ExceptionHandler(RateLimitException.class)
  public ResponseEntity<ErrorResponse> handleRateLimit(
      RateLimitException ex,
      HttpServletRequest request) {

    String traceId = request.getHeader(TRACE_ID_HEADER);
    log.warn("[{}] Rate limit exceeded on {}: {}", traceId, request.getRequestURI(), ex.getMessage());

    ErrorResponse error = ErrorResponse.builder()
        .timestamp(LocalDateTime.now())
        .status(HttpStatus.TOO_MANY_REQUESTS.value())
        .error("Rate Limit Exceeded")
        .message(ex.getMessage())
        .traceId(traceId)
        .path(request.getRequestURI())
        .build();

    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
  }

  /**
   * Handle authentication errors
   */
  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ErrorResponse> handleBadCredentials(
      BadCredentialsException ex,
      HttpServletRequest request) {

    String traceId = request.getHeader(TRACE_ID_HEADER);
    log.warn("[{}] Authentication failed on {}", traceId, request.getRequestURI());

    ErrorResponse error = ErrorResponse.builder()
        .timestamp(LocalDateTime.now())
        .status(HttpStatus.UNAUTHORIZED.value())
        .error("Authentication Failed")
        .message("Invalid credentials")
        .traceId(traceId)
        .path(request.getRequestURI())
        .build();

    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
  }

  /**
   * Handle authorization errors
   */
  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ErrorResponse> handleAccessDenied(
      AccessDeniedException ex,
      HttpServletRequest request) {

    String traceId = request.getHeader(TRACE_ID_HEADER);
    log.warn("[{}] Access denied on {}", traceId, request.getRequestURI());

    ErrorResponse error = ErrorResponse.builder()
        .timestamp(LocalDateTime.now())
        .status(HttpStatus.FORBIDDEN.value())
        .error("Access Denied")
        .message("You don't have permission to access this resource")
        .traceId(traceId)
        .path(request.getRequestURI())
        .build();

    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
  }

  /**
   * Handle all other exceptions
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGenericException(
      Exception ex,
      HttpServletRequest request) {

    String traceId = request.getHeader(TRACE_ID_HEADER);
    log.error("[{}] Unexpected error on {}", traceId, request.getRequestURI(), ex);

    // Don't expose internal error details in production
    String message = "An unexpected error occurred. Please try again later.";

    ErrorResponse error = ErrorResponse.builder()
        .timestamp(LocalDateTime.now())
        .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
        .error("Internal Server Error")
        .message(message)
        .traceId(traceId)
        .path(request.getRequestURI())
        .build();

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
  }
}
