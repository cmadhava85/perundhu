package com.perundhu.domain.port;

import com.perundhu.domain.model.TimingImageContribution;
import com.perundhu.domain.model.TimingImageContribution.TimingImageStatus;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for TimingImageContribution entity
 */
public interface TimingImageContributionRepository {

  /**
   * Save a timing image contribution
   */
  TimingImageContribution save(TimingImageContribution contribution);

  /**
   * Find a contribution by ID
   */
  Optional<TimingImageContribution> findById(Long id);

  /**
   * Find all contributions by user
   */
  List<TimingImageContribution> findByUserId(String userId);

  /**
   * Find all contributions with a specific status
   */
  List<TimingImageContribution> findByStatus(TimingImageStatus status);

  /**
   * Find all pending contributions (for admin review)
   */
  List<TimingImageContribution> findPendingContributions();

  /**
   * Find all contributions by submitter
   */
  List<TimingImageContribution> findBySubmittedBy(String submittedBy);

  /**
   * Find all contributions for a specific origin location
   */
  List<TimingImageContribution> findByOriginLocation(String originLocation);

  /**
   * Delete a contribution
   */
  void deleteById(Long id);

  /**
   * Find all contributions
   */
  List<TimingImageContribution> findAll();
}
