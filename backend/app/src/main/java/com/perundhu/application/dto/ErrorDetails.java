package com.perundhu.application.dto;

import java.util.List;

/**
 * Model class to hold error details for API responses using Java 17 record
 */
public record ErrorDetails(String code, String message, List<String> details) {}