-- V100_add_api_rate_limiting_table.sql
-- Creates table for tracking API rate limits and suspicious activity

CREATE TABLE IF NOT EXISTS api_rate_limit (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    client_ip VARCHAR(45) NOT NULL COMMENT 'IPv4 or IPv6 address',
    endpoint VARCHAR(255) NOT NULL COMMENT 'API endpoint path',
    request_count INT DEFAULT 1 COMMENT 'Number of requests in current window',
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Start of current rate limit window',
    last_request TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Timestamp of last request',
    status ENUM('ACTIVE', 'BLOCKED', 'SUSPENDED') DEFAULT 'ACTIVE' COMMENT 'Rate limit status',
    reason VARCHAR(255) COMMENT 'Reason for blocking (optional)',
    
    UNIQUE KEY uk_ip_endpoint (client_ip, endpoint),
    INDEX idx_window_start (window_start),
    INDEX idx_last_request (last_request),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='API rate limiting tracking table';

-- Create table for suspicious activity logging
CREATE TABLE IF NOT EXISTS suspicious_activity (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    client_ip VARCHAR(45) NOT NULL COMMENT 'Client IP address',
    user_agent VARCHAR(500) COMMENT 'User-Agent header',
    endpoint VARCHAR(255) NOT NULL COMMENT 'Requested endpoint',
    reason VARCHAR(100) NOT NULL COMMENT 'Reason for suspicion (e.g., BLOCKED_UA, RATE_LIMIT, etc)',
    request_count INT DEFAULT 1 COMMENT 'Number of suspicious attempts',
    first_occurrence TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_occurrence TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'LOW' COMMENT 'Severity level',
    is_blocked BOOLEAN DEFAULT FALSE COMMENT 'Whether IP is currently blocked',
    block_expiry TIMESTAMP NULL COMMENT 'When the block expires',
    
    INDEX idx_client_ip (client_ip),
    INDEX idx_reason (reason),
    INDEX idx_severity (severity),
    INDEX idx_last_occurrence (last_occurrence),
    INDEX idx_is_blocked (is_blocked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Suspicious activity logging table';

-- Create index for cleanup queries
CREATE INDEX idx_cleanup ON api_rate_limit(window_start) 
WHERE status = 'ACTIVE';

-- Create stored procedure for cleaning up old rate limit records (optional but recommended)
DELIMITER //
CREATE PROCEDURE cleanup_rate_limits()
BEGIN
    -- Delete rate limit records older than 24 hours
    DELETE FROM api_rate_limit 
    WHERE window_start < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    AND status = 'ACTIVE';
    
    -- Update expired blocks
    UPDATE suspicious_activity
    SET is_blocked = FALSE
    WHERE is_blocked = TRUE
    AND block_expiry < NOW();
    
    -- Log cleanup activity
    INSERT INTO suspicious_activity (client_ip, reason, severity, is_blocked)
    VALUES ('0.0.0.0', 'SCHEDULED_CLEANUP', 'LOW', FALSE);
END //
DELIMITER ;
