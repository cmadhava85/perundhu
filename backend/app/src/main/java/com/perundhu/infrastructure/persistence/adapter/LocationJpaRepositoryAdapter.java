package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
    public List<Location> findAll() {
        return jpaRepository.findAll().stream()
                .map(LocationJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<Location> findAllExcept(Location.LocationId id) {
        return jpaRepository.findByIdNot(id.getValue()).stream()
                .map(LocationJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<Location> findByName(String name) {
        return jpaRepository.findByName(name).stream()
                .map(LocationJpaEntity::toDomainModel)
                .collect(Collectors.toList());
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