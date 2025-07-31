package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Location;

/**
 * Repository interface for the Location domain entity.
 * Updated to use proper Java 17 record-based ID types
 */
public interface LocationRepository {
    Optional<Location> findById(Location.LocationId id);

    List<Location> findAll();

    List<Location> findAllExcept(Location.LocationId id);

    /**
     * Find locations by exact name match
     */
    List<Location> findByName(String name);

    /**
     * Find a location by exact name match
     */
    Optional<Location> findSingleByName(String name);

    /**
     * Find a location by exact name match (alias for findSingleByName)
     */
    default Optional<Location> findByExactName(String name) {
        return findSingleByName(name);
    }

    Location save(Location location);

    void delete(Location.LocationId id);

    /**
     * Enhanced methods using Java 17 features
     */
    List<Location> findByNameContaining(String namePattern);

    List<Location> findNear(double latitude, double longitude, double radiusKm);

    /**
     * Find locations within a coordinate range (for duplicate detection)
     */
    List<Location> findByCoordinatesWithinRange(double latitude, double longitude, double tolerance);

    boolean existsByName(String name);

    Optional<Location> findByCoordinates(double latitude, double longitude, double tolerance);

    long count();
}
