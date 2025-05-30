package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
    public List<Bus> findByFromAndToLocation(Location from, Location to) {
        return jpaRepository.findByFromLocationIdAndToLocationId(
                from.getId().getValue(), 
                to.getId().getValue())
            .stream()
            .map(BusJpaEntity::toDomainModel)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Bus> findByFromLocation(Location from) {
        return jpaRepository.findByFromLocationId(from.getId().getValue())
            .stream()
            .map(BusJpaEntity::toDomainModel)
            .collect(Collectors.toList());
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
}