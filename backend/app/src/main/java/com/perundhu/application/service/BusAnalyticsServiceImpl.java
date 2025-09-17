package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import com.perundhu.application.dto.HistoricalAnalyticsDTO;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.port.BusAnalyticsRepository;
import com.perundhu.domain.port.LocationRepository;

@Service
@Primary
public class BusAnalyticsServiceImpl implements BusAnalyticsService {

    // Constants to avoid string duplication
    private static final String TOTAL_PASSENGERS_KEY = "totalPassengers";

    // Standard SLF4J logger instead of Lombok's @Slf4j
    private static final Logger log = LoggerFactory.getLogger(BusAnalyticsServiceImpl.class);

    private final BusAnalyticsRepository busAnalyticsRepository;
    private final LocationRepository locationRepository;

    /**
     * Explicit constructor instead of using Lombok's @RequiredArgsConstructor
     */
    public BusAnalyticsServiceImpl(
            BusAnalyticsRepository busAnalyticsRepository,
            LocationRepository locationRepository) {
        this.busAnalyticsRepository = busAnalyticsRepository;
        this.locationRepository = locationRepository;
    }

    @Override
    public HistoricalAnalyticsDTO getHistoricalData(
            Long fromLocationId, Long toLocationId, Long busId,
            LocalDateTime startDateTime, LocalDateTime endDateTime,
            String dataType, int page, int pageSize) {

        log.debug("Getting historical data for period {} to {}", startDateTime, endDateTime);

        Location fromLocation = fromLocationId != null
                ? locationRepository.findById(new LocationId(fromLocationId)).orElse(null)
                : null;
        Location toLocation = toLocationId != null
                ? locationRepository.findById(new LocationId(toLocationId)).orElse(null)
                : null;

        // Convert Long busId to BusId if provided
        BusId busIdObj = busId != null ? new BusId(busId) : null;

        var analytics = busAnalyticsRepository.findByFromAndToLocationAndBusIdAndDateTimeBetween(
                fromLocation, toLocation, busIdObj, startDateTime, endDateTime, (page - 1) * pageSize, pageSize);

        return HistoricalAnalyticsDTO.builder()
                .data(analytics)
                .totalCount(busAnalyticsRepository.countByFromAndToLocationAndBusIdAndDateTimeBetween(
                        fromLocation, toLocation, busIdObj, startDateTime, endDateTime))
                .page(page)
                .pageSize(pageSize)
                .build();
    }

    @Override
    public Map<String, Object> getRecommendedDepartureTimes(
            Long fromLocationId, Long toLocationId, LocalDateTime desiredArrivalTime) {

        log.debug("Getting recommended departure times for arrival at {}", desiredArrivalTime);

        Location fromLocation = locationRepository.findById(new LocationId(fromLocationId))
                .orElseThrow(() -> new IllegalArgumentException("Invalid from location ID"));
        Location toLocation = locationRepository.findById(new LocationId(toLocationId))
                .orElseThrow(() -> new IllegalArgumentException("Invalid to location ID"));

        var historicalData = busAnalyticsRepository.findByFromAndToLocationAndDateTimeBetween(
                fromLocation, toLocation, desiredArrivalTime.minusMonths(1), desiredArrivalTime);

        var recommendations = new HashMap<String, Object>();
        recommendations.put("recommendedDepartureTimes", calculateRecommendedTimes(historicalData, desiredArrivalTime));
        recommendations.put("confidence", calculateConfidenceScore(historicalData));

        return recommendations;
    }

    @Override
    public Map<String, Object> getPopularRoutes(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        log.debug("Getting popular routes for period {} to {}", startDateTime, endDateTime);

        // Use findByFromAndToLocationAndBusIdAndDateTimeBetween with null location
        // params and busId to get all routes
        var analytics = busAnalyticsRepository.findByFromAndToLocationAndBusIdAndDateTimeBetween(
                null, null, null, startDateTime, endDateTime, 0, Integer.MAX_VALUE);
        var popularRoutes = analyzePopularRoutes(analytics);

        var result = new HashMap<String, Object>();
        result.put("popularRoutes", popularRoutes);
        result.put("totalRecords", analytics.size());
        result.put("period", Map.of(
                "start", startDateTime,
                "end", endDateTime));

        return result;
    }

    @Override
    public byte[] exportAnalyticsData(
            Long fromLocationId, Long toLocationId, Long busId,
            LocalDateTime startDateTime, LocalDateTime endDateTime, String format) {

        log.debug("Exporting analytics data in {} format", format);

        Location fromLocation = fromLocationId != null
                ? locationRepository.findById(new LocationId(fromLocationId)).orElse(null)
                : null;
        Location toLocation = toLocationId != null
                ? locationRepository.findById(new LocationId(toLocationId)).orElse(null)
                : null;

        // Convert Long busId to BusId if provided
        BusId busIdObj = busId != null ? new BusId(busId) : null;

        var analytics = busAnalyticsRepository.findByFromAndToLocationAndBusIdAndDateTimeBetween(
                fromLocation,
                toLocation,
                busIdObj,
                startDateTime,
                endDateTime,
                0, // page number
                10 // page size
        );

        // For now, just return a simple string representation
        // In a real implementation, this would use proper export formatting
        return analytics.toString().getBytes();
    }

    private List<Map<String, Object>> calculateRecommendedTimes(
            List<com.perundhu.domain.model.BusAnalytics> historicalData, LocalDateTime targetTime) {
        var recommendations = new ArrayList<Map<String, Object>>();

        // Calculate average delays and derive recommended departure times
        // This is a simplified implementation - using record accessor methods
        var avgDelay = historicalData.stream()
                .filter(a -> a.averageDelay() != null)
                .mapToDouble(a -> a.averageDelay())
                .average()
                .orElse(0.0);

        var recommendedTime = targetTime.minusMinutes(Math.round(avgDelay));
        recommendations.add(Map.of(
                "time", recommendedTime,
                "confidence", "HIGH",
                "expectedDelay", avgDelay));

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
        // Use more efficient stream API with collectors to group and analyze routes
        return analytics.stream()
                .filter(a -> a.bus() != null) // Using record accessor method
                .collect(Collectors.groupingBy(
                        a -> a.bus().id().value(), // Using record accessor methods
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                group -> {
                                    var first = group.get(0);
                                    var routeStats = new HashMap<String, Object>();
                                    routeStats.put("busId", first.bus().id().value());
                                    routeStats.put("busName", first.bus().name()); // Using record accessor method
                                    routeStats.put(TOTAL_PASSENGERS_KEY, group.stream()
                                            .mapToLong(a -> a.totalPassengers() != null ? a.totalPassengers() : 0) // Using
                                                                                                                   // record
                                                                                                                   // accessor
                                                                                                                   // method
                                            .sum());
                                    routeStats.put("tripCount", group.size());

                                    // Additional analytics data can be added here in the future
                                    if (first.bus().fromLocation() != null) { // Using record accessor method
                                        routeStats.put("fromLocation", first.bus().fromLocation().name());
                                    }
                                    if (first.bus().toLocation() != null) { // Using record accessor method
                                        routeStats.put("toLocation", first.bus().toLocation().name());
                                    }

                                    return routeStats;
                                })))
                .values()
                .stream()
                .sorted((a, b) -> {
                    // Fix casting issue by using proper Map type
                    @SuppressWarnings("unchecked")
                    Map<String, Object> mapA = (Map<String, Object>) a;
                    @SuppressWarnings("unchecked")
                    Map<String, Object> mapB = (Map<String, Object>) b;

                    return Long.compare(
                            (Long) mapB.get(TOTAL_PASSENGERS_KEY),
                            (Long) mapA.get(TOTAL_PASSENGERS_KEY));
                })
                .collect(Collectors.toList());
    }
}
