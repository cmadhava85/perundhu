package com.perundhu.application.service;

import java.util.List;
import java.util.Optional;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.dto.BusScheduleDTO;
import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.domain.model.Location;

/**
 * Service interface for bus schedule operations
 */
public interface BusScheduleService {
    /**
     * Get all buses in the system
     */
    List<BusDTO> getAllBuses();
    
    /**
     * Get a specific bus by its ID
     */
    Optional<BusDTO> getBusById(Long busId);
    
    /**
     * Get all locations with optional translations
     */
    List<LocationDTO> getAllLocations(String languageCode);
    
    /**
     * Find direct buses between two locations using location IDs
     */
    List<BusDTO> findBusesBetweenLocations(Long fromLocationId, Long toLocationId);
    
    /**
     * Find connecting routes between two locations using location IDs
     * This helps users who need to change buses to reach their destination
     */
    List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId);
    
    /**
     * Find connecting routes between two locations using location IDs with specified max depth
     * This helps users who need to change buses to reach their destination
     * 
     * @param fromLocationId The ID of the origin location
     * @param toLocationId The ID of the destination location  
     * @param maxDepth Maximum number of connections to consider
     * @return List of connecting routes
     */
    List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId, Integer maxDepth);
    
    /**
     * Find connecting routes between two locations using Location objects
     * This overload accepts Location objects and language code
     */
    List<ConnectingRouteDTO> findConnectingRoutes(Location fromLocation, Location toLocation, String languageCode);
    
    /**
     * Get all stops for a specific bus route with optional translations
     */
    List<StopDTO> getStopsForBus(Long busId, String languageCode);
    
    /**
     * Find bus stops with the given language code
     */
    List<StopDTO> findBusStops(Long busId, String languageCode);
    
    /**
     * Find bus schedules between two locations
     */
    List<BusScheduleDTO> findBusSchedules(Location fromLocation, Location toLocation, String languageCode);
    
    /**
     * Find all buses that have stops at both specified locations in the correct order
     * This includes buses where these locations are intermediate stops on a longer route
     * 
     * @param fromLocationId The ID of the origin location
     * @param toLocationId The ID of the destination location
     * @return List of buses that have stops at these locations in order
     */
    List<BusDTO> findBusesPassingThroughLocations(Long fromLocationId, Long toLocationId);
}