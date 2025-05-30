package com.perundhu.domain.port;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusAnalytics;

public interface BusAnalyticsRepository {
    BusAnalytics save(BusAnalytics analytics);
    Optional<BusAnalytics> findById(BusAnalytics.BusAnalyticsId id);
    List<BusAnalytics> findByBus(Bus bus);
    List<BusAnalytics> findByDateRange(LocalDate start, LocalDate end);
    Optional<BusAnalytics> findByBusAndDate(Bus bus, LocalDate date);
    void deleteOlderThan(LocalDateTime dateTime);
}