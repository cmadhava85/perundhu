package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;

/**
 * Repository interface for the Bus domain entity.
 * Updated to use proper Java 17 record-based ID types
 */
public interface BusRepository {
    Optional<Bus> findById(BusId id);

    List<Bus> findAll();

    Bus save(Bus bus);

    void delete(BusId id);

    List<Bus> findBusesBetweenLocations(LocationId fromLocationId, LocationId toLocationId);

    List<Bus> findByFromLocation(Location fromLocation);

    List<Bus> findByFromAndToLocation(Location fromLocation, Location toLocation);

    boolean existsByBusNumberAndFromAndToLocations(String busNumber, String fromLocationName, String toLocationName);

    /**
     * Enhanced methods using Java 17 features
     */
    List<Bus> findByBusNumber(String busNumber);

    List<Bus> findByCategory(String category);

    Optional<Bus> findByBusNumberAndRoute(String busNumber, LocationId fromLocationId, LocationId toLocationId);

    List<Bus> findInService();

    long countByCategory(String category);
}
