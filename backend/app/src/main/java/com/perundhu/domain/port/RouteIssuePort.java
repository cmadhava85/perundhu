package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.RouteIssue;
import com.perundhu.domain.model.RouteIssue.IssuePriority;
import com.perundhu.domain.model.RouteIssue.IssueStatus;
import com.perundhu.domain.model.RouteIssue.IssueType;

/**
 * Domain port for RouteIssue persistence operations.
 * Following hexagonal architecture - this is the domain's view of persistence.
 */
public interface RouteIssuePort {

  /**
   * Save a route issue
   */
  RouteIssue save(RouteIssue routeIssue);

  /**
   * Find a route issue by ID
   */
  Optional<RouteIssue> findById(Long id);

  /**
   * Find all route issues by status
   */
  List<RouteIssue> findByStatus(IssueStatus status);

  /**
   * Find route issues by status with pagination
   */
  PagedResult<RouteIssue> findByStatus(IssueStatus status, int page, int size);

  /**
   * Find route issues by bus ID
   */
  List<RouteIssue> findByBusId(Long busId);

  /**
   * Find route issues by reporter ID ordered by creation date descending
   */
  List<RouteIssue> findByReporterIdOrderByCreatedAtDesc(String reporterId);

  /**
   * Find first matching issue by bus ID, issue type, and active statuses
   */
  Optional<RouteIssue> findFirstByBusIdAndIssueTypeAndStatusIn(
      Long busId, IssueType issueType, List<IssueStatus> statuses);

  /**
   * Find issues for a specific route
   */
  List<RouteIssue> findIssuesForRoute(String fromLocation, String toLocation);

  /**
   * Find high priority issues
   */
  List<RouteIssue> findHighPriorityIssues();

  /**
   * Count issues by status
   */
  long countByStatus(IssueStatus status);

  /**
   * Count issues by type
   */
  long countByIssueType(IssueType issueType);

  /**
   * Delete a route issue by ID
   */
  void deleteById(Long id);

  /**
   * Paged result wrapper for domain layer
   */
  record PagedResult<T>(
      List<T> content,
      long totalElements,
      int page,
      int totalPages) {
  }
}
