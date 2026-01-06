package com.perundhu.application.dto;

import java.util.Map;
import jakarta.validation.constraints.*;
import org.springframework.lang.Nullable;

/**
 * DTO for analytics data points
 * Used to transfer time-series analytics data to clients
 * All fields are validated to ensure data integrity
 */
public record AnalyticsDataPointDTO(
    @NotBlank(message = "Timestamp is required")
    String timestamp,
    
    @NotBlank(message = "Date is required")
    String date,
    
    @NotNull(message = "Bus ID is required")
    Long busId,
    
    @NotBlank(message = "Bus name is required")
    String busName,
    
    @NotBlank(message = "Bus number is required")
    String busNumber,
    
    @NotBlank(message = "Metric label is required")
    String metricLabel,
    
    @NotNull(message = "Metric value is required")
    Double metricValue,
    
    @NotBlank(message = "Metric unit is required")
    String metricUnit,
    
    @Nullable
    Map<String, Object> additionalData
) {
    /**
     * Compact constructor for validation and defensive copying
     */
    public AnalyticsDataPointDTO {
        // Defensive copy of additional data map for immutability
        if (additionalData != null) {
            additionalData = Map.copyOf(additionalData);
        }
    }
}

