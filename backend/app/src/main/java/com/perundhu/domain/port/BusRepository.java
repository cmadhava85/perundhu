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

        Optional<Bus> findByBusNumberAndRoute(String busNumber, LocationId fromLocationId,
                        LocationId toLocationId);

        List<Bus> findInService();

        long countByCategory(String category);
}