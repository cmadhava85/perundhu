package com.perundhu.application.dto;

import java.util.List;

/**
 * Model class to hold error details for API responses using Java 17 record
 */
public record ErrorDetails(String code, String message, List<String> details) {

    /**
     * Compact constructor for validation
     */
    public ErrorDetails {
        // No validation needed currently, but could be added here
    }

    /**
     * Constructor with just a message parameter
     */
    public ErrorDetails(String message, List<String> details) {
        this(null, message, details);
    }
}

