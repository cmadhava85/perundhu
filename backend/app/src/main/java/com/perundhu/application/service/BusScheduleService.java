package com.perundhu.application.service;

import java.util.List;

import com.perundhu.application.dto.BusScheduleDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.domain.model.Location;

public interface BusScheduleService {
    /**
     * Find bus schedules between two locations with language support
     */
    List<BusScheduleDTO> findBusSchedules(Location from, Location to, String languageCode);
    
    /**
     * Find stops for a specific bus with language support
     */
    List<StopDTO> findBusStops(Long busId, String languageCode);
    
    /**
     * Find connecting routes between two locations with language support
     */
    List<BusScheduleDTO> findConnectingRoutes(Location from, Location to, String languageCode);
    
    /**
     * Get all locations with default language
     */
    List<LocationDTO> getAllLocations();
    
    /**
     * Get all locations with specified language
     */
    List<LocationDTO> getAllLocationsWithLanguage(String languageCode);
    
    /**
     * Get destinations from a source location by ID with default language
     */
    List<LocationDTO> getDestinations(Long fromId);
    
    /**
     * Get destinations from a source location by ID with specified language
     */
    List<LocationDTO> getDestinationsWithLanguage(Long fromId, String languageCode);
    
    /**
     * Get buses between two locations by IDs with default language
     */
    List<BusScheduleDTO> getBuses(Long fromId, Long toId);
    
    /**
     * Get buses between two locations by IDs with specified language
     */
    List<BusScheduleDTO> getBusesWithLanguage(Long fromId, Long toId, String languageCode);
    
    /**
     * Find connecting routes between two locations by IDs with default language
     */
    List<BusScheduleDTO> findConnectingRoutesByIds(Long fromId, Long toId);
    
    /**
     * Find connecting routes between two locations by IDs with specified language
     */
    List<BusScheduleDTO> findConnectingRoutesByIdsWithLanguage(Long fromId, Long toId, String languageCode);
}