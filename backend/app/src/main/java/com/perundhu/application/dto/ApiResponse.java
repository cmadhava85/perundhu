package com.perundhu.application.dto;

/**
 * DTO for standardized API responses using Java 17 record
 */
public record ApiResponse(
        String status,
        String message,
        Object data) {
    /**
     * Constructor with status and message, without data
     * 
     * @param status  The response status (success/error)
     * @param message The response message
     */
    public ApiResponse(String status, String message) {
        this(status, message, null);
    }

    /**
     * Factory method for success responses with data
     */
    public static ApiResponse success(String message, Object data) {
        return new ApiResponse("success", message, data);
    }

    /**
     * Factory method for success responses without data
     */
    public static ApiResponse success(String message) {
        return new ApiResponse("success", message, null);
    }

    /**
     * Factory method for error responses
     */
    public static ApiResponse error(String message) {
        return new ApiResponse("error", message, null);
    }
}
