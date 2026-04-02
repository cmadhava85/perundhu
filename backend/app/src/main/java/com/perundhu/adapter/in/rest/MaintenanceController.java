package com.perundhu.adapter.in.rest;

import com.perundhu.application.service.SystemSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.availability.ApplicationAvailability;
import org.springframework.boot.availability.AvailabilityState;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Maintenance and health status controller for frontend maintenance page detection.
 * 
 * Provides a lightweight endpoint that the frontend can poll to determine:
 * 1. Is the backend available?
 * 2. Is the database reachable?
 * 3. Is maintenance mode manually enabled?
 * 4. Should we show a maintenance page?
 * 
 * This endpoint is designed to be cheap on Cloud Run:
 * - Minimal CPU usage (simple DB ping)
 * - No complex queries
 * - Fast response time
 * - Cacheable with short TTL
 */
@RestController
@RequestMapping("/api/v1/maintenance")
@RequiredArgsConstructor
@Slf4j
public class MaintenanceController {

  // Maintenance reason constants
  private static final String REASON_MANUAL_MAINTENANCE = "MANUAL_MAINTENANCE";
  private static final String REASON_DATABASE_UNAVAILABLE = "DATABASE_UNAVAILABLE";
  private static final String REASON_BACKEND_NOT_READY = "BACKEND_NOT_READY";
  private static final String REASON_HEALTH_CHECK_ERROR = "HEALTH_CHECK_ERROR";
  
  // Response field constants
  private static final String FIELD_MAINTENANCE = "maintenance";
  private static final String FIELD_REASON = "reason";
  private static final String FIELD_MESSAGE = "message";
  private static final String FIELD_DB_AVAILABLE = "dbAvailable";
  private static final String FIELD_BACKEND_READY = "backendReady";
  private static final String FIELD_TIMESTAMP = "timestamp";

  private final SystemSettingsService settingsService;
  private final JdbcTemplate jdbcTemplate;
  private final ApplicationAvailability applicationAvailability;

  /**
   * Check overall system health for maintenance page decision.
   * 
   * Returns:
   * - 200 OK: System operational, no maintenance needed
   * - 503 Service Unavailable: Should show maintenance page
   * 
   * Response includes:
   * - maintenance: boolean (true = show maintenance page)
   * - reason: string (why maintenance mode is active)
   * - dbAvailable: boolean (database connectivity status)
   * - backendReady: boolean (Spring Boot readiness state)
   * - estimatedRestoreTime: ISO 8601 timestamp (if known)
   * - message: user-friendly message
   */
  @GetMapping("/status")
  public ResponseEntity<Map<String, Object>> getMaintenanceStatus() {
    Map<String, Object> status = new HashMap<>();
    boolean inMaintenance = false;
    String reason = null;
    
    try {
      // Check 1: Manual maintenance mode via feature flag
      boolean maintenanceModeEnabled = settingsService.isFeatureEnabled("enableMaintenanceMode");
      if (maintenanceModeEnabled) {
        inMaintenance = true;
        reason = REASON_MANUAL_MAINTENANCE;
        log.debug("Maintenance mode manually enabled via feature flag");
      }
      
      // Check 2: Database connectivity (critical)
      boolean dbAvailable = checkDatabaseAvailability();
      status.put(FIELD_DB_AVAILABLE, dbAvailable);
      
      if (!dbAvailable && !inMaintenance) {
        inMaintenance = true;
        reason = REASON_DATABASE_UNAVAILABLE;
        log.warn("Database unavailable, triggering maintenance mode");
      }
      
      // Check 3: Spring Boot readiness state
      AvailabilityState readinessState = applicationAvailability.getReadinessState();
      boolean backendReady = readinessState == ReadinessState.ACCEPTING_TRAFFIC;
      status.put(FIELD_BACKEND_READY, backendReady);
      
      if (!backendReady && !inMaintenance) {
        inMaintenance = true;
        reason = REASON_BACKEND_NOT_READY;
        log.warn("Backend not ready, triggering maintenance mode");
      }
      
      // Build response
      status.put(FIELD_MAINTENANCE, inMaintenance);
      status.put(FIELD_REASON, reason);
      status.put(FIELD_TIMESTAMP, Instant.now().toString());
      
      if (inMaintenance) {
        status.put(FIELD_MESSAGE, getUserFriendlyMessage(reason));
        // Optional: Add estimated restore time from system_settings
        String estimatedRestoreTime = settingsService.getSettingValue("maintenanceEstimatedRestoreTime", null);
        if (estimatedRestoreTime != null && !estimatedRestoreTime.isEmpty()) {
          status.put("estimatedRestoreTime", estimatedRestoreTime);
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(status);
      }
      
      status.put(FIELD_MESSAGE, "All systems operational");
      return ResponseEntity.ok(status);
      
    } catch (Exception e) {
      log.error("Error checking maintenance status, defaulting to maintenance mode", e);
      status.put(FIELD_MAINTENANCE, true);
      status.put(FIELD_REASON, REASON_HEALTH_CHECK_ERROR);
      status.put(FIELD_DB_AVAILABLE, false);
      status.put(FIELD_BACKEND_READY, false);
      status.put(FIELD_MESSAGE, getUserFriendlyMessage(REASON_HEALTH_CHECK_ERROR));
      status.put(FIELD_TIMESTAMP, Instant.now().toString());
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(status);
    }
  }

  /**
   * Lightweight database availability check.
   * Uses a simple SELECT 1 query that doesn't hit any tables.
   * This is cheaper than checking actual table connectivity.
   */
  private boolean checkDatabaseAvailability() {
    try {
      jdbcTemplate.queryForObject("SELECT 1", Integer.class);
      return true;
    } catch (Exception e) {
      log.error("Database availability check failed", e);
      return false;
    }
  }

  /**
   * Get user-friendly message based on maintenance reason.
   * 
   * Messages are intentionally generic (e.g., "technical difficulties" instead of
   * "database error") to avoid exposing internal infrastructure details to users.
   * This provides a better user experience and maintains security best practices.
   */
  private String getUserFriendlyMessage(String reason) {
    if (reason == null) {
      return "System is under maintenance. Please check back shortly.";
    }
    
    return switch (reason) {
      case REASON_MANUAL_MAINTENANCE -> "We're performing scheduled maintenance to improve your experience. We'll be back soon!";
      case REASON_DATABASE_UNAVAILABLE -> "We're experiencing technical difficulties. Our team is working to restore service.";
      case REASON_BACKEND_NOT_READY -> "The service is starting up. Please wait a moment and try again.";
      case REASON_HEALTH_CHECK_ERROR -> "We're experiencing technical difficulties. Please try again in a few minutes.";
      default -> "System is under maintenance. Please check back shortly.";
    };
  }

  /**
   * Admin endpoint to manually trigger maintenance mode.
   * This is a convenience endpoint that updates the feature flag.
   * 
   * @param enable true to enable maintenance mode, false to disable
   */
  @GetMapping("/admin/toggle")
  public ResponseEntity<Map<String, Object>> toggleMaintenanceMode(
      @org.springframework.web.bind.annotation.RequestParam(required = false, defaultValue = "true") boolean enable) {
    
    try {
      // This should be protected by admin auth (add @PreAuthorize if needed)
      settingsService.updateSetting("enableMaintenanceMode", enable ? "true" : "false");
      
      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("maintenanceMode", enable);
      response.put("message", enable ? "Maintenance mode enabled" : "Maintenance mode disabled");
      
      log.info("Maintenance mode {} by admin", enable ? "enabled" : "disabled");
      return ResponseEntity.ok(response);
      
    } catch (Exception e) {
      log.error("Failed to toggle maintenance mode", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", "Failed to update maintenance mode", "details", e.getMessage()));
    }
  }
}
