package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Stop;

public interface StopRepository {
    Optional<Stop> findById(Stop.StopId id);
    List<Stop> findByBusOrderByStopOrder(Bus bus);
    List<Stop> findByBusId(Bus.BusId busId);
    
    /**
     * Find stops by bus ID (using Long)
     * @param busId The bus ID
     * @return List of stops for the bus
     */
    List<Stop> findByBusId(Long busId);
    
    /**
     * Find stops at a specific location
     * @param locationId The location ID
     * @return List of stops at the location
     */
    List<Stop> findByLocationId(Long locationId);
    
    Stop save(Stop stop);
    void delete(Stop.StopId id);
}