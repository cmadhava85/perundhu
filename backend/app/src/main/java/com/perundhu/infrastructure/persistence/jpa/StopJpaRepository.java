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

    /**
     * Batch load stops for multiple buses in a single query.
     * Prevents N+1 query issue when building route graphs.
     * Eagerly fetches location, bus, and bus locations to prevent
     * LazyInitializationException.
     * 
     * @param busIds List of bus IDs to load stops for
     * @return List of stops ordered by bus ID and stop order
     */
    @Query("SELECT s FROM StopJpaEntity s " +
            "LEFT JOIN FETCH s.location " +
            "LEFT JOIN FETCH s.bus b " +
            "LEFT JOIN FETCH b.fromLocation " +
            "LEFT JOIN FETCH b.toLocation " +
            "WHERE s.bus.id IN :busIds " +
            "ORDER BY s.bus.id, s.stopOrder")
    List<StopJpaEntity> findByBusIdsOrderByStopOrder(@Param("busIds") List<Long> busIds);

    /**
     * Efficiently count stops for multiple buses in a single query.
     * Returns a list of Object arrays where:
     * - Index 0 is the bus ID (Long)
     * - Index 1 is the stop count (Long)
     * 
     * This prevents N+1 query problem when paginating buses.
     * 
     * @param busIds List of bus IDs to count stops for
     * @return List of [busId, stopCount] arrays
     */
    @Query("SELECT s.bus.id, COUNT(s) FROM StopJpaEntity s WHERE s.bus.id IN :busIds GROUP BY s.bus.id")
    List<Object[]> countStopsByBusIds(@Param("busIds") List<Long> busIds);
}
