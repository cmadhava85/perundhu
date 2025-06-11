package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;

@Repository
public interface LocationJpaRepository extends JpaRepository<LocationJpaEntity, Long> {
    
    List<LocationJpaEntity> findByName(String name);
    
    List<LocationJpaEntity> findByIdNot(Long id);
    
    Optional<LocationJpaEntity> findByNameEquals(String name);
    
    /**
     * Find locations by name containing the given string (case insensitive)
     *
     * @param query The search query
     * @return List of locations with names containing the query string
     */
    List<LocationJpaEntity> findByNameContainingIgnoreCase(String query);
    
    /**
     * Find potential connection points between two locations
     * This returns locations that have buses from both the origin and destination
     * 
     * @param fromLocationId The origin location ID
     * @param toLocationId The destination location ID
     * @return List of potential connection points
     */
    @Query("SELECT DISTINCT l FROM LocationJpaEntity l " +
           "JOIN BusJpaEntity b1 ON b1.fromLocation.id = :fromLocationId AND b1.toLocation.id = l.id " +
           "JOIN BusJpaEntity b2 ON b2.fromLocation.id = l.id AND b2.toLocation.id = :toLocationId")
    List<LocationJpaEntity> findCommonConnections(@Param("fromLocationId") Long fromLocationId, 
                                                @Param("toLocationId") Long toLocationId);
}