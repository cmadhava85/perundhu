package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Primary;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.BusAnalyticsRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.application.dto.HistoricalAnalyticsDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Primary
@RequiredArgsConstructor
@Slf4j
public class BusAnalyticsServiceImpl implements BusAnalyticsService {

    private final BusAnalyticsRepository busAnalyticsRepository;
    private final LocationRepository locationRepository;

    @Override
    public HistoricalAnalyticsDTO getHistoricalData(
            Long fromLocationId, Long toLocationId, Long busId,
            LocalDateTime startDateTime, LocalDateTime endDateTime,
            String dataType, int page, int pageSize) {
        
        log.debug("Getting historical data for period {} to {}", startDateTime, endDateTime);
        
        Location fromLocation = fromLocationId != null ? 
            locationRepository.findById(new Location.LocationId(fromLocationId)).orElse(null) : null;
        Location toLocation = toLocationId != null ? 
            locationRepository.findById(new Location.LocationId(toLocationId)).orElse(null) : null;

        var analytics = busAnalyticsRepository.findByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
            fromLocation, toLocation, busId, startDateTime, endDateTime, (page - 1) * pageSize, pageSize
        );

        return HistoricalAnalyticsDTO.builder()
            .data(analytics)
            .totalCount(busAnalyticsRepository.countByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
                fromLocation, toLocation, busId, startDateTime, endDateTime))
            .page(page)
            .pageSize(pageSize)
            .build();
    }

    @Override
    public Map<String, Object> getRecommendedDepartureTimes(
            Long fromLocationId, Long toLocationId, LocalDateTime desiredArrivalTime) {
        
        log.debug("Getting recommended departure times for arrival at {}", desiredArrivalTime);
        
        Location fromLocation = locationRepository.findById(new Location.LocationId(fromLocationId))
            .orElseThrow(() -> new IllegalArgumentException("Invalid from location ID"));
        Location toLocation = locationRepository.findById(new Location.LocationId(toLocationId))
            .orElseThrow(() -> new IllegalArgumentException("Invalid to location ID"));

        var historicalData = busAnalyticsRepository.findByFromLocationAndToLocationAndDateTimeBetween(
            fromLocation, toLocation, desiredArrivalTime.minusMonths(1), desiredArrivalTime
        );

        var recommendations = new HashMap<String, Object>();
        recommendations.put("recommendedDepartureTimes", calculateRecommendedTimes(historicalData, desiredArrivalTime));
        recommendations.put("confidence", calculateConfidenceScore(historicalData));
        
        return recommendations;
    }

    @Override
    public Map<String, Object> getPopularRoutes(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        log.debug("Getting popular routes for period {} to {}", startDateTime, endDateTime);
        
        var analytics = busAnalyticsRepository.findByDateTimeBetween(startDateTime, endDateTime);
        var popularRoutes = analyzePopularRoutes(analytics);
        
        var result = new HashMap<String, Object>();
        result.put("popularRoutes", popularRoutes);
        result.put("totalRecords", analytics.size());
        result.put("period", Map.of(
            "start", startDateTime,
            "end", endDateTime
        ));
        
        return result;
    }

    @Override
    public byte[] exportAnalyticsData(
            Long fromLocationId, Long toLocationId, Long busId,
            LocalDateTime startDateTime, LocalDateTime endDateTime, String format) {
        
        log.debug("Exporting analytics data in {} format", format);
        
        Location fromLocation = fromLocationId != null ? 
            locationRepository.findById(new Location.LocationId(fromLocationId)).orElse(null) : null;
        Location toLocation = toLocationId != null ? 
            locationRepository.findById(new Location.LocationId(toLocationId)).orElse(null) : null;

        var analytics = busAnalyticsRepository.findByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
            fromLocation,
            toLocation,
            busId,
            startDateTime,
            endDateTime,
            0,  // page number
            10  // page size
        );

        // For now, just return a simple string representation
        // In a real implementation, this would use proper export formatting
        return analytics.toString().getBytes();
    }

    private List<Map<String, Object>> calculateRecommendedTimes(List<com.perundhu.domain.model.BusAnalytics> historicalData, LocalDateTime targetTime) {
        var recommendations = new ArrayList<Map<String, Object>>();
        
        // Calculate average delays and derive recommended departure times
        // This is a simplified implementation
        var avgDelay = historicalData.stream()
            .filter(a -> a.getAverageDelay() != null)
            .mapToDouble(a -> a.getAverageDelay())
            .average()
            .orElse(0.0);
        
        var recommendedTime = targetTime.minusMinutes(Math.round(avgDelay));
        recommendations.add(Map.of(
            "time", recommendedTime,
            "confidence", "HIGH",
            "expectedDelay", avgDelay
        ));
        
        return recommendations;
    }

    private String calculateConfidenceScore(List<com.perundhu.domain.model.BusAnalytics> historicalData) {
        if (historicalData.size() < 10) {
            return "LOW";
        } else if (historicalData.size() < 30) {
            return "MEDIUM";
        } else {
            return "HIGH";
        }
    }

    private List<Map<String, Object>> analyzePopularRoutes(List<com.perundhu.domain.model.BusAnalytics> analytics) {
        var routes = new ArrayList<Map<String, Object>>();
        
        // Group and analyze routes
        // This is a simplified implementation
        analytics.stream()
            .filter(a -> a.getBus() != null)
            .forEach(a -> {
                var route = new HashMap<String, Object>();
                route.put("busId", a.getBus().getId().getValue());
                route.put("busName", a.getBus().getName());
                route.put("totalPassengers", a.getTotalPassengers());
                routes.add(route);
            });
        
        return routes;
    }
}

