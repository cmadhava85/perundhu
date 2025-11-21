package com.perundhu.domain.port;

import com.perundhu.domain.model.SkippedTimingRecord;
import com.perundhu.domain.model.SkippedTimingRecord.SkipReason;

import java.util.List;

/**
 * Repository interface for SkippedTimingRecord entity
 */
public interface SkippedTimingRecordRepository {

  /**
   * Save a skipped timing record
   */
  SkippedTimingRecord save(SkippedTimingRecord record);

  /**
   * Find all skipped records for a contribution
   */
  List<SkippedTimingRecord> findByContributionId(Long contributionId);

  /**
   * Find all skipped records by skip reason
   */
  List<SkippedTimingRecord> findBySkipReason(SkipReason reason);

  /**
   * Find all skipped records by processor
   */
  List<SkippedTimingRecord> findByProcessedBy(String processedBy);

  /**
   * Find all skipped records for a route
   */
  List<SkippedTimingRecord> findByFromLocationIdAndToLocationId(Long fromLocationId, Long toLocationId);

  /**
   * Count skipped records by reason
   */
  long countBySkipReason(SkipReason reason);

  /**
   * Find all skipped records
   */
  List<SkippedTimingRecord> findAll();
}
