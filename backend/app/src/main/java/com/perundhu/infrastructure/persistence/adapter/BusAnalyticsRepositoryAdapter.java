package com.perundhu.infrastructure.persistence.adapter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusAnalytics;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.BusAnalyticsRepository;
import com.perundhu.infrastructure.persistence.entity.BusAnalyticsJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusAnalyticsJpaRepository;

// Remove @Repository annotation - managed by HexagonalConfig
public class BusAnalyticsRepositoryAdapter implements BusAnalyticsRepository {

    private final BusAnalyticsJpaRepository jpaRepository;

    public BusAnalyticsRepositoryAdapter(
            @Qualifier("jpaPackageBusAnalyticsJpaRepository") BusAnalyticsJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public BusAnalytics save(BusAnalytics busAnalytics) {
        BusAnalyticsJpaEntity entity = BusAnalyticsJpaEntity.fromDomainModel(busAnalytics);
        BusAnalyticsJpaEntity saved = jpaRepository.save(entity);
        return saved.toDomainModel(); // JPA save never returns null
    }

    @Override
    public Optional<BusAnalytics> findById(BusAnalytics.BusAnalyticsId id) {
        return jpaRepository.findById(id.value())
                .map(BusAnalyticsJpaEntity::toDomainModel);
    }

    @Override
    public List<BusAnalytics> findByBus(Bus bus) {
        if (bus == null || bus.id() == null)
            return List.of();
        return findByBusId(new BusId(bus.id().value()));
    }

    @Override
    public List<BusAnalytics> findByBusId(BusId busId) {
        if (busId == null)
            return List.of();
        // Convert BusId.value() (Long) to UUID for JPA repository
        UUID busUuid = convertLongToUUID(busId.value());
        return jpaRepository.findByBusId(busUuid)
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public List<BusAnalytics> findByDateRange(LocalDate start, LocalDate end) {
        return jpaRepository.findByDateBetween(
                start.atStartOfDay(),
                end.atTime(23, 59, 59))
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<BusAnalytics> findByBusAndDate(Bus bus, LocalDate date) {
        if (bus == null || bus.id() == null || date == null)
            return Optional.empty();
        // Convert BusId.value() (Long) to UUID for JPA repository
        UUID busUuid = convertLongToUUID(bus.id().value());
        return jpaRepository.findByBusIdAndDate(busUuid, date.atStartOfDay())
                .map(BusAnalyticsJpaEntity::toDomainModel);
    }

    @Override
    public void deleteOlderThan(LocalDateTime dateTime) {
        jpaRepository.deleteOlderThan(dateTime);
    }

    @Override
    public List<BusAnalytics> findByFromAndToLocationAndBusIdAndDateTimeBetween(
            Location fromLocation, Location toLocation, BusId busId,
            LocalDateTime startDateTime, LocalDateTime endDateTime, int offset, int limit) {

        if (fromLocation == null || toLocation == null || busId == null)
            return List.of();

        LocationJpaEntity fromEntity = LocationJpaEntity.fromDomainModel(fromLocation);
        LocationJpaEntity toEntity = LocationJpaEntity.fromDomainModel(toLocation);

        Pageable pageable = PageRequest.of(offset / limit, limit);

        return jpaRepository.findByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
                fromEntity, toEntity, busId.value(), startDateTime, endDateTime, pageable)
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public List<BusAnalytics> findByFromAndToLocationAndDateTimeBetween(
            Location fromLocation, Location toLocation,
            LocalDateTime startDateTime, LocalDateTime endDateTime) {

        if (fromLocation == null || toLocation == null)
            return List.of();

        LocationJpaEntity fromEntity = LocationJpaEntity.fromDomainModel(fromLocation);
        LocationJpaEntity toEntity = LocationJpaEntity.fromDomainModel(toLocation);

        return jpaRepository.findByFromLocationAndToLocationAndDateTimeBetween(
                fromEntity, toEntity, startDateTime, endDateTime)
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public int countByFromAndToLocationAndBusIdAndDateTimeBetween(
            Location fromLocation, Location toLocation, BusId busId,
            LocalDateTime startDateTime, LocalDateTime endDateTime) {

        if (fromLocation == null || toLocation == null || busId == null)
            return 0;

        LocationJpaEntity fromEntity = LocationJpaEntity.fromDomainModel(fromLocation);
        LocationJpaEntity toEntity = LocationJpaEntity.fromDomainModel(toLocation);

        return jpaRepository.countByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
                fromEntity, toEntity, busId.value(), startDateTime, endDateTime);
    }

    @Override
    public List<BusAnalytics> findTopPerformingBuses(LocalDate date, int limit) {
        // For now, find all analytics for the date and sort by performance metrics
        // This could be optimized with a specific query in the future
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        return jpaRepository.findByDateBetween(startOfDay, endOfDay)
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .sorted((a, b) -> {
                    // Sort by on-time performance and then by average speed
                    int performanceCompare = Double.compare(
                            b.onTimePerformance() != null ? b.onTimePerformance() : 0.0,
                            a.onTimePerformance() != null ? a.onTimePerformance() : 0.0);
                    if (performanceCompare != 0)
                        return performanceCompare;
                    return Double.compare(
                            b.averageSpeed() != null ? b.averageSpeed() : 0.0,
                            a.averageSpeed() != null ? a.averageSpeed() : 0.0);
                })
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<BusAnalytics> findBestPerformanceByRoute(Location fromLocation, Location toLocation,
            LocalDate date) {
        if (fromLocation == null || toLocation == null || date == null)
            return Optional.empty();

        LocationJpaEntity fromEntity = LocationJpaEntity.fromDomainModel(fromLocation);
        LocationJpaEntity toEntity = LocationJpaEntity.fromDomainModel(toLocation);

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        return jpaRepository.findByFromLocationAndToLocationAndDateTimeBetween(
                fromEntity, toEntity, startOfDay, endOfDay)
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .max(java.util.Comparator
                        .comparing((BusAnalytics a) -> a.onTimePerformance() != null ? a.onTimePerformance() : 0.0)
                        .thenComparing(a -> a.averageSpeed() != null ? a.averageSpeed() : 0.0));
    }

    @Override
    public List<BusAnalytics> findByOccupancyGreaterThan(double occupancyThreshold) {
        // Since there's no specific JPA method for this, we'll filter all analytics
        // This could be optimized with a specific query in the future
        return jpaRepository.findAll()
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .filter(analytics -> analytics.averageOccupancy() != null &&
                        analytics.averageOccupancy() > occupancyThreshold)
                .collect(Collectors.toList());
    }

    @Override
    public List<BusAnalytics> findByOnTimePerformanceLessThan(double performanceThreshold) {
        // Filter analytics by on-time performance threshold
        return jpaRepository.findAll()
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .filter(analytics -> analytics.onTimePerformance() != null &&
                        analytics.onTimePerformance() < performanceThreshold)
                .collect(Collectors.toList());
    }

    /**
     * Helper method to convert Long to UUID
     * This is a temporary solution until the type inconsistencies are resolved
     */
    private UUID convertLongToUUID(Long value) {
        if (value == null)
            return null;
        // Convert Long to UUID by using most and least significant bits
        return new UUID(0L, value);
    }
}
