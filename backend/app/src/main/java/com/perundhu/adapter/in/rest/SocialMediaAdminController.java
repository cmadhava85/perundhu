package com.perundhu.adapter.in.rest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.domain.port.input.SocialMediaMonitoringInputPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for social media monitoring admin operations.
 * Follows Single Responsibility Principle - handles only social media operations.
 */
@RestController
@RequestMapping("/admin/social-media")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class SocialMediaAdminController {

    private final Optional<SocialMediaMonitoringInputPort> socialMediaMonitoringService;

    /**
     * Get social media monitoring statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getSocialMediaStats() {
        log.info("Request to get social media monitoring statistics");

        if (socialMediaMonitoringService.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "enabled", false,
                    "message", "Social media monitoring is not enabled"));
        }

        try {
            SocialMediaMonitoringInputPort.MonitoringStatistics stats = socialMediaMonitoringService.get()
                    .getStatistics();

            Map<String, Object> response = new HashMap<>();
            response.put("enabled", true);
            response.put("totalPostsMonitored", stats.getTotalPostsMonitored());
            response.put("totalContributionsCreated", stats.getTotalContributionsCreated());
            response.put("lastMonitoringTimestamp", stats.getLastMonitoringTimestamp());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting social media stats: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to get social media statistics: " + e.getMessage()));
        }
    }

    /**
     * Manually trigger social media monitoring
     */
    @PostMapping("/monitor")
    public ResponseEntity<?> triggerSocialMediaMonitoring() {
        log.info("Request to manually trigger social media monitoring");

        if (socialMediaMonitoringService.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Social media monitoring is not enabled"));
        }

        try {
            SocialMediaMonitoringInputPort.MonitoringResult result = socialMediaMonitoringService.get()
                    .monitorAllPlatforms();

            Map<String, Object> response = new HashMap<>();
            response.put("postsFound", result.getTotalPostsFound());
            response.put("contributionsCreated", result.getContributionsCreated());
            response.put("errors", result.getErrors());
            response.put("timestamp", LocalDateTime.now());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error triggering social media monitoring: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to trigger monitoring: " + e.getMessage()));
        }
    }
}
