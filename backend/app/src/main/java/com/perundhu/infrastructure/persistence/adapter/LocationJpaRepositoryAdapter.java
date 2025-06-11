package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.LocationJpaRepository;

@Repository
public class LocationJpaRepositoryAdapter implements LocationRepository {
    
    private final LocationJpaRepository jpaRepository;
    
    public LocationJpaRepositoryAdapter(LocationJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }
    
    @Override
    public Optional<Location> findById(Location.LocationId id) {
        return jpaRepository.findById(id.getValue())
                .map(LocationJpaEntity::toDomainModel);
    }
    
    @Override
    public Optional<Location> findById(Long id) {
        return jpaRepository.findById(id)
                .map(LocationJpaEntity::toDomainModel);
    }
    
    @Override
    public List<Location> findAll() {
        return jpaRepository.findAll().stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }
    
    @Override
    public List<Location> findAllExcept(Location.LocationId id) {
        return jpaRepository.findByIdNot(id.getValue()).stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }
    
    @Override
    public List<Location> findByName(String name) {
        return jpaRepository.findByName(name).stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }
    
    @Override
    public Optional<Location> findByExactName(String name) {
        return jpaRepository.findByNameEquals(name)
                .map(LocationJpaEntity::toDomainModel);
    }
    
    @Override
    public Optional<Location> findNearbyLocation(Double latitude, Double longitude, double radiusDegrees) {
        // This would typically involve a spatial query
        // For now, returning empty as this may require a separate implementation
        return Optional.empty();
    }
    
    @Override
    public List<Location> findCommonConnections(Long fromLocationId, Long toLocationId) {
        return jpaRepository.findCommonConnections(fromLocationId, toLocationId).stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }
    
    @Override
    public Location save(Location location) {
        LocationJpaEntity entity = LocationJpaEntity.fromDomainModel(location);
        return jpaRepository.save(entity).toDomainModel();
    }
    
    @Override
    public void delete(Location.LocationId id) {
        jpaRepository.deleteById(id.getValue());
    }
}

