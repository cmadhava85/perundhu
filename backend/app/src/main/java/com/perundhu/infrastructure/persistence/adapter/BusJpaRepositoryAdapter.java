package com.perundhu.infrastructure.persistence.adapter;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;

// Remove @Repository annotation - managed by HexagonalConfig
public class BusJpaRepositoryAdapter implements BusRepository {

    private final BusJpaRepository jpaRepository;

    public BusJpaRepositoryAdapter(BusJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Bus> findById(com.perundhu.domain.model.BusId id) {
        return jpaRepository.findById(id.value())
                .map(BusJpaEntity::toDomainModel);
    }

    @Override
    public Optional<Bus> findById(Long busId) {
        return jpaRepository.findById(busId)
                .map(BusJpaEntity::toDomainModel);
    }

    @Override
    public List<Bus> findByFromAndToLocation(Location fromLocation, Location toLocation) {
        // Create location entities for the test method
        LocationJpaEntity fromLocationEntity = LocationJpaEntity.fromDomainModel(fromLocation);
        LocationJpaEntity toLocationEntity = LocationJpaEntity.fromDomainModel(toLocation);

        // Call the method expected by the test
        return jpaRepository.findByFromLocationAndToLocation(fromLocationEntity, toLocationEntity)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Bus> findByFromLocation(Location fromLocation) {
        return jpaRepository.findByFromLocationId(fromLocation.id().getValue())
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public boolean existsByBusNumberAndFromAndToLocations(String busNumber, String fromLocationName,
            String toLocationName) {
        return jpaRepository.existsByBusNumberAndFromAndToLocations(busNumber, fromLocationName, toLocationName);
    }

    @Override
    public boolean existsByBusNumberAndFromAndToLocationsAndTiming(String busNumber, String fromLocationName,
            String toLocationName, LocalTime departureTime, LocalTime arrivalTime) {
        return jpaRepository.existsByBusNumberAndFromAndToLocationsAndTiming(
                busNumber, fromLocationName, toLocationName, departureTime, arrivalTime);
    }

    @Override
    public List<Bus> findAllBuses() {
        return findAll(); // Delegate to the existing findAll method
    }

    @Override
    public Bus save(Bus bus) {
        BusJpaEntity entity = BusJpaEntity.fromDomainModel(bus);
        return jpaRepository.save(entity).toDomainModel();
    }

    @Override
    public void delete(com.perundhu.domain.model.BusId id) {
        jpaRepository.deleteById(id.value());
    }

    @Override
    public List<Bus> findAll() {
        // Use findAllWithLocations to eagerly fetch locations and prevent
        // LazyInitializationException when called from @Async methods
        return jpaRepository.findAllWithLocations().stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    public List<Bus> findByFromLocationIdOrToLocationId(Long locationId) {
        return jpaRepository.findByFromLocationIdOrToLocationId(locationId, locationId)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Bus> findBusesBetweenLocations(Long fromLocationId, Long toLocationId) {
        return jpaRepository.findByFromLocationIdAndToLocationId(fromLocationId, toLocationId)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    /**
     * Find buses that pass through both locations as stops (including intermediate
     * stops)
     * This includes buses where these locations are intermediate stops on a longer
     * route
     */
    @Override
    public List<Bus> findBusesPassingThroughLocations(Long fromLocationId, Long toLocationId) {
        return jpaRepository.findBusesPassingThroughLocations(fromLocationId, toLocationId)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Bus> findBusesContinuingBeyondDestination(Long fromLocationId, Long toLocationId) {
        return jpaRepository.findBusesContinuingBeyondDestination(fromLocationId, toLocationId)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Bus> findByBusNumber(String busNumber) {
        return jpaRepository.findByBusNumber(busNumber)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Bus> findByCategory(String category) {
        return jpaRepository.findByCategory(category)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    public List<Bus> findByBusNumberAndRoute(String busNumber, LocationId fromLocationId,
            LocationId toLocationId) {
        return jpaRepository.findByBusNumberAndFromLocationIdAndToLocationId(
                busNumber, fromLocationId.getValue(), toLocationId.getValue())
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Bus> findInService() {
        return jpaRepository.findByActiveTrue()
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public long countByCategory(String category) {
        return jpaRepository.countByCategory(category);
    }

    @Override
    public List<Bus> findBusesPassingThroughAnyLocations(List<Long> fromLocationIds, List<Long> toLocationIds) {
        if (fromLocationIds == null || fromLocationIds.isEmpty() ||
                toLocationIds == null || toLocationIds.isEmpty()) {
            return List.of();
        }
        return jpaRepository.findBusesPassingThroughAnyLocations(fromLocationIds, toLocationIds)
                .stream()
                .map(BusJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }
}