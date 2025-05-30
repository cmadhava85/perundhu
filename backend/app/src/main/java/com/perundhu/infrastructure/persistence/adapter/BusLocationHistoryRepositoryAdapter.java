package com.perundhu.infrastructure.persistence.adapter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusLocationHistory;
import com.perundhu.domain.port.BusLocationHistoryRepository;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.BusLocationHistoryJpaEntity;
import com.perundhu.infrastructure.persistence.repository.BusLocationHistoryJpaRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class BusLocationHistoryRepositoryAdapter implements BusLocationHistoryRepository {

    private final BusLocationHistoryJpaRepository repository;

    @Override
    public BusLocationHistory save(BusLocationHistory locationHistory) {
        BusLocationHistoryJpaEntity entity = BusLocationHistoryJpaEntity.fromDomainModel(locationHistory);
        BusLocationHistoryJpaEntity savedEntity = repository.save(entity);
        return savedEntity.toDomainModel();
    }

    @Override
    public Optional<BusLocationHistory> findById(BusLocationHistory.BusLocationHistoryId id) {
        return repository.findById(id.getValue())
                .map(BusLocationHistoryJpaEntity::toDomainModel);
    }

    @Override
    public List<BusLocationHistory> findByBus(Bus bus) {
        BusJpaEntity busEntity = new BusJpaEntity();
        busEntity.setId(bus.getId().getValue());
        
        return repository.findByBus(busEntity).stream()
                .map(BusLocationHistoryJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public List<BusLocationHistory> findByBusAndTimeRange(Bus bus, LocalDateTime start, LocalDateTime end) {
        BusJpaEntity busEntity = new BusJpaEntity();
        busEntity.setId(bus.getId().getValue());
        
        return repository.findByBusAndTimestampBetweenOrderByTimestampAsc(busEntity, start, end).stream()
                .map(BusLocationHistoryJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public List<BusLocationHistory> findByTimeRange(LocalDateTime start, LocalDateTime end) {
        return repository.findByTimestampBetweenOrderByTimestampAsc(start, end).stream()
                .map(BusLocationHistoryJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteOlderThan(LocalDateTime dateTime) {
        repository.deleteByTimestampBefore(dateTime);
    }
}