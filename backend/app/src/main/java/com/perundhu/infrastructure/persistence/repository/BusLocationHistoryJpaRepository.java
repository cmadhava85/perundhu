package com.perundhu.infrastructure.persistence.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.BusLocationHistoryJpaEntity;

/**
 * Repository for managing bus location history
 * Provides methods to query, filter and analyze bus location data
 */
@Repository("repositoryPackageBusLocationHistoryJpaRepository")
public interface BusLocationHistoryJpaRepository extends JpaRepository<BusLocationHistoryJpaEntity, java.util.UUID> {

        /**
         * Find all locations for a specific bus
         * 
         * @param bus      The bus entity
         * @param pageable Pagination information
         * @return Paginated list of bus locations
         */
        Page<BusLocationHistoryJpaEntity> findByBus(BusJpaEntity bus, Pageable pageable);

        /**
         * Find all locations for a specific bus (non-paginated version)
         * 
         * @param bus The bus entity
         * @return List of bus locations
         */
        List<BusLocationHistoryJpaEntity> findByBus(BusJpaEntity bus);

        /**
         * Find bus locations within a specific time range
         * 
         * @param bus       The bus entity
         * @param startTime Start of the time range
         * @param endTime   End of the time range
         * @param pageable  Pagination information
         * @return Paginated list of bus locations within the time range
         */
        Page<BusLocationHistoryJpaEntity> findByBusAndTimestampBetween(
                        BusJpaEntity bus, LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

        /**
         * Find bus locations within a specific time range (non-paginated version)
         */
        List<BusLocationHistoryJpaEntity> findByBusAndTimestampBetween(
                        BusJpaEntity bus, LocalDateTime startTime, LocalDateTime endTime);

        /**
         * Find all bus locations within a specific time range
         */
        List<BusLocationHistoryJpaEntity> findByTimestampBetween(
                        LocalDateTime startTime, LocalDateTime endTime);

        /**
         * Find all bus locations within a specific time range with pagination
         */
        Page<BusLocationHistoryJpaEntity> findByTimestampBetween(
                        LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

        /**
         * Delete all location records before a specified date/time
         * 
         * @param dateTime Cut-off date for deletion
         * @return Number of records deleted
         */
        @Modifying
        @Query("DELETE FROM BusLocationHistoryJpaEntity e WHERE e.timestamp < :dateTime")
        int deleteByTimestampBefore(@Param("dateTime") LocalDateTime dateTime);

        /**
         * Find locations for a specific bus ordered by timestamp (newest first)
         */
        @Query("SELECT h FROM BusLocationHistoryJpaEntity h WHERE h.bus.id = :busId ORDER BY h.timestamp DESC")
        List<BusLocationHistoryJpaEntity> findByBusIdOrderByTimestampDesc(@Param("busId") Long busId);

        /**
         * Find locations for a specific bus ordered by timestamp with pagination
         */
        @Query("SELECT h FROM BusLocationHistoryJpaEntity h WHERE h.bus.id = :busId ORDER BY h.timestamp DESC")
        Page<BusLocationHistoryJpaEntity> findByBusIdOrderByTimestampDesc(@Param("busId") Long busId,
                        Pageable pageable);

        /**
         * Find locations for a bus after a specific timestamp
         */
        List<BusLocationHistoryJpaEntity> findByBusAndTimestampAfter(BusJpaEntity bus, LocalDateTime since);

        /**
         * Find the most recent location for a bus
         * 
         * @param bus The bus entity
         * @return The most recent location record, if available
         */
        Optional<BusLocationHistoryJpaEntity> findTopByBusOrderByTimestampDesc(BusJpaEntity bus);

        /**
         * Finds bus locations within a specified radius using the Haversine formula
         * 
         * @param latitude   Center latitude in degrees
         * @param longitude  Center longitude in degrees
         * @param radiusInKm Radius in kilometers
         * @param pageable   Pagination information
         * @return Paginated list of bus locations within the specified radius
         */
        @Query(value = "SELECT * FROM bus_location_history h WHERE " +
                        "6371 * 2 * ASIN(SQRT(" +
                        "POWER(SIN(RADIANS(:lat - h.latitude) / 2), 2) + " +
                        "COS(RADIANS(:lat)) * COS(RADIANS(h.latitude)) * " +
                        "POWER(SIN(RADIANS(:lng - h.longitude) / 2), 2)" +
                        ")) <= :radiusInKm " +
                        "ORDER BY h.timestamp DESC", nativeQuery = true)
        Page<BusLocationHistoryJpaEntity> findByLocationWithinRadius(
                        @Param("lat") double latitude,
                        @Param("lng") double longitude,
                        @Param("radiusInKm") double radiusInKm,
                        Pageable pageable);

        /**
         * Finds bus locations within a specified radius (non-paginated version)
         */
        @Query(value = "SELECT * FROM bus_location_history h WHERE " +
                        "6371 * 2 * ASIN(SQRT(" +
                        "POWER(SIN(RADIANS(:lat - h.latitude) / 2), 2) + " +
                        "COS(RADIANS(:lat)) * COS(RADIANS(h.latitude)) * " +
                        "POWER(SIN(RADIANS(:lng - h.longitude) / 2), 2)" +
                        ")) <= :radiusInKm " +
                        "ORDER BY h.timestamp DESC", nativeQuery = true)
        List<BusLocationHistoryJpaEntity> findByLocationWithinRadius(
                        @Param("lat") double latitude,
                        @Param("lng") double longitude,
                        @Param("radiusInKm") double radiusInKm);

        /**
         * Find bus locations after a timestamp with speed over threshold
         */
        @Query("SELECT h FROM BusLocationHistoryJpaEntity h WHERE h.timestamp > :after AND h.speed > :speedThreshold ORDER BY h.timestamp DESC")
        List<BusLocationHistoryJpaEntity> findByTimestampAfterAndSpeedGreaterThan(
                        @Param("after") LocalDateTime after,
                        @Param("speedThreshold") double speedThreshold);

        /**
         * Find bus locations with speed over a threshold
         */
        List<BusLocationHistoryJpaEntity> findBySpeedGreaterThan(double speedThreshold);

        /**
         * Count the number of location records for a bus within a time range
         */
        @Query("SELECT COUNT(h) FROM BusLocationHistoryJpaEntity h WHERE h.bus = :bus AND h.timestamp BETWEEN :start AND :end")
        long countByBusAndTimestampBetween(
                        @Param("bus") BusJpaEntity bus,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        /**
         * Find the latest location for each bus in a list of bus IDs
         * Uses a subquery for improved performance
         */
        @Query("SELECT h1 FROM BusLocationHistoryJpaEntity h1 WHERE h1.timestamp = " +
                        "(SELECT MAX(h2.timestamp) FROM BusLocationHistoryJpaEntity h2 WHERE h2.bus.id = h1.bus.id) " +
                        "AND h1.bus.id IN :busIds")
        List<BusLocationHistoryJpaEntity> findLatestLocationsByBusIds(@Param("busIds") List<Long> busIds);

        /**
         * Find locations with anomalous speed changes that might indicate issues
         * 
         * @param threshold The percentage change threshold to consider anomalous
         */
        @Query(value = "WITH speed_changes AS (" +
                        "SELECT h1.id, h1.bus_id, h1.timestamp, h1.speed, " +
                        "LAG(h1.speed) OVER (PARTITION BY h1.bus_id ORDER BY h1.timestamp) AS prev_speed " +
                        "FROM bus_location_history h1) " +
                        "SELECT * FROM bus_location_history h " +
                        "JOIN speed_changes sc ON h.id = sc.id " +
                        "WHERE ABS(sc.speed - sc.prev_speed) / NULLIF(sc.prev_speed, 0) * 100 > :threshold " +
                        "AND sc.prev_speed IS NOT NULL " +
                        "ORDER BY h.bus_id, h.timestamp", nativeQuery = true)
        List<BusLocationHistoryJpaEntity> findAnomalousSpeedChanges(@Param("threshold") double threshold);

        /**
         * Find bus locations within a specified radius (aliases
         * findByLocationWithinRadius)
         * 
         * @param latitude   Center latitude in degrees
         * @param longitude  Center longitude in degrees
         * @param radiusInKm Radius in kilometers
         * @return List of bus locations within the specified radius
         */
        @Query(value = "SELECT * FROM bus_location_history h WHERE " +
                        "6371 * 2 * ASIN(SQRT(" +
                        "POWER(SIN(RADIANS(:lat - h.latitude) / 2), 2) + " +
                        "COS(RADIANS(:lat)) * COS(RADIANS(h.latitude)) * " +
                        "POWER(SIN(RADIANS(:lng - h.longitude) / 2), 2)" +
                        ")) <= :radiusInKm " +
                        "ORDER BY h.timestamp DESC", nativeQuery = true)
        List<BusLocationHistoryJpaEntity> findByCoordinatesWithinRadius(
                        @Param("lat") double latitude,
                        @Param("lng") double longitude,
                        @Param("radiusInKm") double radiusInKm);

        /**
         * Find bus locations within a specified radius with pagination (aliases
         * findByLocationWithinRadius with pageable)
         * 
         * @param latitude   Center latitude in degrees
         * @param longitude  Center longitude in degrees
         * @param radiusInKm Radius in kilometers
         * @param pageable   Pagination information
         * @return Paginated list of bus locations within the specified radius
         */
        @Query(value = "SELECT * FROM bus_location_history h WHERE " +
                        "6371 * 2 * ASIN(SQRT(" +
                        "POWER(SIN(RADIANS(:lat - h.latitude) / 2), 2) + " +
                        "COS(RADIANS(:lat)) * COS(RADIANS(h.latitude)) * " +
                        "POWER(SIN(RADIANS(:lng - h.longitude) / 2), 2)" +
                        ")) <= :radiusInKm " +
                        "ORDER BY h.timestamp DESC", nativeQuery = true)
        Page<BusLocationHistoryJpaEntity> findByCoordinatesWithinRadiusPaged(
                        @Param("lat") double latitude,
                        @Param("lng") double longitude,
                        @Param("radiusInKm") double radiusInKm,
                        Pageable pageable);

        /**
         * Find locations for a bus after a specific timestamp ordered by timestamp desc
         * 
         * @param bus       The bus entity
         * @param timestamp The timestamp to search after
         * @return List of bus locations after the specified timestamp
         */
        List<BusLocationHistoryJpaEntity> findByBusAndTimestampAfterOrderByTimestampDesc(
                        BusJpaEntity bus, LocalDateTime timestamp);

        /**
         * Find limited number of locations for a bus ordered by timestamp desc
         * 
         * @param bus   The bus entity
         * @param limit Maximum number of records to return
         * @return List of bus locations
         */
        @Query("SELECT h FROM BusLocationHistoryJpaEntity h WHERE h.bus = :bus ORDER BY h.timestamp DESC")
        List<BusLocationHistoryJpaEntity> findByBusOrderByTimestampDesc(
                        @Param("bus") BusJpaEntity bus,
                        Pageable pageable);

        /**
         * Find limited number of locations for a bus ordered by timestamp desc
         * 
         * @param bus   The bus entity
         * @param limit Maximum number of records to return
         * @return List of bus locations
         */
        default List<BusLocationHistoryJpaEntity> findByBusOrderByTimestampDesc(
                        BusJpaEntity bus, int limit) {
                Pageable pageable = Pageable.ofSize(limit);
                return findByBusOrderByTimestampDesc(bus, pageable);
        }
}
