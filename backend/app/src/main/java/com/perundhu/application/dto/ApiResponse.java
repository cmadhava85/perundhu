package com.perundhu.application.dto;

/**
 * DTO for standardized API responses
 */
public class ApiResponse {

    private final String status;
    private final String message;
    private final Object data;

    /**
     * Constructor with status, message, and data
     * 
     * @param status  The response status (success/error)
     * @param message The response message
     * @param data    The response payload data
     */
    public ApiResponse(String status, String message, Object data) {
        this.status = status;
        this.message = message;
        this.data = data;
    }

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
     * Get the response status
     * 
     * @return The status
     */
    public String getStatus() {
        return status;
    }

    /**
     * Get the response message
     * 
     * @return The message
     */
    public String getMessage() {
        return message;
    }

    /**
     * Get the response data
     * 
     * @return The data
     */
    public Object getData() {
        return data;
    }
}
