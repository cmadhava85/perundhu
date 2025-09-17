package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.LocationJpaRepository;

// Remove @Repository annotation - managed by HexagonalConfig
public class LocationJpaRepositoryAdapter implements LocationRepository {

    private final LocationJpaRepository jpaRepository;

    public LocationJpaRepositoryAdapter(LocationJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Location> findById(LocationId id) {
        return jpaRepository.findById(id.getValue())
                .map(LocationJpaEntity::toDomainModel);
    }

    @Override
    public Optional<Location> findById(Long id) {
        return jpaRepository.findById(id)
                .map(LocationJpaEntity::toDomainModel);
    }

    @Override
    public List<Location> findAll() {
        return jpaRepository.findAll().stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Location> findAllExcept(LocationId id) {
        return jpaRepository.findAll().stream()
                .filter(entity -> !entity.getId().equals(id.getValue()))
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Location> findByName(String name) {
        return jpaRepository.findByNameContainingIgnoreCase(name).stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public Optional<Location> findByExactName(String name) {
        return jpaRepository.findByNameEquals(name)
                .map(LocationJpaEntity::toDomainModel);
    }

    @Override
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
    public List<Location> findLocationsWithValidCoordinates() {
        return jpaRepository.findAll().stream()
                .map(LocationJpaEntity::toDomainModel)
                .filter(Location::hasValidCoordinates)
                .toList();
    }

    @Override
    public List<Location> findByNameContaining(String namePattern) {
        if (namePattern == null || namePattern.trim().length() < 3) {
            return List.of();
        }

        return jpaRepository.findByNameContainingIgnoreCase(namePattern.trim())
                .stream()
                .limit(10) // Limit to 10 suggestions
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public void delete(LocationId id) {
        jpaRepository.deleteById(id.getValue());
    }
}
