package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Location;

public interface LocationRepository {
    Optional<Location> findById(Location.LocationId id);

    List<Location> findAll();

    List<Location> findAllExcept(Location.LocationId id);

    /**
     * Find locations by exact name match
     * 
     * @param name The location name to search for
     * @return List of matching locations
     */
    List<Location> findByName(String name);

    /**
     * Find a location by exact name match
     * 
     * @param name The location name to search for
     * @return Optional containing the location if found
     */
    Optional<Location> findByExactName(String name);

    /**
     * Find a nearby location within the specified radius
     * 
     * @param latitude      The latitude coordinate
     * @param longitude     The longitude coordinate
     * @param radiusDegrees The search radius in degrees (approximately)
     * @return Optional containing the closest location if found
     */
    Optional<Location> findNearbyLocation(Double latitude, Double longitude, double radiusDegrees);

    /**
     * Find potential connection points between two locations
     * This returns locations that have buses from both the origin and destination
     * 
     * @param fromLocationId The origin location ID
     * @param toLocationId   The destination location ID
     * @return List of potential connection points
     */
    List<Location> findCommonConnections(Long fromLocationId, Long toLocationId);

    /**
     * Find locations by their ID values
     * 
     * @param id The ID of the location
     * @return Optional containing the location if found
     */
    Optional<Location> findById(Long id);

    /**
     * Find locations by name pattern (autocomplete search)
     * 
     * @param namePattern The partial name to search for (minimum 3 characters)
     * @return List of matching locations in Tamil Nadu, limited to 10 results
     */
    List<Location> findByNameContaining(String namePattern);

    Location save(Location location);

    void delete(Location.LocationId id);
}