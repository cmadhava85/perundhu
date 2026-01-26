package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.LocationJpaRepository;
import com.perundhu.infrastructure.persistence.repository.LocationAliasJpaRepository;
import org.springframework.transaction.annotation.Transactional;

// Remove @Repository annotation - managed by HexagonalConfig
public class LocationJpaRepositoryAdapter implements LocationRepository {

    private final LocationJpaRepository jpaRepository;
    private final LocationAliasJpaRepository aliasRepository;

    public LocationJpaRepositoryAdapter(LocationJpaRepository jpaRepository,
                                       LocationAliasJpaRepository aliasRepository) {
        this.jpaRepository = jpaRepository;
        this.aliasRepository = aliasRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Location> findById(LocationId id) {
        return jpaRepository.findById(id.getValue())
                .map(LocationJpaEntity::toDomainModel);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Location> findById(Long id) {
        return jpaRepository.findById(id)
                .map(LocationJpaEntity::toDomainModel);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Location> findAll() {
        return jpaRepository.findAll().stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Location> findAllExcept(LocationId id) {
        return jpaRepository.findAll().stream()
                .filter(entity -> !entity.getId().equals(id.getValue()))
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Location> findByName(String name) {
        return jpaRepository.findByNameContainingIgnoreCase(name).stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Location> findByExactName(String name) {
        // Use case-insensitive matching to avoid duplicate locations with different
        // cases
        // (e.g., "SIVAKASI" vs "Sivakasi" should return the same location)
        return jpaRepository.findFirstByNameEqualsIgnoreCase(name)
                .map(LocationJpaEntity::toDomainModel);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Location> findNearbyLocation(Double latitude, Double longitude, double radiusDegrees) {
        // Calculate bounds for approximate search
        double latMin = latitude - radiusDegrees;
        double latMax = latitude + radiusDegrees;
        double lonMin = longitude - radiusDegrees;
        double lonMax = longitude + radiusDegrees;

        return jpaRepository.findByLatitudeBetweenAndLongitudeBetween(latMin, latMax, lonMin, lonMax)
                .stream()
                .map(LocationJpaEntity::toDomainModel)
                .findFirst();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Location> findCommonConnections(Long fromLocationId, Long toLocationId) {
        // This is a complex query - for now return empty list until proper
        // implementation
        // TODO: Implement proper query to find locations that connect fromLocationId
        // and toLocationId
        return List.of();
    }

    @Override
    public Location save(Location location) {
        // Create entity from domain model
        LocationJpaEntity entity = LocationJpaEntity.fromDomainModel(location);
        return jpaRepository.save(entity).toDomainModel();
    }

    /**
     * Save a location with explicit coordinate validation
     */
    public Location saveWithCoordinates(String name, Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException(
                    "Latitude and longitude cannot be null when explicitly saving with coordinates");
        }

        Location location = Location.withCoordinates(null, name, latitude, longitude);
        return save(location);
    }

    /**
     * Find locations that have valid coordinates
     */
    @Transactional(readOnly = true)
    public List<Location> findLocationsWithValidCoordinates() {
        return jpaRepository.findAll().stream()
                .map(LocationJpaEntity::toDomainModel)
                .filter(Location::hasValidCoordinates)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Location> findByNameContaining(String namePattern) {
        if (namePattern == null || namePattern.trim().length() < 3) {
            return List.of();
        }

        // Use bus-stand-first query for better user experience
        // Bus stands (e.g., "Madurai - Mattuthavani") appear before generic city names
        return jpaRepository.findByNameContainingIgnoreCaseBusStandFirst(namePattern.trim())
                .stream()
                .limit(10) // Limit to 10 suggestions
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public void delete(LocationId id) {
        jpaRepository.deleteById(id.getValue());
    }

    @Override
    @Transactional(readOnly = true)
    public long count() {
        return jpaRepository.count();
    }

    /**
     * Get all location IDs for hierarchical search
     * If the location is a CITY with child terminals, returns the city ID + all child IDs
     * Otherwise, returns just the location ID
     * 
     * Example: For Chennai (ID 1) with terminals CMBT (62428), KCBT (99355), etc.
     * Returns: [1, 62428, 99355, 99295, ...]
     */
    @Override
    @Transactional(readOnly = true)
    public List<Long> findLocationIdsForHierarchicalSearch(Long locationId) {
        return jpaRepository.findLocationIdsForHierarchicalSearch(locationId);
    }

    /**
     * Find all child locations of a parent
     */
    @Transactional(readOnly = true)
    public List<Location> findChildLocations(Long parentId) {
        return jpaRepository.findByParentId(parentId).stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    /**
     * Find location by alias name (supports alternative names)
     * Enables searching using any variation of a location name
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<Location> findByAlias(String aliasName) {
        if (aliasName == null || aliasName.trim().isEmpty()) {
            return Optional.empty();
        }

        return aliasRepository.findLocationIdByAliasName(aliasName.trim())
                .flatMap(this::findById);
    }

    /**
     * Find all locations matching an alias pattern (autocomplete with alias support)
     * Searches both location names and their aliases
     */
    @Override
    @Transactional(readOnly = true)
    public List<Location> findByAliasContaining(String aliasPattern) {
        if (aliasPattern == null || aliasPattern.trim().length() < 3) {
            return List.of();
        }

        // Get location IDs from aliases
        List<Long> aliasLocationIds = aliasRepository.findLocationIdsByAliasContaining(aliasPattern.trim());
        
        // Get locations matching name directly
        List<Location> nameMatches = findByNameContaining(aliasPattern);
        
        // Combine and deduplicate
        List<Location> aliasMatches = aliasLocationIds.stream()
                .map(this::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();

        return Stream.concat(nameMatches.stream(), aliasMatches.stream())
                .distinct()
                .limit(10)
                .toList();
    }

    /**
     * Get all location IDs that match a location name or its aliases
     * Combines alias resolution with hierarchical search
     */
    @Override
    @Transactional(readOnly = true)
    public List<Long> findLocationIdsByNameOrAlias(String locationName) {
        if (locationName == null || locationName.trim().isEmpty()) {
            return List.of();
        }

        String trimmed = locationName.trim();
        
        // Try exact name match first
        Optional<Location> exactMatch = findByExactName(trimmed);
        if (exactMatch.isPresent()) {
            Long locationId = exactMatch.get().id().getValue();
            return findLocationIdsForHierarchicalSearch(locationId);
        }

        // Try alias match
        Optional<Location> aliasMatch = findByAlias(trimmed);
        if (aliasMatch.isPresent()) {
            Long locationId = aliasMatch.get().id().getValue();
            return findLocationIdsForHierarchicalSearch(locationId);
        }

        // Try partial name match
        List<Location> partialMatches = findByName(trimmed);
        if (!partialMatches.isEmpty()) {
            Long locationId = partialMatches.get(0).id().getValue();
            return findLocationIdsForHierarchicalSearch(locationId);
        }

        return List.of();
    }
}
