package com.perundhu.domain.port;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusAnalytics;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;

/**
 * Repository interface for BusAnalytics domain entity.
 * Updated to use proper Java 17 record-based ID types
 */
public interface BusAnalyticsRepository {
        BusAnalytics save(BusAnalytics analytics);

        Optional<BusAnalytics> findById(BusAnalytics.BusAnalyticsId id);

        List<BusAnalytics> findByBus(Bus bus);

        List<BusAnalytics> findByBusId(BusId busId);

        List<BusAnalytics> findByDateRange(LocalDate start, LocalDate end);

        Optional<BusAnalytics> findByBusAndDate(Bus bus, LocalDate date);

        void deleteOlderThan(LocalDateTime dateTime);

        // Enhanced analytics methods using Java 17 features
        List<BusAnalytics> findByFromAndToLocationAndBusIdAndDateTimeBetween(
                        Location fromLocation, Location toLocation, BusId busId,
                        LocalDateTime startDateTime, LocalDateTime endDateTime, int offset, int limit);

        List<BusAnalytics> findByFromAndToLocationAndDateTimeBetween(
                        Location fromLocation, Location toLocation,
                        LocalDateTime startDateTime, LocalDateTime endDateTime);

        int countByFromAndToLocationAndBusIdAndDateTimeBetween(
                        Location fromLocation, Location toLocation, BusId busId,
                        LocalDateTime startDateTime, LocalDateTime endDateTime);

        // New enhanced methods
        List<BusAnalytics> findTopPerformingBuses(LocalDate date, int limit);

        Optional<BusAnalytics> findBestPerformanceByRoute(Location fromLocation, Location toLocation, LocalDate date);

        List<BusAnalytics> findByOccupancyGreaterThan(double occupancyThreshold);

        List<BusAnalytics> findByOnTimePerformanceLessThan(double performanceThreshold);
}
