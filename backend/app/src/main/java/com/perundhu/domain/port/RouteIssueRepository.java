package com.perundhu.domain.port;

import com.perundhu.domain.model.RouteIssue;
import com.perundhu.domain.model.RouteIssue.IssueStatus;
import com.perundhu.domain.model.RouteIssue.IssueType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for managing route issue reports.
 */
@Repository
public interface RouteIssueRepository extends JpaRepository<RouteIssue, Long> {
    
    /**
     * Find all issues by status
     */
    List<RouteIssue> findByStatus(IssueStatus status);
    
    /**
     * Find all issues by status with pagination
     */
    Page<RouteIssue> findByStatus(IssueStatus status, Pageable pageable);
    
    /**
     * Find issues for a specific bus
     */
    List<RouteIssue> findByBusId(Long busId);
    
    /**
     * Find issues by type
     */
    List<RouteIssue> findByIssueType(IssueType issueType);
    
    /**
     * Find pending issues ordered by created date
     */
    @Query("SELECT r FROM RouteIssue r WHERE r.status = 'PENDING' ORDER BY r.createdAt DESC")
    List<RouteIssue> findPendingIssues();
    
    /**
     * Find issues by status with priority ordering
     */
    @Query("SELECT r FROM RouteIssue r WHERE r.status = :status ORDER BY " +
           "CASE r.priority " +
           "  WHEN 'CRITICAL' THEN 1 " +
           "  WHEN 'HIGH' THEN 2 " +
           "  WHEN 'MEDIUM' THEN 3 " +
           "  WHEN 'LOW' THEN 4 " +
           "END, r.createdAt DESC")
    List<RouteIssue> findByStatusOrderByPriority(@Param("status") IssueStatus status);
    
    /**
     * Find similar issues (potential duplicates)
     */
    @Query("SELECT r FROM RouteIssue r WHERE r.busId = :busId AND r.issueType = :issueType " +
           "AND r.status IN ('PENDING', 'UNDER_REVIEW', 'CONFIRMED')")
    List<RouteIssue> findSimilarIssues(@Param("busId") Long busId, @Param("issueType") IssueType issueType);
    
    /**
     * Find issues reported by a specific user
     */
    List<RouteIssue> findByReporterIdOrderByCreatedAtDesc(String reporterId);
    
    /**
     * Count issues by status
     */
    long countByStatus(IssueStatus status);
    
    /**
     * Count issues by type
     */
    long countByIssueType(IssueType issueType);
    
    /**
     * Find issues for a route (from-to combination)
     */
    @Query("SELECT r FROM RouteIssue r WHERE " +
           "LOWER(r.fromLocation) = LOWER(:from) AND LOWER(r.toLocation) = LOWER(:to) " +
           "AND r.status IN ('PENDING', 'UNDER_REVIEW', 'CONFIRMED')")
    List<RouteIssue> findIssuesForRoute(@Param("from") String fromLocation, @Param("to") String toLocation);
    
    /**
     * Get statistics summary
     */
    @Query("SELECT r.status, COUNT(r) FROM RouteIssue r GROUP BY r.status")
    List<Object[]> getStatusStatistics();
    
    /**
     * Get issue type statistics
     */
    @Query("SELECT r.issueType, COUNT(r) FROM RouteIssue r WHERE r.status = 'PENDING' GROUP BY r.issueType")
    List<Object[]> getPendingIssueTypeStatistics();
    
    /**
     * Find high priority issues that need attention
     */
    @Query("SELECT r FROM RouteIssue r WHERE r.status = 'PENDING' " +
           "AND (r.priority = 'HIGH' OR r.priority = 'CRITICAL' OR r.reportCount >= 3) " +
           "ORDER BY r.priority, r.reportCount DESC")
    List<RouteIssue> findHighPriorityIssues();
    
    /**
     * Check if similar issue already exists
     */
    @Query("SELECT COUNT(r) > 0 FROM RouteIssue r WHERE r.busId = :busId " +
           "AND r.issueType = :issueType AND r.status IN ('PENDING', 'UNDER_REVIEW')")
    boolean existsSimilarPendingIssue(@Param("busId") Long busId, @Param("issueType") IssueType issueType);
    
    /**
     * Find issue by bus and type (for incrementing report count)
     */
    Optional<RouteIssue> findFirstByBusIdAndIssueTypeAndStatusIn(Long busId, IssueType issueType, List<IssueStatus> statuses);
}
