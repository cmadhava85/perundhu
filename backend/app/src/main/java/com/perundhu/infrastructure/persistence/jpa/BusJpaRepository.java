package com.perundhu.infrastructure.persistence.jpa;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;

@Repository
public interface BusJpaRepository extends JpaRepository<BusJpaEntity, Long> {

        // ID-based methods (currently being used by BusJpaRepositoryAdapter)
        // Only return active buses for search results
        @Query("""
                SELECT b FROM BusJpaEntity b
                WHERE b.fromLocation.id = :fromLocationId
                  AND b.toLocation.id = :toLocationId
                  AND (b.active = true OR b.active IS NULL)
                """)
        List<BusJpaEntity> findByFromLocationIdAndToLocationId(
                        @Param("fromLocationId") Long fromLocationId,
                        @Param("toLocationId") Long toLocationId);

        @Query("""
                SELECT b FROM BusJpaEntity b
                WHERE b.fromLocation.id = :fromLocationId
                  AND (b.active = true OR b.active IS NULL)
                """)
        List<BusJpaEntity> findByFromLocationId(@Param("fromLocationId") Long fromLocationId);

        @Query("""
                SELECT b FROM BusJpaEntity b
                WHERE (b.fromLocation.id = :fromLocationId OR b.toLocation.id = :toLocationId)
                  AND (b.active = true OR b.active IS NULL)
                """)
        List<BusJpaEntity> findByFromLocationIdOrToLocationId(
                        @Param("fromLocationId") Long fromLocationId,
                        @Param("toLocationId") Long toLocationId);

        // Entity-based methods (used by tests)
        // Using explicit JPQL queries to avoid property reference issues
        @Query("""
                SELECT b FROM BusJpaEntity b
                WHERE b.fromLocation = :fromLocation
                  AND b.toLocation = :toLocation
                """)
        List<BusJpaEntity> findByFromLocationAndToLocation(
                        @Param("fromLocation") LocationJpaEntity fromLocation,
                        @Param("toLocation") LocationJpaEntity toLocation);

        @Query("""
                SELECT b FROM BusJpaEntity b
                WHERE b.fromLocation = :fromLocation
                """)
        List<BusJpaEntity> findByFromLocation(@Param("fromLocation") LocationJpaEntity fromLocation);

        // Query method for checking bus existence
        @Query("""
                SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
                FROM BusJpaEntity b
                WHERE b.busNumber = :busNumber
                  AND b.fromLocation.name = :fromLocationName
                  AND b.toLocation.name = :toLocationName
                """)
        boolean existsByBusNumberAndFromAndToLocations(
                        @Param("busNumber") String busNumber,
                        @Param("fromLocationName") String fromLocationName,
                        @Param("toLocationName") String toLocationName);

        // New query method for checking bus existence with timing
        @Query("""
                SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
                FROM BusJpaEntity b
                WHERE b.busNumber = :busNumber
                  AND b.fromLocation.name = :fromLocationName
                  AND b.toLocation.name = :toLocationName
                  AND b.departureTime = :departureTime
                  AND b.arrivalTime = :arrivalTime
                """)
        boolean existsByBusNumberAndFromAndToLocationsAndTiming(
                        @Param("busNumber") String busNumber,
                        @Param("fromLocationName") String fromLocationName,
                        @Param("toLocationName") String toLocationName,
                        @Param("departureTime") LocalTime departureTime,
                        @Param("arrivalTime") LocalTime arrivalTime);

        /**
         * Find buses between two locations using location IDs
         * Uses JOIN FETCH to load locations in single query (prevents N+1)
         * Only returns active buses
         * 
         * @param fromLocationId The ID of the origin location
         * @param toLocationId   The ID of the destination location
         * @return List of active buses between the specified locations
         */
        @Query("""
                SELECT b FROM BusJpaEntity b
                JOIN FETCH b.fromLocation
                JOIN FETCH b.toLocation
                WHERE b.fromLocation.id = :fromLocationId
                  AND b.toLocation.id = :toLocationId
                  AND (b.active = true OR b.active IS NULL)
                """)
        List<BusJpaEntity> findBusesBetweenLocations(
                        @Param("fromLocationId") Long fromLocationId,
                        @Param("toLocationId") Long toLocationId);

        /**
         * Find buses that pass through both locations as stops (including intermediate
         * stops)
         * This finds buses where the fromLocation and toLocation appear as stops in the
         * correct order
         * Uses JOIN FETCH to load locations in single query (prevents N+1)
         * Only returns active buses
         * 
         * @param fromLocationId The ID of the origin location
         * @param toLocationId   The ID of the destination location
         * @return List of active buses that have stops at both locations in the correct order
         */
        @Query("""
                SELECT DISTINCT b FROM BusJpaEntity b
                JOIN FETCH b.fromLocation
                JOIN FETCH b.toLocation
                JOIN StopJpaEntity s1 ON s1.bus.id = b.id
                JOIN StopJpaEntity s2 ON s2.bus.id = b.id
                WHERE s1.location.id = :fromLocationId
                  AND s2.location.id = :toLocationId
                  AND s1.stopOrder < s2.stopOrder
                  AND (b.active = true OR b.active IS NULL)
                """)
        List<BusJpaEntity> findBusesPassingThroughLocations(
                        @Param("fromLocationId") Long fromLocationId,
                        @Param("toLocationId") Long toLocationId);

        /**
         * Find buses that continue beyond the destination city
         * This finds buses where fromLocation and toLocation are both stops,
         * but toLocation is NOT the final destination (bus continues further)
         * Only returns active buses
         * 
         * @param fromLocationId The ID of the origin location
         * @param toLocationId   The ID of the intermediate destination location
         * @return List of active buses that pass through toLocationId and continue further
         */
        @Query("""
                SELECT DISTINCT b FROM BusJpaEntity b
                JOIN StopJpaEntity s1 ON s1.bus.id = b.id
                JOIN StopJpaEntity s2 ON s2.bus.id = b.id
                WHERE s1.location.id = :fromLocationId
                  AND s2.location.id = :toLocationId
                  AND s1.stopOrder < s2.stopOrder
                  AND b.toLocation.id != :toLocationId
                  AND (b.active = true OR b.active IS NULL)
                  AND EXISTS (
                      SELECT s3 FROM StopJpaEntity s3
                      WHERE s3.bus.id = b.id AND s3.stopOrder > s2.stopOrder
                  )
                """)
        List<BusJpaEntity> findBusesContinuingBeyondDestination(
                        @Param("fromLocationId") Long fromLocationId,
                        @Param("toLocationId") Long toLocationId);

        // Additional methods required by the repository implementations
        List<BusJpaEntity> findByBusNumber(String busNumber);

        List<BusJpaEntity> findByCategory(String category);

        @Query("""
                SELECT b FROM BusJpaEntity b
                WHERE b.busNumber = :busNumber
                  AND b.fromLocation.id = :fromLocationId
                  AND b.toLocation.id = :toLocationId
                """)
        List<BusJpaEntity> findByBusNumberAndFromLocationIdAndToLocationId(
                        @Param("busNumber") String busNumber,
                        @Param("fromLocationId") Long fromLocationId,
                        @Param("toLocationId") Long toLocationId);

        List<BusJpaEntity> findByActiveTrue();

        long countByCategory(String category);

        /**
         * Find buses that pass through any combination of from/to locations.
         * Used for handling duplicate location names (villages with same name near
         * different cities).
         * Only returns active buses
         * 
         * @param fromLocationIds List of possible origin location IDs
         * @param toLocationIds   List of possible destination location IDs
         * @return List of active buses passing through any from location to any to location
         */
        @Query("""
                SELECT DISTINCT b FROM BusJpaEntity b
                JOIN StopJpaEntity s1 ON s1.bus.id = b.id
                JOIN StopJpaEntity s2 ON s2.bus.id = b.id
                WHERE s1.location.id IN :fromLocationIds
                  AND s2.location.id IN :toLocationIds
                  AND s1.stopOrder < s2.stopOrder
                  AND (b.active = true OR b.active IS NULL)
                """)
        List<BusJpaEntity> findBusesPassingThroughAnyLocations(
                        @Param("fromLocationIds") List<Long> fromLocationIds,
                        @Param("toLocationIds") List<Long> toLocationIds);
}