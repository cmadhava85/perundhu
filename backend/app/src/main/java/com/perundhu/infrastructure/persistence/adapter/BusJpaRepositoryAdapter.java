package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;

/**
 * Adapter implementation of the domain BusRepository interface.
 * This class follows the hexagonal architecture adapter pattern for connecting
 * the domain layer to the Spring Data JPA persistence infrastructure.
 */
@Repository
@Primary
public class BusJpaRepositoryAdapter implements BusRepository {

    private final BusJpaRepository jpaRepository;

    public BusJpaRepositoryAdapter(@Qualifier("jpaPackageBusJpaRepository") BusJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Bus> findById(BusId id) {
        return jpaRepository.findById(id.value())
                .map(BusJpaEntity::toDomainModel);
    }

    @Override
    public List<Bus> findBusesBetweenLocations(LocationId fromLocationId, LocationId toLocationId) {
        return jpaRepository.findBusesBetweenLocations(fromLocationId.value(), toLocationId.value())
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByBusNumberAndFromAndToLocations(String busNumber, String fromLocationName, String toLocationName) {
        return jpaRepository.existsByBusNumberAndFromAndToLocations(busNumber, fromLocationName, toLocationName);
    }

    @Override
    public List<Bus> findByFromAndToLocation(Location fromLocation, Location toLocation) {
        // Create location entities for the query
        LocationJpaEntity fromLocationEntity = LocationJpaEntity.fromDomainModel(fromLocation);
        LocationJpaEntity toLocationEntity = LocationJpaEntity.fromDomainModel(toLocation);

        // Call the JPA repository method and convert results to domain objects
        return jpaRepository.findByFromLocationAndToLocation(fromLocationEntity, toLocationEntity)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Bus> findByFromLocation(Location fromLocation) {
        if (fromLocation == null || fromLocation.id() == null) {
            return List.of();
        }
        return jpaRepository.findByFromLocationId(fromLocation.id().value())
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Bus> findAll() {
        return jpaRepository.findAll().stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public Bus save(Bus bus) {
        BusJpaEntity entity = BusJpaEntity.fromDomainModel(bus);
        BusJpaEntity savedEntity = jpaRepository.save(entity);
        return savedEntity.toDomainModel();
    }

    @Override
    public void delete(BusId id) {
        jpaRepository.deleteById(id.value());
    }

    @Override
    public List<Bus> findByBusNumber(String busNumber) {
        if (busNumber == null || busNumber.trim().isEmpty()) {
            return List.of();
        }
        return jpaRepository.findByBusNumber(busNumber)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Bus> findByCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            return List.of();
        }
        return jpaRepository.findByCategory(category)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public Optional<Bus> findByBusNumberAndRoute(String busNumber, LocationId fromLocationId, LocationId toLocationId) {
        if (busNumber == null || busNumber.trim().isEmpty() ||
            fromLocationId == null || toLocationId == null) {
            return Optional.empty();
        }

        List<BusJpaEntity> buses = jpaRepository.findByBusNumberAndRoute(
            busNumber, fromLocationId.value(), toLocationId.value());

        return buses.stream()
                .map(BusJpaEntity::toDomainModel)
                .findFirst();
    }

    @Override
    public List<Bus> findInService() {
        return jpaRepository.findInService()
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public long countByCategory(String category) {
        if (category == null || category.trim().isEmpty()) {
            return 0L;
        }
        return jpaRepository.countByCategory(category);
    }
}
