package com.perundhu.adapter.in.rest.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standardized API response wrapper for admin endpoints
 * Provides consistent response format across all admin APIs
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminApiResponse<T> {

    /**
     * Indicates whether the operation was successful
     */
    private boolean success;

    /**
     * Human-readable message describing the result
     */
    private String message;

    /**
     * Response data (null if operation failed)
     */
    private T data;

    /**
     * Error details (null if operation succeeded)
     */
    private ErrorDetails error;

    /**
     * Timestamp of the response
     */
    private LocalDateTime timestamp;

    /**
     * Duration of the operation in milliseconds
     */
    private Long durationMs;

    /**
     * Error details
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetails {
        private String code;
        private String message;
        private String field;
        private Object rejectedValue;
    }

    /**
     * Create a success response
     */
    public static <T> AdminApiResponse<T> success(T data, String message) {
        return AdminApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create a success response without data
     */
    public static <T> AdminApiResponse<T> success(String message) {
        return success(null, message);
    }

    /**
     * Create an error response
     */
    public static <T> AdminApiResponse<T> error(String code, String message) {
        return AdminApiResponse.<T>builder()
                .success(false)
                .error(ErrorDetails.builder()
                        .code(code)
                        .message(message)
                        .build())
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Create an error response with field validation details
     */
    public static <T> AdminApiResponse<T> validationError(String field, String message, Object rejectedValue) {
        return AdminApiResponse.<T>builder()
                .success(false)
                .error(ErrorDetails.builder()
                        .code("VALIDATION_ERROR")
                        .field(field)
                        .message(message)
                        .rejectedValue(rejectedValue)
                        .build())
                .timestamp(LocalDateTime.now())
                .build();
    }
}
