package com.perundhu.infrastructure.persistence.jpa;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.BusAnalyticsJpaEntity;

@Repository
public interface BusAnalyticsJpaRepository extends JpaRepository<BusAnalyticsJpaEntity, UUID> {
    
    Optional<BusAnalyticsJpaEntity> findByBusIdAndDate(UUID busId, LocalDateTime date);
    
    List<BusAnalyticsJpaEntity> findByBusId(UUID busId);
    
    List<BusAnalyticsJpaEntity> findByDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    List<BusAnalyticsJpaEntity> findByBusIdAndDateBetween(UUID busId, LocalDateTime startDate, LocalDateTime endDate);
}

