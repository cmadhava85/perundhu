package com.perundhu.application.dto;

import java.util.Map;

import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for analytics data points
 */
@Data
@NoArgsConstructor
public class AnalyticsDataPointDTO {
    
    private String timestamp;
    private String date;
    private Long busId;
    private String busName;
    private String busNumber;
    private String metricLabel;
    private Double metricValue;
    private String metricUnit;
    private Map<String, Object> additionalData;
}