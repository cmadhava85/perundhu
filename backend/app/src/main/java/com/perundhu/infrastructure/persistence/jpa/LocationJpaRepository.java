package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;

/**
 * JPA Repository interface for Location entities
 */
@Repository("repositoryPackageLocationJpaRepository")
public interface LocationJpaRepository extends JpaRepository<LocationJpaEntity, Long> {

        /**
         * Find locations by name (case-insensitive)
         */
        List<LocationJpaEntity> findByName(String name);

        /**
         * Find location by exact name match (case-insensitive)
         * Returns first match if duplicates exist
         */
        Optional<LocationJpaEntity> findFirstByNameEqualsIgnoreCase(String name);

        /**
         * Find location by exact name match (case-sensitive)
         * Returns first match if duplicates exist
         */
        Optional<LocationJpaEntity> findFirstByNameEquals(String name);

        /**
         * Find locations by name containing pattern (case-insensitive)
         */
        List<LocationJpaEntity> findByNameContainingIgnoreCase(String namePattern);

        /**
         * Find locations by name containing pattern, with bus stands/stops prioritized
         * first.
         * Bus stands are identified by having " - " in their name (e.g., "Madurai -
         * Mattuthavani").
         * Bus stops are identified by "Bus Stop" suffix (e.g., "Srivilliputhur - Bus
         * Stop").
         * Priority order: Bus Stands/Stops first (sorted by name), then other
         * locations.
         */
        @Query("SELECT l FROM LocationJpaEntity l WHERE LOWER(l.name) LIKE LOWER(CONCAT('%', :namePattern, '%')) " +
                        "ORDER BY CASE WHEN l.name LIKE '% - %' THEN 0 ELSE 1 END, l.name ASC")
        List<LocationJpaEntity> findByNameContainingIgnoreCaseBusStandFirst(@Param("namePattern") String namePattern);

        /**
         * Find locations excluding a specific ID
         */
        List<LocationJpaEntity> findByIdNot(Long id);

        /**
         * Find locations within coordinate boundaries
         */
        List<LocationJpaEntity> findByLatitudeBetweenAndLongitudeBetween(
                        Double latMin, Double latMax, Double lonMin, Double lonMax);

        /**
         * Check if location exists by name
         */
        boolean existsByName(String name);

        /**
         * Find locations near coordinates using native query for better performance
         */
        @Query(value = "SELECT * FROM locations l WHERE " +
                        "(6371 * acos(cos(radians(:latitude)) * cos(radians(l.latitude)) * " +
                        "cos(radians(l.longitude) - radians(:longitude)) + " +
                        "sin(radians(:latitude)) * sin(radians(l.latitude)))) <= :radiusKm", nativeQuery = true)
        List<LocationJpaEntity> findLocationsWithinRadius(
                        @Param("latitude") Double latitude,
                        @Param("longitude") Double longitude,
                        @Param("radiusKm") Double radiusKm);

        /**
         * Find locations by approximate coordinates with tolerance
         */
        @Query("SELECT l FROM LocationJpaEntity l WHERE " +
                        "ABS(l.latitude - :latitude) <= :tolerance AND " +
                        "ABS(l.longitude - :longitude) <= :tolerance")
        List<LocationJpaEntity> findByApproximateCoordinates(
                        @Param("latitude") Double latitude,
                        @Param("longitude") Double longitude,
                        @Param("tolerance") Double tolerance);
}