package com.perundhu.domain.port;

import com.perundhu.domain.model.BusTimingRecord;
import com.perundhu.domain.model.BusTimingRecord.TimingType;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for BusTimingRecord entity
 */
public interface BusTimingRecordRepository {

  /**
   * Save a bus timing record
   */
  BusTimingRecord save(BusTimingRecord record);

  /**
   * Find a timing record by ID
   */
  Optional<BusTimingRecord> findById(Long id);

  /**
   * Find timing record by route and time
   */
  Optional<BusTimingRecord> findByFromLocationAndToLocationAndDepartureTimeAndTimingType(
      Long fromLocationId, Long toLocationId, LocalTime departureTime, TimingType timingType);

  /**
   * Find all timings for a specific route
   */
  List<BusTimingRecord> findByFromLocationIdAndToLocationId(Long fromLocationId, Long toLocationId);

  /**
   * Find all timings from a location
   */
  List<BusTimingRecord> findByFromLocationId(Long fromLocationId);

  /**
   * Find all timings by contribution
   */
  List<BusTimingRecord> findByContributionId(Long contributionId);

  /**
   * Check if timing exists
   */
  boolean existsByFromLocationAndToLocationAndDepartureTimeAndTimingType(
      Long fromLocationId, Long toLocationId, LocalTime departureTime, TimingType timingType);

  /**
   * Find all timing records
   */
  List<BusTimingRecord> findAll();
}
