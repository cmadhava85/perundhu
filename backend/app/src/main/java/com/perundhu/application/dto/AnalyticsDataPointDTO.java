package com.perundhu.application.dto;

import java.util.Map;

/**
 * DTO for analytics data points
 */
public record AnalyticsDataPointDTO(
    String timestamp,
    String date,
    Long busId,
    String busName,
    String busNumber,
    String metricLabel,
    Double metricValue,
    String metricUnit,
    Map<String, Object> additionalData
) {}

