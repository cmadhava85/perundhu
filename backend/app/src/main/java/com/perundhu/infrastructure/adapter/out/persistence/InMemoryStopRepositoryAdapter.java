package com.perundhu.infrastructure.adapter.out.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.port.StopRepository;

/**
 * In-memory implementation of StopRepository for testing/development purposes.
 * This is a temporary adapter to resolve startup issues.
 * In production, this should be replaced with a proper JPA adapter.
 */
@Component("inMemoryStopRepository")
public class InMemoryStopRepositoryAdapter implements StopRepository {

  @Override
  public Optional<Stop> findById(com.perundhu.domain.model.StopId id) {
    return Optional.empty();
  }

  @Override
  public List<Stop> findByBusOrderByStopOrder(Bus bus) {
    return List.of();
  }

  @Override
  public List<Stop> findByBusId(com.perundhu.domain.model.BusId busId) {
    return List.of();
  }

  @Override
  public List<Stop> findByBusId(Long busId) {
    return List.of();
  }

  @Override
  public List<Stop> findByLocationId(Long locationId) {
    return List.of();
  }

  @Override
  public Stop save(Stop stop) {
    return stop;
  }

  @Override
  public Stop saveWithBus(Stop stop, BusId busId) {
    // In-memory implementation just returns the stop as-is
    return stop;
  }

  @Override
  public void delete(com.perundhu.domain.model.StopId id) {
    // Do nothing
  }
}