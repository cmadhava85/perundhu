package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.infrastructure.persistence.entity.StopJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.StopJpaRepository;

// Remove @Repository annotation - managed by HexagonalConfig
public class StopJpaRepositoryAdapter implements StopRepository {

    private final StopJpaRepository jpaRepository;

    public StopJpaRepositoryAdapter(StopJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Stop> findById(com.perundhu.domain.model.StopId id) {
        return jpaRepository.findById(id.value())
                .map(StopJpaEntity::toDomainModel);
    }

    @Override
    public List<Stop> findByBusOrderByStopOrder(Bus bus) {
        return jpaRepository.findByBusIdOrderByStopOrder(bus.id().value()).stream()
                .map(StopJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public Stop save(Stop stop) {
        StopJpaEntity entity = StopJpaEntity.fromDomainModel(stop);
        return jpaRepository.save(entity).toDomainModel();
    }

    @Override
    public void delete(com.perundhu.domain.model.StopId id) {
        jpaRepository.deleteById(id.value());
    }

    @Override
    public List<Stop> findByLocationId(Long locationId) {
        return jpaRepository.findByLocationId(locationId).stream()
                .map(StopJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Stop> findByBusId(Long busId) {
        return jpaRepository.findByBusId(busId).stream()
                .map(StopJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Stop> findByBusId(com.perundhu.domain.model.BusId busId) {
        return jpaRepository.findByBusId(busId.value()).stream()
                .map(StopJpaEntity::toDomainModel)
                .toList();
    }
}
