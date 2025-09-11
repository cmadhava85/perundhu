package com.perundhu.application.service;

import com.perundhu.domain.port.SecurityMonitoringPort;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Application service implementing security monitoring domain port
 * Handles real-time threat detection and automated security responses
 */
@Service
@Slf4j
public class SecurityMonitoringService implements SecurityMonitoringPort {

  private static final Logger log = LoggerFactory.getLogger(SecurityMonitoringService.class);
  private static final Logger auditLogger = LoggerFactory.getLogger("SECURITY_AUDIT");

  private final boolean monitoringEnabled;
  private final int alertThreshold;
  private final int blockAfterViolations;

  // Threat tracking
  private final ConcurrentHashMap<String, ThreatProfile> threatProfiles = new ConcurrentHashMap<>();
  private final Set<String> blockedIps = ConcurrentHashMap.newKeySet();
  private final Set<String> suspiciousUserAgents = ConcurrentHashMap.newKeySet();
  private final AtomicInteger totalThreats = new AtomicInteger(0);

  public SecurityMonitoringService(
      @Value("${security.monitoring.enabled:true}") boolean monitoringEnabled,
      @Value("${security.monitoring.alert-threshold:100}") int alertThreshold,
      @Value("${security.monitoring.block-after-violations:5}") int blockAfterViolations) {

    this.monitoringEnabled = monitoringEnabled;
    this.alertThreshold = alertThreshold;
    this.blockAfterViolations = blockAfterViolations;

    log.info("Security monitoring initialized: enabled={}, alertThreshold={}, blockAfterViolations={}",
        monitoringEnabled, alertThreshold, blockAfterViolations);
  }

  @Override
  public void recordSecurityEvent(SecurityEventData event) {
    if (!monitoringEnabled) {
      return;
    }

    log.info("Security event recorded: {} - {}", event.eventType(), event.description());

    // Convert domain event to internal structure
    SecurityEvent internalEvent = new SecurityEvent(
        event.clientId(),
        SecurityEventType.valueOf(event.eventType()),
        SecurityEventSeverity.valueOf(event.severity()),
        event.description(),
        event.endpoint(),
        event.userAgent(),
        event.timestamp());

    recordInternalSecurityEvent(internalEvent);
  }

  @Override
  public boolean isIpBlocked(String ip) {
    return blockedIps.contains(ip);
  }

  @Override
  public void blockIpAddress(String ip, String reason) {
    blockedIps.add(ip);
    log.warn("Manually blocked IP: {} | Reason: {}", ip, reason);
    auditLogger.warn("IP_BLOCKED: {} | IP: {} | Reason: {}",
        LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME), ip, reason);
  }

  @Override
  public void unblockIpAddress(String ip) {
    blockedIps.remove(ip);
    log.info("Unblocked IP: {}", ip);
    auditLogger.info("IP_UNBLOCKED: {} | IP: {}",
        LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME), ip);
  }

  @Override
  public boolean checkRateLimit(String clientId, String operation, int maxRequests, long windowMs) {
    // Simple rate limiting implementation
    return true; // Simplified for now
  }

  @Override
  public SecurityMonitoringPort.SecurityStats getSecurityStats() {
    return new SecurityStats(
        threatProfiles.size(),
        blockedIps.size(),
        (int) threatProfiles.values().stream().filter(ThreatProfile::isActive).count(),
        suspiciousUserAgents.size(),
        countHighSeverityEvents(),
        LocalDateTime.now());
  }

  @Override
  public void cleanupOldData() {
    if (!monitoringEnabled) {
      return;
    }

    long currentTime = System.currentTimeMillis();
    long oneHourAgo = currentTime - 3600000;

    // Remove old threat profiles
    threatProfiles.entrySet().removeIf(entry -> entry.getValue().getLastActivity() < oneHourAgo);

    // Remove old temporary blocks
    int removedBlocks = blockedIps.size();
    blockedIps.removeIf(ip -> shouldUnblockIp(ip, currentTime));
    removedBlocks -= blockedIps.size();

    if (removedBlocks > 0) {
      log.info("Cleaned up {} old blocked IPs and {} threat profiles",
          removedBlocks, threatProfiles.size());
    }
  }

  @Override
  public void resetDailyCounters() {
    totalThreats.set(0);
    log.info("Resetting daily security counters");
  }

  // Internal methods for backward compatibility

  public void recordInternalSecurityEvent(SecurityEvent event) {
    if (!monitoringEnabled) {
      return;
    }

    try {
      String clientId = event.getClientId();
      ThreatProfile profile = threatProfiles.computeIfAbsent(clientId, k -> new ThreatProfile(clientId));

      profile.recordEvent(event);
      totalThreats.incrementAndGet();

      // Log the security event
      auditLogger.info("SECURITY_EVENT: {} | Client: {} | Type: {} | Severity: {} | Details: {}",
          LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
          clientId, event.getEventType(), event.getSeverity(), event.getDetails());

      // Check if we need to take action
      if (shouldBlockClient(profile)) {
        blockClient(clientId, "Exceeded security violation threshold");
      }

      // Generate alerts for high-severity events
      if (event.getSeverity() == SecurityEventSeverity.HIGH ||
          event.getSeverity() == SecurityEventSeverity.CRITICAL) {
        generateSecurityAlert(event, profile);
      }

    } catch (Exception e) {
      log.error("Error recording security event", e);
    }
  }

  public boolean isSuspiciousUserAgent(String userAgent) {
    if (userAgent == null)
      return true;

    String ua = userAgent.toLowerCase();
    return suspiciousUserAgents.stream().anyMatch(ua::contains);
  }

  @Async
  public void recordDataAccess(String userId, String endpoint, String dataType, boolean authorized) {
    if (!monitoringEnabled) {
      return;
    }

    auditLogger.info("DATA_ACCESS: {} | User: {} | Endpoint: {} | DataType: {} | Authorized: {}",
        LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
        userId, endpoint, dataType, authorized);

    if (!authorized) {
      recordInternalSecurityEvent(new SecurityEvent(
          userId,
          SecurityEventType.UNAUTHORIZED_ACCESS,
          SecurityEventSeverity.HIGH,
          "Unauthorized access attempt to " + endpoint,
          endpoint,
          null,
          LocalDateTime.now()));
    }
  }

  // Private helper methods
  private boolean shouldBlockClient(ThreatProfile profile) {
    return profile.getViolationCount() >= blockAfterViolations ||
        profile.hasHighSeverityEvents() >= 3;
  }

  private void blockClient(String clientId, String reason) {
    blockedIps.add(clientId);
    log.warn("Blocked client: {} | Reason: {}", clientId, reason);
    auditLogger.warn("CLIENT_BLOCKED: {} | Client: {} | Reason: {}",
        LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME), clientId, reason);
  }

  @Async
  private void generateSecurityAlert(SecurityEvent event, ThreatProfile profile) {
    log.error("SECURITY ALERT: {} | Client: {} | Profile violations: {} | Event: {}",
        event.getSeverity(), event.getClientId(), profile.getViolationCount(), event.getDetails());

    auditLogger.error("SECURITY_ALERT: {} | Client: {} | Type: {} | Severity: {} | Details: {}",
        LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME),
        event.getClientId(), event.getEventType(), event.getSeverity(), event.getDetails());
  }

  private long countHighSeverityEvents() {
    return threatProfiles.values().stream()
        .mapToLong(ThreatProfile::hasHighSeverityEvents)
        .sum();
  }

  private boolean shouldUnblockIp(String ip, long currentTime) {
    return false; // Simplified - implement proper logic based on block reason
  }

  // Supporting inner classes
  public static class SecurityEvent {
    private final String clientId;
    private final SecurityEventType eventType;
    private final SecurityEventSeverity severity;
    private final String details;
    private final String endpoint;
    private final String userAgent;
    private final LocalDateTime timestamp;

    public SecurityEvent(String clientId, SecurityEventType eventType, SecurityEventSeverity severity,
        String details, String endpoint, String userAgent, LocalDateTime timestamp) {
      this.clientId = clientId;
      this.eventType = eventType;
      this.severity = severity;
      this.details = details;
      this.endpoint = endpoint;
      this.userAgent = userAgent;
      this.timestamp = timestamp;
    }

    // Getters
    public String getClientId() {
      return clientId;
    }

    public SecurityEventType getEventType() {
      return eventType;
    }

    public SecurityEventSeverity getSeverity() {
      return severity;
    }

    public String getDetails() {
      return details;
    }

    public String getEndpoint() {
      return endpoint;
    }

    public String getUserAgent() {
      return userAgent;
    }

    public LocalDateTime getTimestamp() {
      return timestamp;
    }
  }

  public enum SecurityEventType {
    RATE_LIMIT_VIOLATION,
    UNAUTHORIZED_ACCESS,
    SCRAPING_ATTEMPT,
    SUSPICIOUS_USER_AGENT,
    INVALID_JWT,
    IP_BLOCKED,
    DATA_BREACH_ATTEMPT,
    VALIDATION_FAILURE,
    DATA_SUBMISSION,
    PROCESSING_ERROR,
    MALICIOUS_CONTENT
  }

  public enum SecurityEventSeverity {
    LOW, MEDIUM, HIGH, CRITICAL, INFO
  }

  private static class ThreatProfile {
    private final String clientId;
    private int violationCount = 0;
    private long lastActivity = System.currentTimeMillis();
    private long highSeverityEvents = 0;

    public ThreatProfile(String clientId) {
      this.clientId = clientId;
    }

    public void recordEvent(SecurityEvent event) {
      this.violationCount++;
      this.lastActivity = System.currentTimeMillis();
      if (event.getSeverity() == SecurityEventSeverity.HIGH ||
          event.getSeverity() == SecurityEventSeverity.CRITICAL) {
        this.highSeverityEvents++;
      }
    }

    public boolean isActive() {
      return System.currentTimeMillis() - lastActivity < 3600000; // 1 hour
    }

    public int getViolationCount() {
      return violationCount;
    }

    public long getLastActivity() {
      return lastActivity;
    }

    public long hasHighSeverityEvents() {
      return highSeverityEvents;
    }
  }

  /**
   * Security statistics data class
   */
  public static class SecurityStats implements SecurityMonitoringPort.SecurityStats {
    private final int activeThreatProfiles;
    private final int blockedIps;
    private final int activeThreats;
    private final int suspiciousUserAgents;
    private final long highSeverityEvents;
    private final LocalDateTime lastUpdated;

    public SecurityStats(int activeThreatProfiles, int blockedIps, int activeThreats,
        int suspiciousUserAgents, long highSeverityEvents, LocalDateTime lastUpdated) {
      this.activeThreatProfiles = activeThreatProfiles;
      this.blockedIps = blockedIps;
      this.activeThreats = activeThreats;
      this.suspiciousUserAgents = suspiciousUserAgents;
      this.highSeverityEvents = highSeverityEvents;
      this.lastUpdated = lastUpdated;
    }

    // Getters implementing the interface
    @Override
    public int getActiveThreatProfiles() {
      return activeThreatProfiles;
    }

    @Override
    public int getBlockedIps() {
      return blockedIps;
    }

    @Override
    public int getActiveThreats() {
      return activeThreats;
    }

    @Override
    public int getSuspiciousUserAgents() {
      return suspiciousUserAgents;
    }

    @Override
    public long getHighSeverityEvents() {
      return highSeverityEvents;
    }

    @Override
    public LocalDateTime getLastUpdated() {
      return lastUpdated;
    }
  }
}