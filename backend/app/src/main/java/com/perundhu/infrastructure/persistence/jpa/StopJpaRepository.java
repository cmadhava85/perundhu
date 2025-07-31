package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.StopJpaEntity;

@Repository("jpaPackageStopJpaRepository")
public interface StopJpaRepository extends JpaRepository<StopJpaEntity, Long> {
    
    List<StopJpaEntity> findByBusIdOrderByStopOrder(Long busId);
    
    /**
     * Find stops by bus ID
     * 
     * @param busId The bus ID
     * @return List of stops for the specified bus
     */
    List<StopJpaEntity> findByBusId(Long busId);
    
    /**
     * Find stops by location ID
     * 
     * @param locationId The location ID
     * @return List of stops at the specified location
     */
    @Query("SELECT s FROM StopJpaEntity s WHERE s.location.id = :locationId")
    List<StopJpaEntity> findByLocationId(@Param("locationId") Long locationId);
}

