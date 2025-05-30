package com.perundhu.infrastructure.persistence.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.BusLocationHistoryJpaEntity;

@Repository
public interface BusLocationHistoryJpaRepository extends JpaRepository<BusLocationHistoryJpaEntity, java.util.UUID> {
    
    List<BusLocationHistoryJpaEntity> findByBus(BusJpaEntity bus);
    
    List<BusLocationHistoryJpaEntity> findByBusAndTimestampBetweenOrderByTimestampAsc(
        BusJpaEntity bus, LocalDateTime startTime, LocalDateTime endTime);
    
    List<BusLocationHistoryJpaEntity> findByTimestampBetweenOrderByTimestampAsc(
        LocalDateTime startTime, LocalDateTime endTime);
    
    @Modifying
    @Query("DELETE FROM BusLocationHistoryJpaEntity e WHERE e.timestamp < :dateTime")
    void deleteByTimestampBefore(LocalDateTime dateTime);
}