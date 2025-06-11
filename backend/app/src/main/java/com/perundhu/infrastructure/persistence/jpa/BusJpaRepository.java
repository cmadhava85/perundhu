package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;

@Repository
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
}