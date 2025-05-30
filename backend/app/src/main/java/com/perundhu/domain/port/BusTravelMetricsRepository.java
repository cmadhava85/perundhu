package com.perundhu.domain.port;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusTravelMetrics;

public interface BusTravelMetricsRepository {
    BusTravelMetrics save(BusTravelMetrics metrics);
    Optional<BusTravelMetrics> findById(BusTravelMetrics.BusTravelMetricsId id);
    List<BusTravelMetrics> findByBus(Bus bus);
    List<BusTravelMetrics> findByDateRange(LocalDateTime start, LocalDateTime end);
    List<BusTravelMetrics> findByBusAndDateRange(Bus bus, LocalDateTime start, LocalDateTime end);
    Double getAverageSpeedByBusAndDateRange(Bus bus, LocalDateTime start, LocalDateTime end);
    Double getAverageOccupancyByBusAndDateRange(Bus bus, LocalDateTime start, LocalDateTime end);
    Double getAverageDelayByBusAndDateRange(Bus bus, LocalDateTime start, LocalDateTime end);
    void deleteOlderThan(LocalDateTime dateTime);
}