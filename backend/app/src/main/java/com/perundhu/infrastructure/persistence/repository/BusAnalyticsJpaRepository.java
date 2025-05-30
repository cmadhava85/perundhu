package com.perundhu.infrastructure.persistence.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.BusAnalyticsJpaEntity;

@Repository("repositoryBusAnalyticsJpaRepository")
public interface BusAnalyticsJpaRepository extends JpaRepository<BusAnalyticsJpaEntity, UUID> {
    List<BusAnalyticsJpaEntity> findByBusId(UUID busId);

    List<BusAnalyticsJpaEntity> findByDateBetween(LocalDate start, LocalDate end);
    
    Optional<BusAnalyticsJpaEntity> findByBusIdAndDate(UUID busId, LocalDate date);

    @Modifying
    @Query("DELETE FROM BusAnalyticsJpaEntity ba WHERE ba.date < :dateTime")
    void deleteOlderThan(LocalDateTime dateTime);
}

