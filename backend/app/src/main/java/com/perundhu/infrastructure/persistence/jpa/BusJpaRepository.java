package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;

@Repository
public interface BusJpaRepository extends JpaRepository<BusJpaEntity, Long> {
    
    List<BusJpaEntity> findByFromLocationIdAndToLocationId(Long fromLocationId, Long toLocationId);
    
    List<BusJpaEntity> findByFromLocationId(Long fromLocationId);
}