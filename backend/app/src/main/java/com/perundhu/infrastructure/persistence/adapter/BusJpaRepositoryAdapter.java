package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;

@Repository
public class BusJpaRepositoryAdapter implements BusRepository {
    
    private final BusJpaRepository jpaRepository;
    
    public BusJpaRepositoryAdapter(BusJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }
    
    @Override
    public Optional<Bus> findById(Bus.BusId id) {
        return jpaRepository.findById(id.getValue())
                .map(BusJpaEntity::toDomainModel);
    }
    
    @Override
    public Optional<Bus> findById(Long busId) {
        return jpaRepository.findById(busId)
                .map(BusJpaEntity::toDomainModel);
    }
    
    @Override
    public List<Bus> findByFromAndToLocation(Location fromLocation, Location toLocation) {
        // Create location entities for the test method
        LocationJpaEntity fromLocationEntity = LocationJpaEntity.fromDomainModel(fromLocation);
        LocationJpaEntity toLocationEntity = LocationJpaEntity.fromDomainModel(toLocation);
        
        // Call the method expected by the test
        return jpaRepository.findByFromLocationAndToLocation(fromLocationEntity, toLocationEntity)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }
    
    @Override
    public List<Bus> findByFromLocation(Location fromLocation) {
        return jpaRepository.findByFromLocationId(fromLocation.getId().getValue())
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }
    
    @Override
    public boolean existsByBusNumberAndFromAndToLocations(String busNumber, String fromLocationName, String toLocationName) {
        return jpaRepository.existsByBusNumberAndFromAndToLocations(busNumber, fromLocationName, toLocationName);
    }
    
    @Override
    public List<Bus> findAllBuses() {
        return findAll();  // Delegate to the existing findAll method
    }
    
    @Override
    public Bus save(Bus bus) {
        BusJpaEntity entity = BusJpaEntity.fromDomainModel(bus);
        return jpaRepository.save(entity).toDomainModel();
    }
    
    @Override
    public void delete(Bus.BusId id) {
        jpaRepository.deleteById(id.getValue());
    }
    
    @Override
    public List<Bus> findAll() {
        return jpaRepository.findAll().stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }
    
    public List<Bus> findByFromLocationIdOrToLocationId(Long locationId) {
        return jpaRepository.findByFromLocationIdOrToLocationId(locationId, locationId)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Bus> findBusesBetweenLocations(Long fromLocationId, Long toLocationId) {
        return jpaRepository.findByFromLocationIdAndToLocationId(fromLocationId, toLocationId)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }
}
