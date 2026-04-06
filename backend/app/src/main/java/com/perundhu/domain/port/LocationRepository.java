package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;

public interface LocationRepository {
    Optional<Location> findById(LocationId id);

    List<Location> findAll();

    List<Location> findAllExcept(LocationId id);

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
     * Find locations by a list of IDs in a single batch query.
     *
     * @param ids The list of ID values to look up
     * @return List of matching locations (order not guaranteed)
     */
    List<Location> findAllByIds(List<Long> ids);

    Optional<Location> findById(Long id);

    /**
     * Find locations by name pattern (autocomplete search)
     * 
     * @param namePattern The partial name to search for (minimum 3 characters)
     * @return List of matching locations in Tamil Nadu, limited to 10 results
     */
    List<Location> findByNameContaining(String namePattern);

    Location save(Location location);

    void delete(LocationId id);

    /**
     * Get the total count of locations in the system.
     * 
     * @return The total number of locations
     */
    long count();

    /**
     * Get all location IDs for hierarchical search
     * If the location is a CITY with child terminals, returns the city ID + all child terminal IDs
     * Otherwise, returns just the location ID
     * 
     * This enables users to search "Chennai" and get buses from all Chennai terminals
     * (CMBT, KCBT, Madhavaram, etc.) without having to specify the exact terminal.
     * 
     * Example: For Chennai (ID 1) with terminals CMBT (62428), KCBT (99355), Tambaram (99295)
     * Returns: [1, 62428, 99355, 99295, ...]
     * 
     * @param locationId The location ID to search from
     * @return List of location IDs to include in the search (parent + children)
     */
    List<Long> findLocationIdsForHierarchicalSearch(Long locationId);

    /**
     * Find location by alias name (supports alternative names)
     * 
     * This enables users to search using any variation of a location name.
     * Example: "Broadway", "Broadway Bus Terminus", "Chennai - Broadway" all return the same location
     * 
     * @param aliasName The alias name to search for (case-insensitive)
     * @return Optional containing the location if found via alias
     */
    Optional<Location> findByAlias(String aliasName);

    /**
     * Find all locations matching an alias pattern (autocomplete with alias support)
     * 
     * This searches both location names and their aliases for autocomplete.
     * Example: Searching "broad" returns locations with aliases like "Broadway", "Broadway Bus Terminus"
     * 
     * @param aliasPattern The partial alias name to search for (minimum 3 characters)
     * @return List of unique locations matching the pattern in names or aliases
     */
    List<Location> findByAliasContaining(String aliasPattern);

    /**
     * Get all location IDs that match a location name or its aliases
     * 
     * This combines alias resolution with hierarchical search.
     * Example: Searching "Broadway" returns all location IDs for Broadway and its variations
     * 
     * @param locationName The location name or alias to search for
     * @return List of location IDs matching the name/alias (including hierarchical children)
     */
    List<Long> findLocationIdsByNameOrAlias(String locationName);

    /**
     * Set location hierarchy (parent-child relationship) and location type
     * 
     * This is used when creating new locations from contributions to automatically
     * assign terminals/bus stands to their parent cities.
     * 
     * @param locationId The location ID to update
     * @param parentCityId The parent city ID (null if this is a parent city)
     * @param locationType Location type (CITY, TERMINAL, STATION, TOWN, VILLAGE)
     */
    void setLocationHierarchy(Long locationId, Long parentCityId, String locationType);

    /**
     * Find nearby locations within the specified radius
     * 
     * @param latitude      The latitude coordinate
     * @param longitude     The longitude coordinate
     * @param radiusDegrees The search radius in degrees (approximately)
     * @return List of nearby locations within the radius
     */
    List<Location> findNearbyLocations(Double latitude, Double longitude, double radiusDegrees);
}