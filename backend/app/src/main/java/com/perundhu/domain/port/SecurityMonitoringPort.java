package com.perundhu.domain.port;

import java.time.LocalDateTime;

/**
 * Port for security monitoring and threat detection
 */
public interface SecurityMonitoringPort {

    /**
     * Security event data record
     */
    record SecurityEventData(
            String clientId,
            String eventType,
            String severity,
            String description,
            String endpoint,
            String userAgent,
            LocalDateTime timestamp) {
    }

    /**
     * Record a security event
     */
    void recordSecurityEvent(SecurityEventData eventData);

    /**
     * Check if an IP address is blocked
     */
    boolean isIpBlocked(String ipAddress);

    /**
     * Block an IP address
     */
    void blockIpAddress(String ipAddress, String reason);

    /**
     * Unblock an IP address
     */
    void unblockIpAddress(String ipAddress);

    /**
     * Check rate limit for a client
     */
    boolean checkRateLimit(String clientId, String operation, int maxRequests, long windowMs);

    /**
     * Get security metrics
     */
    SecurityStats getSecurityStats();

    /**
     * Clean up old security data
     */
    void cleanupOldData();

    /**
     * Reset daily counters
     */
    void resetDailyCounters();

    /**
     * Security statistics interface - using record methods for compatibility
     */
    interface SecurityStats {
        int getActiveThreatProfiles();

        int getBlockedIps();

        int getActiveThreats();

        int getSuspiciousUserAgents();

        long getHighSeverityEvents();

        LocalDateTime getLastUpdated();

        // Record-style methods for backward compatibility
        default int activeThreatProfiles() {
            return getActiveThreatProfiles();
        }

        default int blockedIps() {
            return getBlockedIps();
        }

        default int activeThreats() {
            return getActiveThreats();
        }

        default int suspiciousUserAgents() {
            return getSuspiciousUserAgents();
        }

        default long highSeverityEvents() {
            return getHighSeverityEvents();
        }

        default int totalThreats() {
            return getActiveThreatProfiles() + getActiveThreats();
        }
    }
}