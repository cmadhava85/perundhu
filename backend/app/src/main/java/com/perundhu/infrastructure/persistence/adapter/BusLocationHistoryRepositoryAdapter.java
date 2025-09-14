package com.perundhu.infrastructure.persistence.adapter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusLocationHistory;
import com.perundhu.domain.port.BusLocationHistoryRepository;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.BusLocationHistoryJpaEntity;
import com.perundhu.infrastructure.persistence.repository.BusLocationHistoryJpaRepository;

// Remove @Component annotation - managed by HexagonalConfig
public class BusLocationHistoryRepositoryAdapter implements BusLocationHistoryRepository {

    private final BusLocationHistoryJpaRepository repository;

    // Explicit constructor instead of Lombok @RequiredArgsConstructor
    public BusLocationHistoryRepositoryAdapter(BusLocationHistoryJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public BusLocationHistory save(BusLocationHistory locationHistory) {
        BusLocationHistoryJpaEntity entity = BusLocationHistoryJpaEntity.fromDomainModel(locationHistory);
        BusLocationHistoryJpaEntity savedEntity = repository.save(entity);
        return savedEntity.toDomainModel();
    }

    @Override
    public Optional<BusLocationHistory> findById(BusLocationHistory.BusLocationHistoryId id) {
        return repository.findById(id.value())
                .map(BusLocationHistoryJpaEntity::toDomainModel);
    }

    @Override
    public List<BusLocationHistory> findByBus(Bus bus) {
        BusJpaEntity busEntity = new BusJpaEntity();
        busEntity.setId(bus.getId().value());

        // Using Java 17 toList() instead of Collectors.toList()
        return repository.findByBus(busEntity).stream()
                .map(BusLocationHistoryJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<BusLocationHistory> findByBusId(BusId busId) {
        BusJpaEntity busEntity = new BusJpaEntity();
        busEntity.setId(busId.value());

        return repository.findByBus(busEntity).stream()
                .map(BusLocationHistoryJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<BusLocationHistory> findByBusAndTimeRange(Bus bus, LocalDateTime start, LocalDateTime end) {
        BusJpaEntity busEntity = new BusJpaEntity();
        busEntity.setId(bus.getId().value());

        // This method relies on the repository implementation
        return repository.findByBusAndTimestampBetween(busEntity, start, end).stream()
                .map(BusLocationHistoryJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<BusLocationHistory> findByTimeRange(LocalDateTime start, LocalDateTime end) {
        // This method relies on the repository implementation
        return repository.findByTimestampBetween(start, end).stream()
                .map(BusLocationHistoryJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    @Transactional
    public void deleteOlderThan(LocalDateTime dateTime) {
        // This method relies on the repository implementation
        repository.deleteByTimestampBefore(dateTime);
    }

    @Override
    public List<BusLocationHistory> findRecentByBus(Bus bus, int minutes) {
        BusJpaEntity busEntity = new BusJpaEntity();
        busEntity.setId(bus.getId().value());

        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(minutes);
        return repository.findByBusAndTimestampAfter(busEntity, cutoffTime).stream()
                .map(BusLocationHistoryJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public Optional<BusLocationHistory> findLatestByBus(Bus bus) {
        BusJpaEntity busEntity = new BusJpaEntity();
        busEntity.setId(bus.getId().value());

        return repository.findTopByBusOrderByTimestampDesc(busEntity)
                .map(BusLocationHistoryJpaEntity::toDomainModel);
    }

    @Override
    public List<BusLocationHistory> findByLocation(Location location) {
        // This implementation depends on how locations are stored in the
        // BusLocationHistory
        // For simplicity, we'll do a crude match based on lat/long within a small range
        double tolerance = 0.0001; // Roughly 10 meters

        return repository.findAll().stream()
                .filter(entity -> {
                    double entityLat = entity.getLatitude();
                    double entityLong = entity.getLongitude();
                    return Math.abs(entityLat - location.latitude()) < tolerance &&
                            Math.abs(entityLong - location.longitude()) < tolerance;
                })
                .map(BusLocationHistoryJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<BusLocationHistory> findMovingBuses(LocalDateTime after) {
        // Implementation that finds buses with speed > 0
        return repository.findByTimestampAfterAndSpeedGreaterThan(after, 0.0).stream()
                .map(BusLocationHistoryJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<BusLocationHistory> findBySpeedGreaterThan(double speedThreshold) {
        return repository.findBySpeedGreaterThan(speedThreshold).stream()
                .map(BusLocationHistoryJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public long countByBusAndTimeRange(Bus bus, LocalDateTime start, LocalDateTime end) {
        BusJpaEntity busEntity = new BusJpaEntity();
        busEntity.setId(bus.getId().value());

        return repository.countByBusAndTimestampBetween(busEntity, start, end);
    }

    @Override
    public List<BusLocationHistory> findLatestLocationsByBuses(List<Bus> buses) {
        // Convert buses to JPA entities and extract IDs
        List<Long> busIds = buses.stream()
                .map(bus -> bus.getId().value())
                .toList();

        // Using Java 17 toList() instead of Collectors.toList()
        return repository.findLatestLocationsByBusIds(busIds).stream()
                .map(BusLocationHistoryJpaEntity::toDomainModel)
                .toList();
    }
}
