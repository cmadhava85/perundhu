package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.repository.LocationJpaRepository;

@Repository
public class LocationJpaRepositoryAdapter implements LocationRepository {

    private final LocationJpaRepository jpaRepository;

    public LocationJpaRepositoryAdapter(
            @Qualifier("repositoryPackageLocationJpaRepository") LocationJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Location> findById(Location.LocationId id) {
        return jpaRepository.findById(id.value())
                .map(LocationJpaEntity::toDomainModel);
    }

    @Override
    public List<Location> findAll() {
        return jpaRepository.findAll().stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Location> findAllExcept(Location.LocationId id) {
        return jpaRepository.findByIdNot(id.value()).stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Location> findByName(String name) {
        return jpaRepository.findByName(name).stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public Optional<Location> findSingleByName(String name) {
        return jpaRepository.findByNameEquals(name)
                .map(LocationJpaEntity::toDomainModel);
    }

    @Override
    public Location save(Location location) {
        LocationJpaEntity entity = LocationJpaEntity.fromDomainModel(location);
        return jpaRepository.save(entity).toDomainModel();
    }

    @Override
    public void delete(Location.LocationId id) {
        jpaRepository.deleteById(id.value());
    }

    @Override
    public List<Location> findByNameContaining(String namePattern) {
        if (namePattern == null || namePattern.trim().isEmpty()) {
            return List.of();
        }
        return jpaRepository.findByNameContainingIgnoreCase(namePattern.trim()).stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Location> findNear(double latitude, double longitude, double radiusKm) {
        // Convert radius from kilometers to degrees (approximate conversion)
        // 1 degree ≈ 111 km at the equator
        double radiusDegrees = radiusKm / 111.0;

        return jpaRepository.findByLatitudeBetweenAndLongitudeBetween(
                latitude - radiusDegrees,
                latitude + radiusDegrees,
                longitude - radiusDegrees,
                longitude + radiusDegrees).stream()
                .map(LocationJpaEntity::toDomainModel)
                .filter(location -> calculateDistance(latitude, longitude,
                        location.latitude(), location.longitude()) <= radiusKm)
                .toList();
    }

    @Override
    public List<Location> findByCoordinatesWithinRange(double latitude, double longitude, double tolerance) {
        return jpaRepository.findByLatitudeBetweenAndLongitudeBetween(
                latitude - tolerance,
                latitude + tolerance,
                longitude - tolerance,
                longitude + tolerance).stream()
                .map(LocationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public boolean existsByName(String name) {
        return jpaRepository.existsByName(name);
    }

    @Override
    public Optional<Location> findByCoordinates(double latitude, double longitude, double tolerance) {
        List<Location> nearbyLocations = findByCoordinatesWithinRange(latitude, longitude, tolerance);

        // Return the closest location within tolerance
        return nearbyLocations.stream()
                .filter(location -> Math.abs(location.latitude() - latitude) <= tolerance &&
                        Math.abs(location.longitude() - longitude) <= tolerance)
                .findFirst();
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * 
     * @param lat1 Latitude of first point
     * @param lon1 Longitude of first point
     * @param lat2 Latitude of second point
     * @param lon2 Longitude of second point
     * @return Distance in kilometers
     */
    // Changed from private to package-private (default) for testing
    double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS_KM = 6371;

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }
}
