package com.perundhu.application.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.dto.BusScheduleDTO;
import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.RouteDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.application.dto.OSMBusStopDTO;
import com.perundhu.application.dto.BusRouteDTO;
import com.perundhu.domain.model.Location;

/**
 * Service interface for bus schedule operations
 */
public interface BusScheduleService {
    /**
     * Get all buses in the system
     * 
     * @return List of all buses
     */
    List<BusDTO> getAllBuses();

    /**
     * Get a specific bus by its ID
     * 
     * @param busId The ID of the bus
     * @return Optional containing the bus if found
     */
    Optional<BusDTO> getBusById(Long busId);

    /**
     * Get all locations with language support
     * 
     * @param language The language code (e.g., "en", "ta")
     * @return List of all locations
     */
    List<LocationDTO> getAllLocations(String language);

    /**
     * Find direct buses between two locations
     * 
     * @param fromLocationId Starting location ID
     * @param toLocationId   Destination location ID
     * @return List of buses that travel directly between the locations
     */
    List<BusDTO> findBusesBetweenLocations(Long fromLocationId, Long toLocationId);

    /**
     * Find buses that pass through both locations as stops (including intermediate
     * stops)
     * This includes buses where these locations are intermediate stops on a longer
     * route
     * 
     * @param fromLocationId Starting location ID
     * @param toLocationId   Destination location ID
     * @return List of buses that pass through both locations
     */
    List<BusDTO> findBusesPassingThroughLocations(Long fromLocationId, Long toLocationId);

    /**
     * Find connecting routes between locations when no direct buses are available
     * 
     * @param fromLocationId Starting location ID
     * @param toLocationId   Destination location ID
     * @return List of connecting routes with transfer points
     */
    List<ConnectingRouteDTO> findConnectingRoutes(Long fromLocationId, Long toLocationId);

    /**
     * Find connecting routes between two locations using Location objects
     * This overload accepts Location objects and language code
     */
    List<ConnectingRouteDTO> findConnectingRoutes(Location fromLocation, Location toLocation, String languageCode);

    /**
     * Get stops for a specific bus with language support
     * 
     * @param busId    The ID of the bus
     * @param language The language code (e.g., "en", "ta")
     * @return List of stops for the specified bus
     */
    List<StopDTO> getStopsForBus(Long busId, String language);

    /**
     * Find bus stops with the given language code
     */
    List<StopDTO> findBusStops(Long busId, String languageCode);

    /**
     * Find bus schedules between two locations
     */
    List<BusScheduleDTO> findBusSchedules(Location fromLocation, Location toLocation, String languageCode);

    /**
     * Search for buses between two locations on a specific date
     */
    List<BusScheduleDTO> searchBuses(String from, String to, LocalDate date);

    /**
     * Search for buses between two locations with pagination
     * 
     * @param fromLocation Starting location name
     * @param toLocation   Destination location name
     * @param page         Page number for pagination
     * @param size         Number of results per page
     * @return List of buses matching the search criteria
     */
    List<BusDTO> searchRoutes(String fromLocation, String toLocation, int page, int size);

    /**
     * Get all available routes
     */
    List<RouteDTO> getAllRoutes();

    /**
     * Get detailed schedule for a specific bus
     */
    BusScheduleDTO getBusSchedule(Long busId, LocalDate date);

    /**
     * Get all stops for a specific route
     */
    List<StopDTO> getStopsForRoute(Long routeId);

    /**
     * Search locations by name pattern for autocomplete
     * 
     * @param namePattern The partial name to search for (minimum 3 characters)
     * @return List of matching locations in Tamil Nadu, limited to 10 results
     */
    List<Location> searchLocationsByName(String namePattern);

    /**
     * Discover intermediate bus stops between two locations using OSM data
     * 
     * @param fromLocationId Starting location ID
     * @param toLocationId   Destination location ID
     * @return List of OSM bus stops found between the locations
     */
    List<OSMBusStopDTO> discoverIntermediateStops(Long fromLocationId, Long toLocationId);

    /**
     * Discover actual bus routes using OSM data
     * 
     * @param fromLocationId Starting location ID
     * @param toLocationId   Destination location ID
     * @return List of OSM bus routes found between the locations
     */
    List<BusRouteDTO> discoverOSMRoutes(Long fromLocationId, Long toLocationId);

    /**
     * Find buses that continue beyond the destination city
     * This shows buses that go from origin to destination and then continue to
     * other cities
     * For example: Chennai to Trichy search will show Chennai->Madurai bus (via
     * Trichy)
     * 
     * @param fromLocationId Starting location ID
     * @param toLocationId   Destination location ID (intermediate stop)
     * @return List of buses that pass through the destination and continue further
     */
    List<BusDTO> findBusesContinuingBeyondDestination(Long fromLocationId, Long toLocationId);
}