-- Create admin_audit_logs table for comprehensive audit trail
-- This table tracks all administrative actions for security, compliance, and debugging

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
    admin_username VARCHAR(100) NOT NULL COLLATE utf8mb4_unicode_ci,
    ip_address VARCHAR(50) COLLATE utf8mb4_unicode_ci,
    action_type VARCHAR(50) NOT NULL COLLATE utf8mb4_unicode_ci,
    resource_type VARCHAR(100) COLLATE utf8mb4_unicode_ci,
    resource_id VARCHAR(100) COLLATE utf8mb4_unicode_ci,
    action_description VARCHAR(500) COLLATE utf8mb4_unicode_ci,
    state_before TEXT COLLATE utf8mb4_unicode_ci,
    state_after TEXT COLLATE utf8mb4_unicode_ci,
    http_method VARCHAR(10) COLLATE utf8mb4_unicode_ci,
    request_uri VARCHAR(500) COLLATE utf8mb4_unicode_ci,
    request_params TEXT COLLATE utf8mb4_unicode_ci,
    response_status INT,
    result VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' COLLATE utf8mb4_unicode_ci,
    error_message TEXT COLLATE utf8mb4_unicode_ci,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    duration_ms BIGINT,
    user_agent VARCHAR(500) COLLATE utf8mb4_unicode_ci,
    session_id VARCHAR(100) COLLATE utf8mb4_unicode_ci,
    metadata TEXT COLLATE utf8mb4_unicode_ci,
    INDEX idx_admin_audit_username (admin_username),
    INDEX idx_admin_audit_action_type (action_type),
    INDEX idx_admin_audit_timestamp (timestamp),
    INDEX idx_admin_audit_resource (resource_type, resource_id),
    INDEX idx_admin_audit_ip (ip_address),
    INDEX idx_admin_audit_result (result),
    INDEX idx_admin_audit_session (session_id),
    INDEX idx_admin_audit_user_time (admin_username, timestamp),
    INDEX idx_admin_audit_action_time (action_type, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Comprehensive audit trail of all administrative actions';
