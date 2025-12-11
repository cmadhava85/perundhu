package com.perundhu.infrastructure.persistence.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.RouteIssueJpaEntity;
import com.perundhu.infrastructure.persistence.entity.RouteIssueJpaEntity.IssueStatus;
import com.perundhu.infrastructure.persistence.entity.RouteIssueJpaEntity.IssueType;

/**
 * JPA Repository for RouteIssue persistence operations.
 */
@Repository
public interface RouteIssueJpaRepository extends JpaRepository<RouteIssueJpaEntity, Long> {

    List<RouteIssueJpaEntity> findByStatus(IssueStatus status);

    Page<RouteIssueJpaEntity> findByStatus(IssueStatus status, Pageable pageable);

    List<RouteIssueJpaEntity> findByBusId(Long busId);

    List<RouteIssueJpaEntity> findByIssueType(IssueType issueType);

    @Query("SELECT r FROM RouteIssueJpaEntity r WHERE r.status = 'PENDING' ORDER BY r.createdAt DESC")
    List<RouteIssueJpaEntity> findPendingIssues();

    @Query("SELECT r FROM RouteIssueJpaEntity r WHERE r.status = :status ORDER BY " +
           "CASE r.priority " +
           "WHEN com.perundhu.infrastructure.persistence.entity.RouteIssueJpaEntity$IssuePriority.CRITICAL THEN 1 " +
           "WHEN com.perundhu.infrastructure.persistence.entity.RouteIssueJpaEntity$IssuePriority.HIGH THEN 2 " +
           "WHEN com.perundhu.infrastructure.persistence.entity.RouteIssueJpaEntity$IssuePriority.MEDIUM THEN 3 " +
           "ELSE 4 END, r.createdAt DESC")
    List<RouteIssueJpaEntity> findByStatusOrderByPriority(@Param("status") IssueStatus status);

    @Query("SELECT r FROM RouteIssueJpaEntity r WHERE r.busId = :busId AND r.issueType = :issueType " +
           "AND r.status IN ('PENDING', 'UNDER_REVIEW', 'CONFIRMED')")
    List<RouteIssueJpaEntity> findSimilarIssues(@Param("busId") Long busId, @Param("issueType") IssueType issueType);

    List<RouteIssueJpaEntity> findByReporterIdOrderByCreatedAtDesc(String reporterId);

    Optional<RouteIssueJpaEntity> findFirstByBusIdAndIssueTypeAndStatusIn(
            Long busId, IssueType issueType, List<IssueStatus> statuses);

    long countByStatus(IssueStatus status);

    long countByIssueType(IssueType issueType);

    @Query("SELECT r FROM RouteIssueJpaEntity r WHERE " +
           "(r.fromLocation LIKE %:from% OR r.toLocation LIKE %:to%) " +
           "ORDER BY r.createdAt DESC")
    List<RouteIssueJpaEntity> findIssuesForRoute(@Param("from") String fromLocation, @Param("to") String toLocation);

    @Query("SELECT r FROM RouteIssueJpaEntity r WHERE r.status = 'PENDING' " +
           "AND (r.priority = 'CRITICAL' OR r.priority = 'HIGH' OR r.reportCount >= 3) " +
           "ORDER BY r.priority, r.reportCount DESC, r.createdAt")
    List<RouteIssueJpaEntity> findHighPriorityIssues();
}
