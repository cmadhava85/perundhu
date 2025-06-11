package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.util.Map;

import com.perundhu.application.dto.HistoricalAnalyticsDTO;

/**
 * Service interface for bus analytics operations
 */
public interface BusAnalyticsService {
    /**
     * Get historical analytics data for buses
     */
    HistoricalAnalyticsDTO getHistoricalData(
        Long fromLocationId,
        Long toLocationId,
        Long busId,
        LocalDateTime startDateTime,
        LocalDateTime endDateTime,
        String dataType,
        int page,
        int pageSize);
    
    /**
     * Get recommended departure times based on historical performance
     */
    Map<String, Object> getRecommendedDepartureTimes(
        Long fromLocationId,
        Long toLocationId,
        LocalDateTime desiredArrivalTime);
    
    /**
     * Get popular routes for a given time period
     */
    Map<String, Object> getPopularRoutes(
        LocalDateTime startDateTime,
        LocalDateTime endDateTime);
    
    /**
     * Export analytics data in the specified format
     */
    byte[] exportAnalyticsData(
        Long fromLocationId,
        Long toLocationId,
        Long busId,
        LocalDateTime startDateTime,
        LocalDateTime endDateTime,
        String format);
}