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
}