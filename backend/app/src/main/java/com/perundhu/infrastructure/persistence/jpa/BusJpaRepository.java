package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;

@Repository("jpaPackageBusJpaRepository")
public interface BusJpaRepository extends JpaRepository<BusJpaEntity, Long> {
    
    // ID-based methods (currently being used by BusJpaRepositoryAdapter)
    List<BusJpaEntity> findByFromLocationIdAndToLocationId(Long fromLocationId, Long toLocationId);
    
    List<BusJpaEntity> findByFromLocationId(Long fromLocationId);
    
    List<BusJpaEntity> findByFromLocationIdOrToLocationId(Long fromLocationId, Long toLocationId);
    
    // Entity-based methods (used by tests)
    // Using explicit JPQL queries to avoid property reference issues
    @Query("SELECT b FROM BusJpaEntity b WHERE b.fromLocation = :fromLocation AND b.toLocation = :toLocation")
    List<BusJpaEntity> findByFromLocationAndToLocation(
        @Param("fromLocation") LocationJpaEntity fromLocation, 
        @Param("toLocation") LocationJpaEntity toLocation);
    
    @Query("SELECT b FROM BusJpaEntity b WHERE b.fromLocation = :fromLocation")
    List<BusJpaEntity> findByFromLocation(@Param("fromLocation") LocationJpaEntity fromLocation);
    
    // Query method for checking bus existence
    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM BusJpaEntity b " +
           "WHERE b.busNumber = :busNumber " +
           "AND b.fromLocation.name = :fromLocationName " +
           "AND b.toLocation.name = :toLocationName")
    boolean existsByBusNumberAndFromAndToLocations(@Param("busNumber") String busNumber, 
                                                 @Param("fromLocationName") String fromLocationName, 
                                                 @Param("toLocationName") String toLocationName);
    
    /**
     * Find buses between two locations using location IDs
     * 
     * @param fromLocationId The ID of the origin location
     * @param toLocationId The ID of the destination location
     * @return List of buses between the specified locations
     */
    @Query("SELECT b FROM BusJpaEntity b WHERE b.fromLocation.id = :fromLocationId AND b.toLocation.id = :toLocationId")
    List<BusJpaEntity> findBusesBetweenLocations(@Param("fromLocationId") Long fromLocationId, @Param("toLocationId") Long toLocationId);
    
    /**
     * Find buses that have stops at both specified locations in order
     * This query finds buses where both locations are in the stops collection
     * This needs to use the stops table to check the order
     *
     * @param fromLocationId The ID of the first location
     * @param toLocationId The ID of the second location
     * @return List of buses that have stops at both locations in the specified order
     */
    @Query("SELECT DISTINCT b FROM BusJpaEntity b " +
           "JOIN StopJpaEntity s1 ON s1.bus.id = b.id " +
           "JOIN StopJpaEntity s2 ON s2.bus.id = b.id " +
           "WHERE s1.location.id = :fromLocationId AND s2.location.id = :toLocationId " +
           "AND s1.stopOrder < s2.stopOrder")
    List<BusJpaEntity> findBusesByStops(@Param("fromLocationId") Long fromLocationId, @Param("toLocationId") Long toLocationId);

    // Additional methods for missing repository functionality
    List<BusJpaEntity> findByBusNumber(String busNumber);

    List<BusJpaEntity> findByCategory(String category);

    @Query("SELECT b FROM BusJpaEntity b WHERE b.busNumber = :busNumber " +
           "AND b.fromLocation.id = :fromLocationId AND b.toLocation.id = :toLocationId")
    List<BusJpaEntity> findByBusNumberAndRoute(@Param("busNumber") String busNumber,
                                              @Param("fromLocationId") Long fromLocationId,
                                              @Param("toLocationId") Long toLocationId);

    @Query("SELECT b FROM BusJpaEntity b WHERE b.category IS NOT NULL AND b.capacity > 0")
    List<BusJpaEntity> findInService();

    long countByCategory(String category);
}
