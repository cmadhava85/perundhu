package com.perundhu.infrastructure.persistence.adapter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusAnalytics;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.BusAnalyticsRepository;
import com.perundhu.infrastructure.persistence.entity.BusAnalyticsJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusAnalyticsJpaRepository;

@Repository
public class BusAnalyticsRepositoryAdapter implements BusAnalyticsRepository {

    private final BusAnalyticsJpaRepository jpaRepository;

    public BusAnalyticsRepositoryAdapter(@Qualifier("jpaPackageBusAnalyticsJpaRepository") BusAnalyticsJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public BusAnalytics save(BusAnalytics busAnalytics) {
        BusAnalyticsJpaEntity entity = BusAnalyticsJpaEntity.fromDomainModel(busAnalytics);
        BusAnalyticsJpaEntity saved = jpaRepository.save(entity);
        return saved != null ? saved.toDomainModel() : null;
    }

    @Override
    public Optional<BusAnalytics> findById(BusAnalytics.BusAnalyticsId id) {
        return jpaRepository.findById(id.getValue())
                .map(BusAnalyticsJpaEntity::toDomainModel);
    }

    @Override
    public List<BusAnalytics> findByBus(Bus bus) {
        if (bus == null || bus.getId() == null || bus.getId().getValue() == null) return List.of();
        Object busIdObj = bus.getId().getValue();
        UUID busId = busIdObj instanceof UUID ? (UUID) busIdObj : null;
        if (busId == null) return List.of();
        return jpaRepository.findByBusId(busId)
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
        if (bus == null || bus.getId() == null || bus.getId().getValue() == null || date == null) return Optional.empty();
        Object busIdObj = bus.getId().getValue();
        UUID busId = busIdObj instanceof UUID ? (UUID) busIdObj : null;
        if (busId == null) return Optional.empty();
        return jpaRepository.findByBusIdAndDate(busId, date.atStartOfDay())
                .map(BusAnalyticsJpaEntity::toDomainModel);
    }

    @Override
    public void deleteOlderThan(LocalDateTime dateTime) {
        jpaRepository.deleteOlderThan(dateTime);
    }

    @Override
    public List<BusAnalytics> findByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
            Location fromLocation, Location toLocation, Long busId,
            LocalDateTime startDateTime, LocalDateTime endDateTime, int offset, int limit) {
        var fromEntity = fromLocation != null ? LocationJpaEntity.fromDomainModel(fromLocation) : null;
        var toEntity = toLocation != null ? LocationJpaEntity.fromDomainModel(toLocation) : null;

        return jpaRepository.findByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
                fromEntity, toEntity, busId, startDateTime, endDateTime, offset, limit)
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    public List<BusAnalytics> findByFromLocationAndToLocationAndDateTimeBetween(
            Location fromLocation, Location toLocation,
            LocalDateTime startDateTime, LocalDateTime endDateTime, int offset, int limit) {
        var fromEntity = fromLocation != null ? LocationJpaEntity.fromDomainModel(fromLocation) : null;
        var toEntity = toLocation != null ? LocationJpaEntity.fromDomainModel(toLocation) : null;

        return jpaRepository.findByFromLocationAndToLocationAndDateTimeBetween(
                fromEntity, toEntity, startDateTime, endDateTime, offset, limit)
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    public List<BusAnalytics> findByBusIdAndDateTimeBetween(
            Long busId, LocalDateTime startDateTime, LocalDateTime endDateTime, int offset, int limit) {
        return jpaRepository.findByBusIdAndDateTimeBetween(
                busId, startDateTime, endDateTime, offset, limit)
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    public List<BusAnalytics> findByDateTimeBetween(
            LocalDateTime startDateTime, LocalDateTime endDateTime, int offset, int limit) {
        return jpaRepository.findByDateTimeBetween(
                startDateTime, endDateTime, offset, limit)
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public List<BusAnalytics> findByFromLocationAndToLocationAndDateTimeBetween(
            Location fromLocation, Location toLocation, LocalDateTime startDateTime, LocalDateTime endDateTime) {
        var fromEntity = fromLocation != null ? LocationJpaEntity.fromDomainModel(fromLocation) : null;
        var toEntity = toLocation != null ? LocationJpaEntity.fromDomainModel(toLocation) : null;

        return jpaRepository.findByFromLocationAndToLocationAndDateTimeBetween(
                fromEntity, toEntity, startDateTime, endDateTime)
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    public List<BusAnalytics> findByBusIdAndDateTimeBetween(
            Long busId, LocalDateTime startDateTime, LocalDateTime endDateTime) {
        return jpaRepository.findByBusIdAndDateTimeBetween(
                busId, startDateTime, endDateTime)
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public List<BusAnalytics> findByDateTimeBetween(
            LocalDateTime startDateTime, LocalDateTime endDateTime) {
        return jpaRepository.findByDateTimeBetween(
                startDateTime, endDateTime)
                .stream()
                .map(BusAnalyticsJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public int countByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
            Location fromLocation, Location toLocation, Long busId,
            LocalDateTime startDateTime, LocalDateTime endDateTime) {
        var fromEntity = fromLocation != null ? LocationJpaEntity.fromDomainModel(fromLocation) : null;
        var toEntity = toLocation != null ? LocationJpaEntity.fromDomainModel(toLocation) : null;

        return jpaRepository.countByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
                fromEntity, toEntity, busId, startDateTime, endDateTime);
    }

    public int countByFromLocationAndToLocationAndDateTimeBetween(
            Location fromLocation, Location toLocation,
            LocalDateTime startDateTime, LocalDateTime endDateTime) {
        var fromEntity = fromLocation != null ? LocationJpaEntity.fromDomainModel(fromLocation) : null;
        var toEntity = toLocation != null ? LocationJpaEntity.fromDomainModel(toLocation) : null;

        return jpaRepository.countByFromLocationAndToLocationAndDateTimeBetween(
                fromEntity, toEntity, startDateTime, endDateTime);
    }

    public int countByBusIdAndDateTimeBetween(
            Long busId, LocalDateTime startDateTime, LocalDateTime endDateTime) {
        return jpaRepository.countByBusIdAndDateTimeBetween(
                busId, startDateTime, endDateTime);
    }

    public int countByDateTimeBetween(
            LocalDateTime startDateTime, LocalDateTime endDateTime) {
        return jpaRepository.countByDateTimeBetween(startDateTime, endDateTime);
    }
}

