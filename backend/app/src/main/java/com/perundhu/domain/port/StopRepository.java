package com.perundhu.domain.port;

import java.util.List;
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

    Stop save(Stop stop);

    void delete(StopId id);
}
