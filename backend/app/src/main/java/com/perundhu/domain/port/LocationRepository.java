package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Location;

public interface LocationRepository {
    Optional<Location> findById(Location.LocationId id);
    List<Location> findAll();
    List<Location> findAllExcept(Location.LocationId id);
    List<Location> findByName(String name);
    Location save(Location location);
    void delete(Location.LocationId id);
}