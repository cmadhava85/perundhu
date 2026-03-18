package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

        /**
         * Find all child locations of a parent location
         * Used for hierarchical searches (e.g., finding all Chennai terminals)
         */
        @Query("SELECT l FROM LocationJpaEntity l WHERE l.parent.id = :parentId")
        List<LocationJpaEntity> findByParentId(@Param("parentId") Long parentId);

        /**
         * Find location with its children eagerly loaded
         * Useful for hierarchical operations
         */
        @Query("SELECT l FROM LocationJpaEntity l LEFT JOIN FETCH l.children WHERE l.id = :id")
        Optional<LocationJpaEntity> findByIdWithChildren(@Param("id") Long id);

        /**
         * Get all location IDs that should be included when searching from a location
         * Handles both parent (city) and child (terminal) locations:
         * - If searching from a CITY: returns city + all its child terminals
         * - If searching from a TERMINAL: returns terminal + its parent city + sibling terminals
         * 
         * Examples:
         * - From Chennai (ID 1): returns [1, 62428, 99355, 99295, ...] (city + all terminals)
         * - From KCBT (ID 62571, parent=1): returns [1, 62571, 62428, 99355, ...] (parent city + all terminals)
         */
        @Query("SELECT DISTINCT l.id FROM LocationJpaEntity l WHERE l.id = :locationId " +
                        "UNION " +
                        "SELECT c.id FROM LocationJpaEntity c WHERE c.parent.id = :locationId " +
                        "UNION " +
                        "SELECT parent.id FROM LocationJpaEntity l JOIN l.parent parent WHERE l.id = :locationId AND parent IS NOT NULL " +
                        "UNION " +
                        "SELECT sibling.id FROM LocationJpaEntity l JOIN l.parent parent JOIN parent.children sibling WHERE l.id = :locationId AND parent IS NOT NULL")
        List<Long> findLocationIdsForHierarchicalSearch(@Param("locationId") Long locationId);

        // ============================================================
        // Bus-stand specific queries (locations with "City - Stand" pattern)
        // OPTIMIZATION: Paginated queries prevent unbounded result sets on db-f1-micro.
        // ============================================================

        /**
         * Find all bus-stand locations — those whose name contains " - " (e.g. "Madurai - Mattuthavani").
         * PAGINATED to prevent large result sets from spiking CPU on shared instance.
         */
        @Query("SELECT l FROM LocationJpaEntity l WHERE l.name LIKE '% - %' ORDER BY l.name")
        Page<LocationJpaEntity> findAllBusStands(Pageable pageable);

        /**
         * Non-paginated variant for internal use (use sparingly).
         */
        @Query("SELECT l FROM LocationJpaEntity l WHERE l.name LIKE '% - %' ORDER BY l.name")
        List<LocationJpaEntity> findAllBusStandsUnpaged();

        /**
         * Find bus-stand locations whose name starts with cityPrefix + " - ".
         * Case-insensitive so "madurai" matches "Madurai - Arapalayam".
         */
        @Query("SELECT l FROM LocationJpaEntity l WHERE LOWER(l.name) LIKE LOWER(CONCAT(:cityPrefix, ' - %')) ORDER BY l.name")
        List<LocationJpaEntity> findBusStandsByCityPrefix(@Param("cityPrefix") String cityPrefix);

        /**
         * Find bus-stand locations that contain both " - " and the given search term (case-insensitive).
         */
        @Query("SELECT l FROM LocationJpaEntity l WHERE l.name LIKE '% - %' AND LOWER(l.name) LIKE LOWER(CONCAT('%', :term, '%')) ORDER BY l.name")
        List<LocationJpaEntity> findBusStandsContaining(@Param("term") String term);

        /**
         * Count bus-stand locations for a given city prefix (for isCityWithMultipleStands / countByCityName).
         */
        @Query("SELECT COUNT(l) FROM LocationJpaEntity l WHERE LOWER(l.name) LIKE LOWER(CONCAT(:cityPrefix, ' - %'))")
        long countBusStandsByCityPrefix(@Param("cityPrefix") String cityPrefix);

        /**
         * Return city names that have more than one bus-stand location.
         * SUBSTRING_INDEX extracts the city part from "City - Stand" names.
         */
        @Query(value = "SELECT SUBSTRING_INDEX(name, ' - ', 1) AS city " +
                        "FROM locations WHERE name LIKE '% - %' " +
                        "GROUP BY SUBSTRING_INDEX(name, ' - ', 1) " +
                        "HAVING COUNT(*) > 1 ORDER BY city", nativeQuery = true)
        List<String> findCitiesWithMultipleBusStands();
}