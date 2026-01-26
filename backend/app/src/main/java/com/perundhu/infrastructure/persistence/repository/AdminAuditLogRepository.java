package com.perundhu.infrastructure.persistence.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.domain.model.AdminAuditLog;
import com.perundhu.infrastructure.persistence.entity.AdminAuditLogJpaEntity;

/**
 * Repository for admin audit logs
 */
@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLogJpaEntity, String> {

    /**
     * Find audit logs by admin username
     */
    Page<AdminAuditLogJpaEntity> findByAdminUsername(String adminUsername, Pageable pageable);

    /**
     * Find audit logs by action type
     */
    Page<AdminAuditLogJpaEntity> findByActionType(AdminAuditLog.AdminActionType actionType, Pageable pageable);

    /**
     * Find audit logs within date range
     */
    Page<AdminAuditLogJpaEntity> findByTimestampBetween(
            LocalDateTime start,
            LocalDateTime end,
            Pageable pageable);

    /**
     * Find audit logs by resource
     */
    Page<AdminAuditLogJpaEntity> findByResourceTypeAndResourceId(
            String resourceType,
            String resourceId,
            Pageable pageable);

    /**
     * Find failed actions
     */
    Page<AdminAuditLogJpaEntity> findByResult(AdminAuditLog.ActionResult result, Pageable pageable);

    /**
     * Find recent actions by admin
     */
    @Query("SELECT a FROM AdminAuditLogJpaEntity a WHERE a.adminUsername = :username ORDER BY a.timestamp DESC")
    Page<AdminAuditLogJpaEntity> findRecentActionsByAdmin(@Param("username") String username, Pageable pageable);

    /**
     * Count actions by admin within time range
     */
    @Query("SELECT COUNT(a) FROM AdminAuditLogJpaEntity a WHERE a.adminUsername = :username " +
           "AND a.timestamp >= :since")
    long countActionsByAdminSince(@Param("username") String username, @Param("since") LocalDateTime since);

    /**
     * Find suspicious activities (high failure rate from same IP)
     */
    @Query("SELECT a.ipAddress, COUNT(a) as failureCount FROM AdminAuditLogJpaEntity a " +
           "WHERE a.result = 'FAILURE' AND a.timestamp >= :since " +
           "GROUP BY a.ipAddress HAVING COUNT(a) > :threshold")
    List<Object[]> findSuspiciousActivities(@Param("since") LocalDateTime since, @Param("threshold") long threshold);

    /**
     * Get admin activity statistics
     */
    @Query("SELECT a.actionType, COUNT(a) FROM AdminAuditLogJpaEntity a " +
           "WHERE a.timestamp >= :since GROUP BY a.actionType ORDER BY COUNT(a) DESC")
    List<Object[]> getActionTypeStatistics(@Param("since") LocalDateTime since);
}
