package com.perundhu.domain.port;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusAnalytics;
import com.perundhu.domain.model.Location;

public interface BusAnalyticsRepository {
    BusAnalytics save(BusAnalytics analytics);
    Optional<BusAnalytics> findById(BusAnalytics.BusAnalyticsId id);
    List<BusAnalytics> findByBus(Bus bus);
    List<BusAnalytics> findByDateRange(LocalDate start, LocalDate end);
    Optional<BusAnalytics> findByBusAndDate(Bus bus, LocalDate date);
    void deleteOlderThan(LocalDateTime dateTime);
    
    // Analytics API methods
    List<BusAnalytics> findByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
            Location fromLocation, Location toLocation, Long busId,
            LocalDateTime startDateTime, LocalDateTime endDateTime, int offset, int limit);
    
    List<BusAnalytics> findByFromLocationAndToLocationAndDateTimeBetween(
            Location fromLocation, Location toLocation,
            LocalDateTime startDateTime, LocalDateTime endDateTime);
    
    List<BusAnalytics> findByDateTimeBetween(
            LocalDateTime startDateTime, LocalDateTime endDateTime);
    
    int countByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
            Location fromLocation, Location toLocation, Long busId,
            LocalDateTime startDateTime, LocalDateTime endDateTime);
}