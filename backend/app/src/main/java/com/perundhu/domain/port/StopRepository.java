package com.perundhu.domain.port;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.model.StopId;

public interface StopRepository {
    Optional<Stop> findById(StopId id);

    /**
     * Find stops by bus entity ordered by stop order
     * 
     * @param bus The bus entity
     * @return List of stops ordered by stop order
     */
    List<Stop> findByBusOrderByStopOrder(Bus bus);

    /**
     * Find stops by bus ID (using BusId value object)
     * 
     * @param busId The bus ID value object
     * @return List of stops for the bus
     */
    List<Stop> findByBusId(BusId busId);

    /**
     * Find stops by bus ID (using Long)
     * 
     * @param busId The bus ID as Long
     * @return List of stops for the bus
     */
    List<Stop> findByBusId(Long busId);

    /**
     * Find stops ordered by stop order (using BusId value object)
     * 
     * @param busId The bus ID value object
     * @return List of stops ordered by stop order
     */
    default List<Stop> findByBusIdOrderByStopOrder(BusId busId) {
        // Use the more specific method that takes BusId directly
        return findByBusId(busId);
    }

    /**
     * Find stops ordered by stop order (using Long)
     * 
     * @param busId The bus ID as Long
     * @return List of stops ordered by stop order
     */
    default List<Stop> findByBusIdOrderByStopOrder(Long busId) {
        return findByBusId(busId);
    }

    /**
     * Find stops at a specific location
     * 
     * @param locationId The location ID
     * @return List of stops at the location
     */
    List<Stop> findByLocationId(Long locationId);

    /**
     * Batch load stops for multiple buses in a single query.
     * Prevents N+1 query issue when building route graphs.
     * 
     * @param busIds List of bus IDs to load stops for
     * @return List of stops ordered by bus ID and stop order
     */
    List<Stop> findByBusIdsOrderByStopOrder(List<Long> busIds);

    /**
     * Batch load stops for multiple buses, returning a map grouped by bus ID.
     * This is the optimized version for building route graphs.
     * 
     * @param busIds List of bus IDs to load stops for
     * @return Map of bus ID to list of stops, ordered by stop order
     */
    Map<Long, List<Stop>> findStopsByBusIdsGrouped(List<Long> busIds);

    Stop save(Stop stop);

    /**
     * Save a stop with a bus association.
     * This is used when creating stops from route contributions.
     * 
     * @param stop  The stop domain model to save
     * @param busId The bus ID to associate the stop with
     * @return The saved stop
     */
    Stop saveWithBus(Stop stop, BusId busId);

    void delete(StopId id);
}
