package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.StopJpaEntity;

@Repository
public interface StopJpaRepository extends JpaRepository<StopJpaEntity, Long> {
    
    List<StopJpaEntity> findByBusIdOrderByStopOrder(Long busId);
}