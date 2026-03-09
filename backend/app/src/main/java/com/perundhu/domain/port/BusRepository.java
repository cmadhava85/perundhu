package com.perundhu.domain.port;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;

public interface BusRepository {
        Optional<Bus> findById(com.perundhu.domain.model.BusId id);

        List<Bus> findByFromAndToLocation(Location from, Location to);

        List<Bus> findByFromLocation(Location from);

        Bus save(Bus bus);

        void delete(com.perundhu.domain.model.BusId id);

        /**
         * Check if a bus with the given number and route already exists
         * 
         * @param busNumber        The bus number to check
         * @param fromLocationName The origin location name
         * @param toLocationName   The destination location name
         * @return true if such a bus exists, false otherwise
         */
        boolean existsByBusNumberAndFromAndToLocations(String busNumber, String fromLocationName,
                        String toLocationName);

        /**
         * Check if a bus with the given number, route, and timing already exists
         * This method considers timing to allow different schedules for the same route
         * 
         * @param busNumber        The bus number to check
         * @param fromLocationName The origin location name
         * @param toLocationName   The destination location name
         * @param departureTime    The departure time
         * @param arrivalTime      The arrival time
         * @return true if such a bus exists, false otherwise
         */
        boolean existsByBusNumberAndFromAndToLocationsAndTiming(String busNumber, String fromLocationName,
                        String toLocationName, LocalTime departureTime, LocalTime arrivalTime);

        /**
         * Find all buses in the system
         * 
         * @return List of all buses
         */
        List<Bus> findAllBuses();

        /**
         * Find all buses
         * 
         * @return List of all buses
         */
        List<Bus> findAll();

        /**
         * Find buses between two locations using location IDs
         * 
         * @param fromLocationId The ID of the origin location
         * @param toLocationId   The ID of the destination location
         * @return List of buses between the specified locations
         */
        List<Bus> findBusesBetweenLocations(Long fromLocationId, Long toLocationId);

        /**
         * Find a bus by its ID (using Long)
         * 
         * @param busId The bus ID
         * @return Optional containing the bus if found
         */
        Optional<Bus> findById(Long busId);

        /**
         * Find buses that pass through both locations as stops (including intermediate
         * stops)
         * This includes buses where these locations are intermediate stops on a longer
         * route
         * 
         * @param fromLocationId The ID of the origin location
         * @param toLocationId   The ID of the destination location
         * @return List of buses that have stops at both locations in the correct order
         */
        List<Bus> findBusesPassingThroughLocations(Long fromLocationId, Long toLocationId);

        /**
         * Find buses that continue beyond the destination city
         * This finds buses where fromLocation and toLocation are both stops,
         * but toLocation is NOT the final destination
         * 
         * @param fromLocationId The ID of the origin location
         * @param toLocationId   The ID of the intermediate destination location
         * @return List of buses that pass through toLocation and continue further
         */
        List<Bus> findBusesContinuingBeyondDestination(Long fromLocationId, Long toLocationId);

        /**
         * Enhanced methods using Java 17 features
         */
        List<Bus> findByBusNumber(String busNumber);

        List<Bus> findByCategory(String category);

        List<Bus> findByBusNumberAndRoute(String busNumber, LocationId fromLocationId,
                        LocationId toLocationId);

        List<Bus> findInService();

        long countByCategory(String category);

        /**
         * Find buses that pass through any combination of from locations and to
         * locations.
         * This is useful for handling duplicate location names (e.g., villages with
         * same name
         * near different cities).
         * 
         * @param fromLocationIds List of possible origin location IDs (for same-named
         *                        locations)
         * @param toLocationIds   List of possible destination location IDs (for
         *                        same-named locations)
         * @return List of buses that pass through any from location to any to location
         */
        List<Bus> findBusesPassingThroughAnyLocations(List<Long> fromLocationIds, List<Long> toLocationIds);

        /**
         * Find direct buses from any of the source locations to any of the destination
         * locations.
         * Used for hierarchical search where source/destination may include parent city
         * + child terminals.
         * 
         * Example: Search "Chennai → Madurai" where:
         * - Chennai includes: [1 (city), 62428 (CMBT), 99355 (KCBT), 99295 (Tambaram)]
         * - Madurai includes: [3 (city), 62434 (Mattuthavani)]
         * Returns all direct buses from any Chennai terminal to any Madurai terminal
         * 
         * @param fromLocationIds List of source location IDs (parent + children)
         * @param toLocationIds   List of destination location IDs (parent + children)
         * @return List of direct buses from any source to any destination
         */
        List<Bus> findBusesBetweenLocationSets(List<Long> fromLocationIds, List<Long> toLocationIds);

        /**
         * Get the total count of buses in the system.
         * 
         * @return The total number of buses
         */
        long count();

        /**
         * Count buses whose bus number starts with the given prefix.
         * Used to generate unique sequential bus numbers (e.g. "GEN-CHE-MAD-001").
         *
         * @param prefix The prefix to match against
         * @return The count of matching buses
         */
        long countByBusNumberStartingWith(String prefix);

        /**
         * Count the number of bus routes that serve a given location
         * (either as origin, destination, or intermediate stop).
         * 
         * @param locationId The location ID to count routes for
         * @return The number of routes serving this location
         */
        int countRoutesForLocation(Long locationId);
}