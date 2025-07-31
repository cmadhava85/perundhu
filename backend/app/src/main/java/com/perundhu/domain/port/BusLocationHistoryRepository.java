package com.perundhu.domain.port;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.BusLocationHistory;
import com.perundhu.domain.model.Location;

/**
 * Repository interface for BusLocationHistory domain entity.
 * Updated to use proper Java 17 record-based ID types
 */
public interface BusLocationHistoryRepository {
    BusLocationHistory save(BusLocationHistory locationHistory);

    Optional<BusLocationHistory> findById(BusLocationHistory.BusLocationHistoryId id);

    List<BusLocationHistory> findByBus(Bus bus);

    List<BusLocationHistory> findByBusId(BusId busId);

    List<BusLocationHistory> findByBusAndTimeRange(Bus bus, LocalDateTime start, LocalDateTime end);

    List<BusLocationHistory> findByTimeRange(LocalDateTime start, LocalDateTime end);

    void deleteOlderThan(LocalDateTime dateTime);

    // Enhanced methods using Java 17 features
    List<BusLocationHistory> findRecentByBus(Bus bus, int minutes);

    Optional<BusLocationHistory> findLatestByBus(Bus bus);

    List<BusLocationHistory> findByLocation(Location location);

    List<BusLocationHistory> findMovingBuses(LocalDateTime after);

    List<BusLocationHistory> findBySpeedGreaterThan(double speedThreshold);

    long countByBusAndTimeRange(Bus bus, LocalDateTime start, LocalDateTime end);

    /**
     * Find the latest location for each bus in the provided list
     * 
     * @param buses List of buses to find latest locations for
     * @return List of latest BusLocationHistory entries for the provided buses
     */
    List<BusLocationHistory> findLatestLocationsByBuses(List<Bus> buses);
}
