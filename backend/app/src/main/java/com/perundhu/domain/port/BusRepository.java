package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;

public interface BusRepository {
    Optional<Bus> findById(Bus.BusId id);
    List<Bus> findByFromAndToLocation(Location from, Location to);
    List<Bus> findByFromLocation(Location from);
    Bus save(Bus bus);
    void delete(Bus.BusId id);
    
    /**
     * Check if a bus with the given number and route already exists
     * @param busNumber The bus number to check
     * @param fromLocationName The origin location name
     * @param toLocationName The destination location name
     * @return true if such a bus exists, false otherwise
     */
    boolean existsByBusNumberAndFromAndToLocations(String busNumber, String fromLocationName, String toLocationName);
    
    /**
     * Find all buses in the system
     * @return List of all buses
     */
    List<Bus> findAllBuses();
    
    /**
     * Find all buses
     * @return List of all buses
     */
    List<Bus> findAll();
    
    /**
     * Find buses between two locations using location IDs
     * @param fromLocationId The ID of the origin location
     * @param toLocationId The ID of the destination location
     * @return List of buses between the specified locations
     */
    List<Bus> findBusesBetweenLocations(Long fromLocationId, Long toLocationId);
    
    /**
     * Find a bus by its ID (using Long)
     * @param busId The bus ID
     * @return Optional containing the bus if found
     */
    Optional<Bus> findById(Long busId);
}