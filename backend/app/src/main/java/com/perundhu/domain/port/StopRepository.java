package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Stop;

public interface StopRepository {
    Optional<Stop> findById(Stop.StopId id);
    List<Stop> findByBusOrderByStopOrder(Bus bus);
    List<Stop> findByBusId(Bus.BusId busId);
    Stop save(Stop stop);
    void delete(Stop.StopId id);
}