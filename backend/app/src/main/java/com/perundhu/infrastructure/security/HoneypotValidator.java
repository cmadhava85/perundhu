package com.perundhu.infrastructure.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Honeypot validation service to detect bot submissions
 * Adds invisible fields that bots typically fill but humans don't see
 */
@Component
public class HoneypotValidator {

  private static final Logger log = LoggerFactory.getLogger(HoneypotValidator.class);

  @Value("${security.honeypot.enabled:true}")
  private boolean honeypotEnabled;

  // Track suspicious IPs with timestamp for cleanup
  private final Map<String, SuspiciousEntry> suspiciousIpCount = new ConcurrentHashMap<>();

  // Maximum entries to prevent memory exhaustion
  private static final int MAX_SUSPICIOUS_IPS = 10000;

  // Entry TTL (1 hour)
  private static final long ENTRY_TTL_MS = TimeUnit.HOURS.toMillis(1);

  // Honeypot field names (should match frontend hidden fields)
  private static final String[] HONEYPOT_FIELDS = {
      "website", // Classic honeypot field
      "phone_number", // Bots often fill phone fields
      "fax", // Nobody uses fax anymore
      "company_url", // Another classic trap
      "hp_field" // Generic honeypot
  };

  // Time-based validation fields
  private static final long MIN_SUBMISSION_TIME_MS = 3000; // 3 seconds minimum
  private static final long MAX_SUBMISSION_TIME_MS = 3600000; // 1 hour maximum

  /**
   * Validate submission for honeypot traps and suspicious patterns
   *
   * @param formData       The form data map
   * @param clientIp       Client IP address
   * @param submissionTime Timestamp when form was loaded (from frontend)
   * @return ValidationResult with isValid flag and reason
   */
  public ValidationResult validate(Map<String, Object> formData, String clientIp, Long submissionTime) {
    if (!honeypotEnabled) {
      return ValidationResult.valid();
    }

    // Check honeypot fields
    for (String field : HONEYPOT_FIELDS) {
      if (formData.containsKey(field)) {
        Object value = formData.get(field);
        if (value != null && !value.toString().trim().isEmpty()) {
          log.warn("Honeypot triggered - field: {}, IP: {}", field, clientIp);
          recordSuspiciousIp(clientIp);
          return ValidationResult.invalid("Bot detected: honeypot field filled");
        }
      }
    }

    // Time-based validation
    if (submissionTime != null) {
      long now = System.currentTimeMillis();
      long elapsed = now - submissionTime;

      // Too fast - likely a bot
      if (elapsed < MIN_SUBMISSION_TIME_MS) {
        log.warn("Submission too fast - elapsed: {}ms, IP: {}", elapsed, clientIp);
        recordSuspiciousIp(clientIp);
        return ValidationResult.invalid("Submission too fast - please slow down");
      }

      // Too slow - form might be stale or replay attack
      if (elapsed > MAX_SUBMISSION_TIME_MS) {
        log.warn("Submission too old - elapsed: {}ms, IP: {}", elapsed, clientIp);
        return ValidationResult.invalid("Form expired - please refresh and try again");
      }
    }

    // Check for repeated suspicious behavior
    if (isSuspiciousIp(clientIp)) {
      log.warn("Suspicious IP detected: {}", clientIp);
      return ValidationResult.invalid("Too many suspicious requests from this IP");
    }

    return ValidationResult.valid();
  }

  /**
   * Quick check if a simple field set contains honeypot values
   */
  public boolean containsHoneypotValues(Map<String, Object> data) {
    if (!honeypotEnabled) {
      return false;
    }

    for (String field : HONEYPOT_FIELDS) {
      if (data.containsKey(field)) {
        Object value = data.get(field);
        if (value != null && !value.toString().trim().isEmpty()) {
          return true;
        }
      }
    }
    return false;
  }

  private void recordSuspiciousIp(String clientIp) {
    // Prevent unbounded growth
    if (suspiciousIpCount.size() >= MAX_SUSPICIOUS_IPS) {
      cleanupOldEntries();
    }

    suspiciousIpCount.compute(clientIp, (k, v) -> {
      if (v == null) {
        return new SuspiciousEntry(1, System.currentTimeMillis());
      }
      return new SuspiciousEntry(v.count + 1, System.currentTimeMillis());
    });
  }

  private boolean isSuspiciousIp(String clientIp) {
    SuspiciousEntry entry = suspiciousIpCount.get(clientIp);
    if (entry == null)
      return false;

    // Check if entry is expired
    if (System.currentTimeMillis() - entry.timestamp > ENTRY_TTL_MS) {
      suspiciousIpCount.remove(clientIp);
      return false;
    }

    return entry.count >= 3; // Block after 3 suspicious attempts
  }

  /**
   * Scheduled cleanup of old entries (runs every 30 minutes)
   */
  @Scheduled(fixedRate = 1800000)
  public void cleanupOldEntries() {
    long now = System.currentTimeMillis();
    int before = suspiciousIpCount.size();
    suspiciousIpCount.entrySet().removeIf(e -> now - e.getValue().timestamp > ENTRY_TTL_MS);
    int removed = before - suspiciousIpCount.size();
    if (removed > 0) {
      log.debug("Honeypot cleanup: removed {} expired entries, remaining: {}", removed, suspiciousIpCount.size());
    }
  }

  /**
   * Reset suspicious IP tracking (called periodically)
   */
  public void resetSuspiciousIps() {
    suspiciousIpCount.clear();
  }

  /**
   * Get honeypot field names for frontend to include
   */
  public String[] getHoneypotFieldNames() {
    return HONEYPOT_FIELDS.clone();
  }

  /**
   * Validation result
   */
  public static class ValidationResult {
    private final boolean valid;
    private final String reason;

    private ValidationResult(boolean valid, String reason) {
      this.valid = valid;
      this.reason = reason;
    }

    public static ValidationResult valid() {
      return new ValidationResult(true, null);
    }

    public static ValidationResult invalid(String reason) {
      return new ValidationResult(false, reason);
    }

    public boolean isValid() {
      return valid;
    }

    public String getReason() {
      return reason;
    }
  }

  /**
   * Entry to track suspicious IP with timestamp
   */
  private static class SuspiciousEntry {
    final int count;
    final long timestamp;

    SuspiciousEntry(int count, long timestamp) {
      this.count = count;
      this.timestamp = timestamp;
    }
  }
}
