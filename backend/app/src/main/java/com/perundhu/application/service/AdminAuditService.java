package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perundhu.application.port.out.AdminAuditLogPersistencePort;
import com.perundhu.domain.model.AdminAuditLog;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing admin audit logs
 * Provides comprehensive audit trail functionality for all administrative actions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAuditService {

    private final AdminAuditLogPersistencePort auditLogPort;
    private final ObjectMapper objectMapper;

    /**
     * Log an admin action asynchronously
     * Uses separate transaction to ensure audit logs are persisted even if main operation fails
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAction(
            AdminAuditLog.AdminActionType actionType,
            String resourceType,
            String resourceId,
            String actionDescription,
            Object stateBefore,
            Object stateAfter,
            HttpServletRequest request,
            AdminAuditLog.ActionResult result,
            String errorMessage,
            Long durationMs) {
        
        try {
            String adminUsername = getCurrentAdminUsername();
            String ipAddress = extractIpAddress(request);
            String userAgent = request != null ? request.getHeader("User-Agent") : null;
            String sessionId = request != null ? request.getSession(false) != null 
                ? request.getSession(false).getId() : null : null;

            AdminAuditLog auditLog = AdminAuditLog.builder()
                    .adminUsername(adminUsername)
                    .ipAddress(ipAddress)
                    .actionType(actionType)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .actionDescription(actionDescription)
                    .stateBefore(serializeState(stateBefore))
                    .stateAfter(serializeState(stateAfter))
                    .httpMethod(request != null ? request.getMethod() : null)
                    .requestUri(request != null ? request.getRequestURI() : null)
                    .requestParams(extractRequestParams(request))
                    .responseStatus(result == AdminAuditLog.ActionResult.SUCCESS ? 200 : 500)
                    .result(result)
                    .errorMessage(errorMessage)
                    .timestamp(LocalDateTime.now())
                    .durationMs(durationMs)
                    .userAgent(userAgent)
                    .sessionId(sessionId)
                    .build();

            auditLogPort.save(auditLog);

            log.info("Audit log created: {} - {} - {} by {}",
                    actionType, resourceType, resourceId, adminUsername);

        } catch (Exception e) {
            // Never fail the main operation due to audit logging issues
            log.error("Failed to create audit log: {}", e.getMessage(), e);
        }
    }

    /**
     * Log a successful admin action
     */
    public void logSuccess(
            AdminAuditLog.AdminActionType actionType,
            String resourceType,
            String resourceId,
            String actionDescription,
            Object stateBefore,
            Object stateAfter,
            HttpServletRequest request,
            Long durationMs) {
        
        logAction(actionType, resourceType, resourceId, actionDescription,
                stateBefore, stateAfter, request,
                AdminAuditLog.ActionResult.SUCCESS, null, durationMs);
    }

    /**
     * Log a failed admin action
     */
    public void logFailure(
            AdminAuditLog.AdminActionType actionType,
            String resourceType,
            String resourceId,
            String actionDescription,
            Object stateBefore,
            HttpServletRequest request,
            String errorMessage,
            Long durationMs) {
        
        logAction(actionType, resourceType, resourceId, actionDescription,
                stateBefore, null, request,
                AdminAuditLog.ActionResult.FAILURE, errorMessage, durationMs);
    }

    /**
     * Get audit logs with pagination
     */
    @Transactional(readOnly = true)
    public Page<AdminAuditLog> getAuditLogs(int page, int size) {
        return auditLogPort.findAll(page, size);
    }

    /**
     * Get audit logs by admin username
     */
    @Transactional(readOnly = true)
    public Page<AdminAuditLog> getAuditLogsByAdmin(String adminUsername, int page, int size) {
        return auditLogPort.findByAdminUsername(adminUsername, page, size);
    }

    /**
     * Get audit logs by action type
     */
    @Transactional(readOnly = true)
    public Page<AdminAuditLog> getAuditLogsByActionType(
            AdminAuditLog.AdminActionType actionType,
            int page,
            int size) {
        return auditLogPort.findByActionType(actionType, page, size);
    }

    /**
     * Get audit logs for a specific resource
     */
    @Transactional(readOnly = true)
    public Page<AdminAuditLog> getAuditLogsByResource(
            String resourceType,
            String resourceId,
            int page,
            int size) {
        return auditLogPort.findByResourceTypeAndResourceId(resourceType, resourceId, page, size);
    }

    /**
     * Get audit logs within date range
     */
    @Transactional(readOnly = true)
    public Page<AdminAuditLog> getAuditLogsByDateRange(
            LocalDateTime start,
            LocalDateTime end,
            int page,
            int size) {
        return auditLogPort.findByTimestampBetween(start, end, page, size);
    }

    /**
     * Get admin activity statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAdminActivityStatistics(LocalDateTime since) {
        List<Object[]> actionTypeStats = auditLogPort.getActionTypeStatistics(since);
        List<Object[]> suspiciousActivities = auditLogPort.findSuspiciousActivities(since, 10);

        return Map.of(
                "actionTypeStatistics", actionTypeStats,
                "suspiciousActivities", suspiciousActivities,
                "totalActions", auditLogPort.count(),
                "since", since,
                "generated", LocalDateTime.now());
    }

    /**
     * Get recent actions by current admin
     */
    @Transactional(readOnly = true)
    public Page<AdminAuditLog> getMyRecentActions(int page, int size) {
        String adminUsername = getCurrentAdminUsername();
        return auditLogPort.findRecentActionsByAdmin(adminUsername, page, size);
    }

    /**
     * Get current admin username from security context
     */
    private String getCurrentAdminUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "SYSTEM";
    }

    /**
     * Extract IP address from request
     */
    private String extractIpAddress(HttpServletRequest request) {
        if (request == null) {
            return "UNKNOWN";
        }

        // Check for proxy headers
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // X-Forwarded-For can contain multiple IPs, take the first one
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip != null ? ip : "UNKNOWN";
    }

    /**
     * Serialize state to JSON string
     */
    private String serializeState(Object state) {
        if (state == null) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(state);
        } catch (Exception e) {
            log.warn("Failed to serialize state: {}", e.getMessage());
            return state.toString();
        }
    }

    /**
     * Extract request parameters (sanitized)
     */
    private String extractRequestParams(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        try {
            Map<String, String[]> paramMap = request.getParameterMap();
            if (paramMap.isEmpty()) {
                return null;
            }

            // Sanitize: remove sensitive parameters
            Map<String, String[]> sanitized = new java.util.HashMap<>(paramMap);
            sanitized.remove("password");
            sanitized.remove("token");
            sanitized.remove("secret");

            return objectMapper.writeValueAsString(sanitized);
        } catch (Exception e) {
            log.warn("Failed to extract request params: {}", e.getMessage());
            return null;
        }
    }
}
