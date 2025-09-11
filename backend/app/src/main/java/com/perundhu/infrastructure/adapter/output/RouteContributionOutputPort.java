package com.perundhu.infrastructure.adapter.output;

import com.perundhu.domain.model.RouteContribution;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Output port for route contribution persistence operations.
 * This interface defines the contract for accessing route contribution data.
 */
public interface RouteContributionOutputPort {

  /**
   * Save a route contribution
   */
  RouteContribution save(RouteContribution contribution);

  /**
   * Find route contribution by ID
   */
  Optional<RouteContribution> findById(String id);

  /**
   * Find all route contributions
   */
  List<RouteContribution> findAll();

  /**
   * Find route contributions by user ID
   */
  List<RouteContribution> findByUserId(String userId);

  /**
   * Find route contributions by status
   */
  List<RouteContribution> findByStatus(String status);

  /**
   * Find route contributions by submitter
   */
  List<RouteContribution> findBySubmittedBy(String submittedBy);

  /**
   * Find route contributions by submitter and submission date after
   */
  List<RouteContribution> findBySubmittedByAndSubmissionDateAfter(String submittedBy, LocalDateTime submissionDate);

  /**
   * Delete route contribution by ID
   */
  void deleteById(String id);

  /**
   * Count all route contributions
   */
  long count();

  /**
   * Count route contributions by status
   */
  long countByStatus(String status);
}