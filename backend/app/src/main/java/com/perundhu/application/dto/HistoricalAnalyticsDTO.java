package com.perundhu.application.dto;

import java.util.List;

import com.perundhu.domain.model.BusAnalytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Value;

/**
 * DTO for historical analytics data
 */
@Value
@Builder
@AllArgsConstructor
public class HistoricalAnalyticsDTO {
    List<BusAnalytics> data;
    int totalCount;
    int page;
    int pageSize;
}