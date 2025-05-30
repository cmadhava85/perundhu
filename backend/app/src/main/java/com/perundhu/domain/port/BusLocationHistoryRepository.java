package com.perundhu.domain.port;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusLocationHistory;

public interface BusLocationHistoryRepository {
    BusLocationHistory save(BusLocationHistory locationHistory);
    Optional<BusLocationHistory> findById(BusLocationHistory.BusLocationHistoryId id);
    List<BusLocationHistory> findByBus(Bus bus);
    List<BusLocationHistory> findByBusAndTimeRange(Bus bus, LocalDateTime start, LocalDateTime end);
    List<BusLocationHistory> findByTimeRange(LocalDateTime start, LocalDateTime end);
    void deleteOlderThan(LocalDateTime dateTime);
}