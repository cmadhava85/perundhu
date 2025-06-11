package com.perundhu.infrastructure.persistence.repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class BusRepositoryJpaImpl implements BusRepository {
    
    private final BusJpaRepository busJpaRepository;
    
    @Override
    public Optional<Bus> findById(Bus.BusId id) {
        return busJpaRepository.findById(id.getValue())
                .map(BusJpaEntity::toDomainModel);
    }
    
    @Override
    public Optional<Bus> findById(Long busId) {
        // Delegate to the existing findById method
        return findById(new Bus.BusId(busId));
    }
    
    @Override
    public List<Bus> findByFromAndToLocation(Location from, Location to) {
        return busJpaRepository.findByFromLocationIdAndToLocationId(
                from.getId().getValue(), 
                to.getId().getValue())
            .stream()
            .map(BusJpaEntity::toDomainModel)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Bus> findByFromLocation(Location from) {
        return busJpaRepository.findByFromLocationId(from.getId().getValue())
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }
    
    @Override
    public Bus save(Bus bus) {
        BusJpaEntity entity = BusJpaEntity.fromDomainModel(bus);
        BusJpaEntity savedEntity = busJpaRepository.save(entity);
        return savedEntity.toDomainModel();
    }
    
    @Override
    public void delete(Bus.BusId id) {
        busJpaRepository.deleteById(id.getValue());
    }
    
    @Override
    public boolean existsByBusNumberAndFromAndToLocations(String busNumber, String fromLocationName, String toLocationName) {
        return busJpaRepository.existsByBusNumberAndFromAndToLocations(busNumber, fromLocationName, toLocationName);
    }
    
    @Override
    public List<Bus> findAllBuses() {
        return busJpaRepository.findAll().stream()
                .map(BusJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<Bus> findAll() {
        // Delegate to the existing findAllBuses method
        return findAllBuses();
    }
    
    @Override
    public List<Bus> findBusesBetweenLocations(Long fromLocationId, Long toLocationId) {
        return busJpaRepository.findBusesBetweenLocations(fromLocationId, toLocationId)
            .stream()
            .map(BusJpaEntity::toDomainModel)
            .collect(Collectors.toList());
    }
}

