package com.perundhu.domain.port;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.BusTravelMetrics;
import com.perundhu.domain.model.Location;

/**
 * Repository interface for BusTravelMetrics domain entity.
 * Updated to use proper Java 17 record-based ID types
 */
public interface BusTravelMetricsRepository {
    BusTravelMetrics save(BusTravelMetrics metrics);

    Optional<BusTravelMetrics> findById(BusTravelMetrics.BusTravelMetricsId id);

    List<BusTravelMetrics> findByBus(Bus bus);

    List<BusTravelMetrics> findByBusId(BusId busId);

    List<BusTravelMetrics> findByDateRange(LocalDateTime start, LocalDateTime end);

    List<BusTravelMetrics> findByBusAndDateRange(Bus bus, LocalDateTime start, LocalDateTime end);

    Double getAverageSpeedByBusAndDateRange(Bus bus, LocalDateTime start, LocalDateTime end);

    Double getAverageOccupancyByBusAndDateRange(Bus bus, LocalDateTime start, LocalDateTime end);

    Double getAverageDelayByBusAndDateRange(Bus bus, LocalDateTime start, LocalDateTime end);

    void deleteOlderThan(LocalDateTime dateTime);
    
    // Enhanced analytics methods
    List<BusTravelMetrics> findByFromLocationAndToLocation(Location fromLocation, Location toLocation);

    List<BusTravelMetrics> findByDateTimeBetween(LocalDateTime startDateTime, LocalDateTime endDateTime);

    List<BusTravelMetrics> findByFromLocationAndToLocationAndDateTimeBetween(
            Location fromLocation, Location toLocation, LocalDateTime startDateTime, LocalDateTime endDateTime);

    // New enhanced methods using Java 17 features
    List<BusTravelMetrics> findSignificantlyDelayed();

    List<BusTravelMetrics> findByEfficiencyScoreGreaterThan(double threshold);

    Optional<BusTravelMetrics> findBestPerformanceByRoute(Location fromLocation, Location toLocation);

    List<BusTravelMetrics> findByOccupancyRange(int minOccupancy, int maxOccupancy);
}

