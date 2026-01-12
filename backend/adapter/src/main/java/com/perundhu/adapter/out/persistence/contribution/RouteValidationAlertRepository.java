package com.perundhu.adapter.out.persistence.contribution;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for RouteValidationAlert persistence.
 * Provides queries for admin dashboard and validation monitoring.
 */
@Repository
public interface RouteValidationAlertRepository extends JpaRepository<RouteValidationAlertJpaEntity, UUID> {
    
    /**
     * Find all alerts for a specific contribution.
     */
    List<RouteValidationAlertJpaEntity> findByContributionId(UUID contributionId);
    
    /**
     * Find all pending alerts (awaiting admin review).
     * Ordered by confidence score (highest first) for prioritization.
     */
    @Query("SELECT a FROM RouteValidationAlertJpaEntity a " +
            "WHERE a.status = 'PENDING' " +
            "ORDER BY a.confidenceScore DESC, a.createdAt DESC")
    List<RouteValidationAlertJpaEntity> findAllPendingAlerts();
    
    /**
     * Find pending alerts with pagination for dashboard display.
     */
    Page<RouteValidationAlertJpaEntity> findByStatusOrderByConfidenceScoreDescCreatedAtDesc(
            RouteValidationAlertJpaEntity.AlertStatus status,
            Pageable pageable
    );
    
    /**
     * Find alerts by validation type.
     */
    List<RouteValidationAlertJpaEntity> findByValidationTypeOrderByConfidenceScoreDesc(
            com.perundhu.domain.port.RoutingValidationPort.ValidationType validationType
    );
    
    /**
     * Find high-confidence alerts (> 75).
     * These are most likely to represent actual data quality issues.
     */
    @Query("SELECT a FROM RouteValidationAlertJpaEntity a " +
            "WHERE a.confidenceScore > 75 " +
            "AND a.status IN ('PENDING', 'ESCALATED') " +
            "ORDER BY a.confidenceScore DESC, a.createdAt DESC")
    List<RouteValidationAlertJpaEntity> findHighConfidenceAlerts();
    
    /**
     * Find alerts created within a time window.
     * Useful for analyzing data quality trends.
     */
    @Query("SELECT a FROM RouteValidationAlertJpaEntity a " +
            "WHERE a.createdAt BETWEEN :startTime AND :endTime " +
            "ORDER BY a.createdAt DESC")
    List<RouteValidationAlertJpaEntity> findAlertsCreatedBetween(
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime
    );
    
    /**
     * Find false positives (dismissed alerts) for a validation type.
     * Useful for tuning validation thresholds.
     */
    @Query("SELECT a FROM RouteValidationAlertJpaEntity a " +
            "WHERE a.status = 'DISMISSED' " +
            "AND a.validationType = :validationType " +
            "ORDER BY a.createdAt DESC")
    List<RouteValidationAlertJpaEntity> findFalsePositivesByType(
            @Param("validationType") com.perundhu.domain.port.RoutingValidationPort.ValidationType validationType
    );
    
    /**
     * Count alerts by status for dashboard summary.
     */
    long countByStatus(RouteValidationAlertJpaEntity.AlertStatus status);
    
    /**
     * Count alerts by validation type.
     */
    long countByValidationType(com.perundhu.domain.port.RoutingValidationPort.ValidationType validationType);
    
    /**
     * Check if a contribution has any pending alerts.
     */
    boolean existsByContributionIdAndStatus(
            UUID contributionId,
            RouteValidationAlertJpaEntity.AlertStatus status
    );
    
    /**
     * Find the most recent alert for a contribution.
     */
    Optional<RouteValidationAlertJpaEntity> findFirstByContributionIdOrderByCreatedAtDesc(UUID contributionId);
    
    /**
     * Find all alerts reviewed by a specific admin.
     */
    List<RouteValidationAlertJpaEntity> findByReviewedByOrderByReviewedAtDesc(String adminId);
    
    /**
     * Calculate false positive rate for a validation type.
     * Returns ratio of dismissed alerts to all alerts for the type.
     */
    @Query("SELECT COUNT(a) FROM RouteValidationAlertJpaEntity a " +
            "WHERE a.validationType = :validationType " +
            "AND a.status = 'DISMISSED'")
    long countFalsePositivesByType(
            @Param("validationType") com.perundhu.domain.port.RoutingValidationPort.ValidationType validationType
    );
    
    /**
     * Get statistics on average confidence score by validation type.
     */
    @Query("SELECT new map(" +
            "a.validationType as type, " +
            "AVG(a.confidenceScore) as avgConfidence, " +
            "COUNT(a) as count) " +
            "FROM RouteValidationAlertJpaEntity a " +
            "WHERE a.status = 'PENDING' " +
            "GROUP BY a.validationType")
    List<java.util.Map<String, Object>> getStatisticsByValidationType();
}
