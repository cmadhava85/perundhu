package com.perundhu.application.port.out;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;

import com.perundhu.domain.model.AdminAuditLog;

/**
 * Output port for admin audit log persistence operations
 * Defines contract for persisting and retrieving admin audit logs
 */
public interface AdminAuditLogPersistencePort {

    /**
     * Save an admin audit log entry
     *
     * @param auditLog The audit log to save
     * @return The saved audit log with generated ID
     */
    AdminAuditLog save(AdminAuditLog auditLog);

    /**
     * Get audit logs with pagination
     *
     * @param page The page number (0-indexed)
     * @param size The page size
     * @return Paginated audit logs in descending timestamp order
     */
    Page<AdminAuditLog> findAll(int page, int size);

    /**
     * Get audit logs by admin username
     *
     * @param adminUsername The admin username
     * @param page The page number (0-indexed)
     * @param size The page size
     * @return Paginated audit logs
     */
    Page<AdminAuditLog> findByAdminUsername(String adminUsername, int page, int size);

    /**
     * Get audit logs by action type
     *
     * @param actionType The action type
     * @param page The page number (0-indexed)
     * @param size The page size
     * @return Paginated audit logs
     */
    Page<AdminAuditLog> findByActionType(AdminAuditLog.AdminActionType actionType, int page, int size);

    /**
     * Get audit logs for a specific resource
     *
     * @param resourceType The resource type
     * @param resourceId The resource ID
     * @param page The page number (0-indexed)
     * @param size The page size
     * @return Paginated audit logs
     */
    Page<AdminAuditLog> findByResourceTypeAndResourceId(String resourceType, String resourceId, int page, int size);

    /**
     * Get audit logs within a date range
     *
     * @param start The start date/time
     * @param end The end date/time
     * @param page The page number (0-indexed)
     * @param size The page size
     * @return Paginated audit logs
     */
    Page<AdminAuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end, int page, int size);

    /**
     * Get audit logs by admin with recent first
     *
     * @param adminUsername The admin username
     * @param page The page number (0-indexed)
     * @param size The page size
     * @return Paginated audit logs
     */
    Page<AdminAuditLog> findRecentActionsByAdmin(String adminUsername, int page, int size);

    /**
     * Get action type statistics since a given date
     *
     * @param since The start date/time
     * @return List of [ActionType, Count] pairs
     */
    List<Object[]> getActionTypeStatistics(LocalDateTime since);

    /**
     * Find suspicious activities (multiple failures from same IP/user)
     *
     * @param since The start date/time
     * @param limit The maximum number of results
     * @return List of suspicious activity records
     */
    List<Object[]> findSuspiciousActivities(LocalDateTime since, int limit);

    /**
     * Get total count of audit log entries
     *
     * @return The total count
     */
    long count();
}
