package com.perundhu.domain.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Domain model for admin audit logs
 * Tracks all administrative actions for security, compliance, and debugging
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLog {

    /**
     * Unique identifier for the audit log entry
     */
    private String id;

    /**
     * Admin username who performed the action
     */
    private String adminUsername;

    /**
     * IP address from which the action was performed
     */
    private String ipAddress;

    /**
     * Type of admin action performed
     */
    private AdminActionType actionType;

    /**
     * Resource type being acted upon (e.g., "RouteContribution", "ImageContribution", "SystemSetting")
     */
    private String resourceType;

    /**
     * ID of the specific resource being acted upon
     */
    private String resourceId;

    /**
     * Description of the action performed
     */
    private String actionDescription;

    /**
     * State before the action (JSON format)
     */
    private String stateBefore;

    /**
     * State after the action (JSON format)
     */
    private String stateAfter;

    /**
     * HTTP method used (GET, POST, PUT, DELETE)
     */
    private String httpMethod;

    /**
     * Request URI
     */
    private String requestUri;

    /**
     * Request parameters (sanitized - no sensitive data)
     */
    private String requestParams;

    /**
     * Response status code
     */
    private Integer responseStatus;

    /**
     * Action result (SUCCESS, FAILURE, PARTIAL)
     */
    private ActionResult result;

    /**
     * Error message if action failed
     */
    private String errorMessage;

    /**
     * Timestamp when the action was performed
     */
    private LocalDateTime timestamp;

    /**
     * Duration of the action in milliseconds
     */
    private Long durationMs;

    /**
     * User agent string from the request
     */
    private String userAgent;

    /**
     * Session ID for tracking user sessions
     */
    private String sessionId;

    /**
     * Additional metadata as JSON
     */
    private String metadata;

    /**
     * Enum for different types of admin actions
     */
    public enum AdminActionType {
        // Contribution Management
        CONTRIBUTION_APPROVE,
        CONTRIBUTION_REJECT,
        CONTRIBUTION_DELETE,
        CONTRIBUTION_REPROCESS,
        CONTRIBUTION_OCR_EXTRACT,
        
        // Bus Management
        BUS_UPDATE_TIMING,
        BUS_UPDATE_DETAILS,
        BUS_ACTIVATE,
        BUS_DEACTIVATE,
        BUS_DELETE,
        
        // Settings Management
        SETTING_UPDATE,
        SETTING_CREATE,
        SETTING_DELETE,
        SETTING_RESET,
        FEATURE_FLAG_UPDATE,
        FEATURE_FLAGS_RESET,
        
        // Security Management
        IP_BLOCK,
        IP_UNBLOCK,
        SECURITY_CONFIG_UPDATE,
        
        // User Management
        USER_ROLE_UPDATE,
        USER_SUSPEND,
        USER_REACTIVATE,
        USER_DELETE,
        
        // Announcement Management
        ANNOUNCEMENT_CREATE,
        ANNOUNCEMENT_UPDATE,
        ANNOUNCEMENT_DELETE,
        ANNOUNCEMENT_PUBLISH,
        ANNOUNCEMENT_UNPUBLISH,
        
        // Route Issue Management
        ROUTE_ISSUE_STATUS_UPDATE,
        ROUTE_ISSUE_PRIORITY_UPDATE,
        ROUTE_ISSUE_RESOLVE,
        
        // Authentication
        ADMIN_LOGIN,
        ADMIN_LOGOUT,
        ADMIN_LOGIN_FAILED,
        
        // System Operations
        BULK_OPERATION,
        DATA_EXPORT,
        DATA_IMPORT,
        SYSTEM_CONFIG_CHANGE,
        
        // Other
        OTHER
    }

    /**
     * Enum for action results
     */
    public enum ActionResult {
        SUCCESS,
        FAILURE,
        PARTIAL_SUCCESS
    }

    /**
     * Create a new audit log entry
     */
    public static AdminAuditLog create(
            String adminUsername,
            String ipAddress,
            AdminActionType actionType,
            String resourceType,
            String resourceId,
            String actionDescription) {
        return AdminAuditLog.builder()
                .adminUsername(adminUsername)
                .ipAddress(ipAddress)
                .actionType(actionType)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .actionDescription(actionDescription)
                .timestamp(LocalDateTime.now())
                .result(ActionResult.SUCCESS)
                .build();
    }
}
