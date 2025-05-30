package com.perundhu.infrastructure.persistence.adapter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusAnalytics;
import com.perundhu.domain.port.BusAnalyticsRepository;
import com.perundhu.infrastructure.persistence.entity.BusAnalyticsJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusAnalyticsJpaRepository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class BusAnalyticsRepositoryAdapter implements BusAnalyticsRepository {

    private final BusAnalyticsJpaRepository jpaRepository;

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
        // If you want to implement this, add the method to your repository interface
        // jpaRepository.deleteOlderThan(dateTime);
        throw new UnsupportedOperationException("deleteOlderThan is not implemented in BusAnalyticsJpaRepository");
    }
}