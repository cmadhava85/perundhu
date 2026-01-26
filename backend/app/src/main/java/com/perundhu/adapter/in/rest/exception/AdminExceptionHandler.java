package com.perundhu.adapter.in.rest.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import com.perundhu.adapter.in.rest.dto.AdminApiResponse;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;

/**
 * Centralized exception handler for all admin controllers
 * Provides consistent error responses and logging across admin endpoints
 */
@RestControllerAdvice(basePackages = "com.perundhu.adapter.in.rest")
@Slf4j
public class AdminExceptionHandler {

    /**
     * Handle validation errors from @Valid annotations
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<AdminApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex,
            WebRequest request) {
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        log.warn("Validation error on {}: {}", request.getDescription(false), errors);

        AdminApiResponse<Map<String, String>> response = AdminApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Validation failed")
                .data(errors)
                .error(AdminApiResponse.ErrorDetails.builder()
                        .code("VALIDATION_ERROR")
                        .message("One or more fields have validation errors")
                        .build())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle constraint violation exceptions
     */
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<AdminApiResponse<Map<String, String>>> handleConstraintViolationException(
            ConstraintViolationException ex,
            WebRequest request) {
        
        Map<String, String> errors = ex.getConstraintViolations().stream()
                .collect(Collectors.toMap(
                        violation -> violation.getPropertyPath().toString(),
                        ConstraintViolation::getMessage));

        log.warn("Constraint violation on {}: {}", request.getDescription(false), errors);

        AdminApiResponse<Map<String, String>> response = AdminApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Validation failed")
                .data(errors)
                .error(AdminApiResponse.ErrorDetails.builder()
                        .code("CONSTRAINT_VIOLATION")
                        .message("One or more constraints were violated")
                        .build())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle illegal argument exceptions
     */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<AdminApiResponse<Void>> handleIllegalArgumentException(
            IllegalArgumentException ex,
            WebRequest request) {
        
        log.warn("Illegal argument on {}: {}", request.getDescription(false), ex.getMessage());

        AdminApiResponse<Void> response = AdminApiResponse.error(
                "ILLEGAL_ARGUMENT",
                ex.getMessage() != null ? ex.getMessage() : "Invalid argument provided");

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle resource not found exceptions
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<AdminApiResponse<Void>> handleResourceNotFoundException(
            ResourceNotFoundException ex,
            WebRequest request) {
        
        log.warn("Resource not found on {}: {}", request.getDescription(false), ex.getMessage());

        AdminApiResponse<Void> response = AdminApiResponse.error(
                "RESOURCE_NOT_FOUND",
                ex.getMessage() != null ? ex.getMessage() : "Requested resource not found");

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Handle access denied exceptions
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<AdminApiResponse<Void>> handleAccessDeniedException(
            AccessDeniedException ex,
            WebRequest request) {
        
        log.warn("Access denied on {}: {}", request.getDescription(false), ex.getMessage());

        AdminApiResponse<Void> response = AdminApiResponse.error(
                "ACCESS_DENIED",
                "You do not have permission to perform this action");

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    /**
     * Handle admin operation exceptions
     */
    @ExceptionHandler(AdminOperationException.class)
    public ResponseEntity<AdminApiResponse<Void>> handleAdminOperationException(
            AdminOperationException ex,
            WebRequest request) {
        
        log.error("Admin operation failed on {}: {}", request.getDescription(false), ex.getMessage(), ex);

        AdminApiResponse<Void> response = AdminApiResponse.error(
                ex.getErrorCode(),
                ex.getMessage());

        return ResponseEntity.status(ex.getHttpStatus()).body(response);
    }

    /**
     * Handle runtime exceptions
     */
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<AdminApiResponse<Void>> handleRuntimeException(
            RuntimeException ex,
            WebRequest request) {
        
        log.error("Runtime exception on {}: {}", request.getDescription(false), ex.getMessage(), ex);

        // Don't expose internal error details in production
        String message = "An unexpected error occurred. Please try again later.";
        
        AdminApiResponse<Void> response = AdminApiResponse.error(
                "INTERNAL_ERROR",
                message);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<AdminApiResponse<Void>> handleGenericException(
            Exception ex,
            WebRequest request) {
        
        log.error("Unexpected exception on {}: {}", request.getDescription(false), ex.getMessage(), ex);

        AdminApiResponse<Void> response = AdminApiResponse.error(
                "INTERNAL_ERROR",
                "An unexpected error occurred. Please contact support if the problem persists.");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    /**
     * Custom exception for resource not found scenarios
     */
    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) {
            super(message);
        }

        public ResourceNotFoundException(String resourceType, String resourceId) {
            super(String.format("%s with ID '%s' not found", resourceType, resourceId));
        }
    }

    /**
     * Custom exception for admin operations
     */
    public static class AdminOperationException extends RuntimeException {
        private final String errorCode;
        private final HttpStatus httpStatus;

        public AdminOperationException(String errorCode, String message, HttpStatus httpStatus) {
            super(message);
            this.errorCode = errorCode;
            this.httpStatus = httpStatus;
        }

        public AdminOperationException(String errorCode, String message) {
            this(errorCode, message, HttpStatus.INTERNAL_SERVER_ERROR);
        }

        public String getErrorCode() {
            return errorCode;
        }

        public HttpStatus getHttpStatus() {
            return httpStatus;
        }
    }
}
