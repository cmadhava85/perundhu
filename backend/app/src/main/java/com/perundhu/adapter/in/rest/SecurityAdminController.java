package com.perundhu.adapter.in.rest;

import com.perundhu.domain.port.SecurityMonitoringPort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Admin controller for security monitoring and threat management
 * Provides real-time security statistics and management capabilities
 */
@RestController
@RequestMapping("/api/admin/security")
@PreAuthorize("hasRole('ADMIN')")
public class SecurityAdminController {

  private static final Logger logger = LoggerFactory.getLogger(SecurityAdminController.class);
  private final SecurityMonitoringPort securityService;

  public SecurityAdminController(SecurityMonitoringPort securityService) {
    this.securityService = securityService;
  }

  /**
   * Get real-time security statistics
   */
  @GetMapping("/stats")
  public ResponseEntity<SecurityMonitoringPort.SecurityStats> getSecurityStats() {
    logger.info("Admin accessing security statistics");
    try {
      SecurityMonitoringPort.SecurityStats stats = securityService.getSecurityStats();
      return ResponseEntity.ok(stats);
    } catch (Exception e) {
      logger.error("Error getting security stats", e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Manually block an IP address
   */
  @PostMapping("/block-ip")
  public ResponseEntity<String> blockIpAddress(
      @RequestParam String ip,
      @RequestParam String reason) {
    logger.warn("Admin blocking IP: {} | Reason: {}", ip, reason);
    try {
      securityService.blockIpAddress(ip, reason);
      return ResponseEntity.ok("IP address blocked successfully");
    } catch (Exception e) {
      logger.error("Error blocking IP: {}", ip, e);
      return ResponseEntity.internalServerError()
          .body("Failed to block IP address");
    }
  }

  /**
   * Unblock an IP address
   */
  @PostMapping("/unblock-ip")
  public ResponseEntity<String> unblockIpAddress(@RequestParam String ip) {
    logger.info("Admin unblocking IP: {}", ip);
    try {
      securityService.unblockIpAddress(ip);
      return ResponseEntity.ok("IP address unblocked successfully");
    } catch (Exception e) {
      logger.error("Error unblocking IP: {}", ip, e);
      return ResponseEntity.internalServerError()
          .body("Failed to unblock IP address");
    }
  }
}