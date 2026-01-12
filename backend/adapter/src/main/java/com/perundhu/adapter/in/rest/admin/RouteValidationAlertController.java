package com.perundhu.adapter.in.rest.admin;

import com.perundhu.adapter.out.persistence.contribution.RouteValidationAlertJpaEntity;
import com.perundhu.application.service.RouteValidationAlertService;
import com.perundhu.domain.port.RoutingValidationPort;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for admin validation alert management.
 * Provides endpoints for:
 * - Viewing pending validation alerts
 * - Reviewing and approving/dismissing alerts
 * - Analyzing validation statistics
 *
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/api/v1/admin/validation-alerts")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Route Validation Alerts", description = "Manage and review route validation alerts")
@SecurityRequirement(name = "bearer")
public class RouteValidationAlertController {
    
    private final RouteValidationAlertService alertService;
    
    /**
     * Get all pending validation alerts with pagination.
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get pending validation alerts", 
            description = "Retrieves all alerts awaiting admin review, sorted by confidence score")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Alerts retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions")
    })
    public ResponseEntity<Page<RouteValidationAlertDTO>> getPendingAlerts(
            @ParameterObject Pageable pageable
    ) {
        Page<RouteValidationAlertJpaEntity> alerts = alertService.getPendingAlerts(pageable);
        return ResponseEntity.ok(alerts.map(RouteValidationAlertDTO::fromEntity));
    }
    
    /**
     * Get high-confidence alerts (> 75).
     * These are most likely to represent actual data quality issues.
     */
    @GetMapping("/high-confidence")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get high-confidence alerts",
            description = "Retrieves alerts with confidence score > 75, indicating likely issues")
    public ResponseEntity<List<RouteValidationAlertDTO>> getHighConfidenceAlerts() {
        List<RouteValidationAlertJpaEntity> alerts = alertService.getHighConfidenceAlerts();
        return ResponseEntity.ok(
                alerts.stream().map(RouteValidationAlertDTO::fromEntity).toList()
        );
    }
    
    /**
     * Get alerts for a specific contribution.
     */
    @GetMapping("/contribution/{contributionId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get alerts for contribution",
            description = "Retrieves all validation alerts associated with a specific contribution")
    public ResponseEntity<List<RouteValidationAlertDTO>> getAlertsByContribution(
            @PathVariable UUID contributionId
    ) {
        List<RouteValidationAlertJpaEntity> alerts = alertService.getAlertsByContribution(contributionId);
        return ResponseEntity.ok(
                alerts.stream().map(RouteValidationAlertDTO::fromEntity).toList()
        );
    }
    
    /**
     * Get alerts by validation type.
     */
    @GetMapping("/by-type/{validationType}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get alerts by validation type",
            description = "Retrieves all alerts of a specific validation type")
    public ResponseEntity<List<RouteValidationAlertDTO>> getAlertsByType(
            @PathVariable RoutingValidationPort.ValidationType validationType
    ) {
        List<RouteValidationAlertJpaEntity> alerts = alertService.getAlertsByType(validationType);
        return ResponseEntity.ok(
                alerts.stream().map(RouteValidationAlertDTO::fromEntity).toList()
        );
    }
    
    /**
     * Get alerts created within the last N hours.
     */
    @GetMapping("/recent")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get recent alerts",
            description = "Retrieves alerts created within the specified number of hours")
    public ResponseEntity<List<RouteValidationAlertDTO>> getRecentAlerts(
            @RequestParam(defaultValue = "24") int hoursAgo
    ) {
        List<RouteValidationAlertJpaEntity> alerts = alertService.getAlertsSince(hoursAgo);
        return ResponseEntity.ok(
                alerts.stream().map(RouteValidationAlertDTO::fromEntity).toList()
        );
    }
    
    /**
     * Approve an alert (contribution accepted despite validation flag).
     */
    @PostMapping("/{alertId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve alert",
            description = "Mark an alert as approved - contribution is valid despite flag")
    public ResponseEntity<RouteValidationAlertDTO> approveAlert(
            @PathVariable UUID alertId,
            @RequestBody ApprovalRequest request
    ) {
        log.info("Admin approving alert {} with notes: {}", alertId, request.notes);
        
        RouteValidationAlertJpaEntity alert = alertService.approveAlert(
                alertId,
                getCurrentAdminId(),
                request.notes
        );
        
        return ResponseEntity.ok(RouteValidationAlertDTO.fromEntity(alert));
    }
    
    /**
     * Dismiss an alert (false positive).
     */
    @PostMapping("/{alertId}/dismiss")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Dismiss alert",
            description = "Mark an alert as dismissed - false positive, contribution is valid")
    public ResponseEntity<RouteValidationAlertDTO> dismissAlert(
            @PathVariable UUID alertId,
            @RequestBody DismissalRequest request
    ) {
        log.info("Admin dismissing alert {} with reason: {}", alertId, request.reason);
        
        RouteValidationAlertJpaEntity alert = alertService.dismissAlert(
                alertId,
                getCurrentAdminId(),
                request.reason
        );
        
        return ResponseEntity.ok(RouteValidationAlertDTO.fromEntity(alert));
    }
    
    /**
     * Reject an alert (contribution should be rejected).
     */
    @PostMapping("/{alertId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject alert",
            description = "Mark an alert as rejected - contribution should be rejected")
    public ResponseEntity<RouteValidationAlertDTO> rejectAlert(
            @PathVariable UUID alertId,
            @RequestBody RejectionRequest request
    ) {
        log.info("Admin rejecting alert {} with reason: {}", alertId, request.reason);
        
        RouteValidationAlertJpaEntity alert = alertService.rejectAlert(
                alertId,
                getCurrentAdminId(),
                request.reason
        );
        
        return ResponseEntity.ok(RouteValidationAlertDTO.fromEntity(alert));
    }
    
    /**
     * Escalate an alert for further investigation.
     */
    @PostMapping("/{alertId}/escalate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Escalate alert",
            description = "Mark an alert as escalated for further investigation")
    public ResponseEntity<RouteValidationAlertDTO> escalateAlert(
            @PathVariable UUID alertId,
            @RequestBody EscalationRequest request
    ) {
        log.info("Admin escalating alert {} with reason: {}", alertId, request.reason);
        
        RouteValidationAlertJpaEntity alert = alertService.escalateAlert(
                alertId,
                getCurrentAdminId(),
                request.reason
        );
        
        return ResponseEntity.ok(RouteValidationAlertDTO.fromEntity(alert));
    }
    
    /**
     * Get dashboard statistics.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get validation statistics",
            description = "Retrieves overall statistics about validation alerts")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = alertService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get statistics by validation type.
     * Useful for tuning validation thresholds and identifying problematic routes.
     */
    @GetMapping("/stats/by-type")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get statistics by validation type",
            description = "Retrieves validation statistics broken down by type")
    public ResponseEntity<List<Map<String, Object>>> getStatsByType() {
        List<Map<String, Object>> stats = alertService.getValidationTypeStats();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Check if a contribution has pending alerts.
     */
    @GetMapping("/contribution/{contributionId}/has-pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Check for pending alerts",
            description = "Check if a contribution has any pending validation alerts")
    public ResponseEntity<Boolean> hasPendingAlerts(
            @PathVariable UUID contributionId
    ) {
        boolean hasPending = alertService.hasPendingAlerts(contributionId);
        return ResponseEntity.ok(hasPending);
    }
    
    /**
     * Gets the most recent alert for a contribution.
     */
    @GetMapping("/contribution/{contributionId}/latest")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get latest alert",
            description = "Retrieves the most recent alert for a contribution")
    public ResponseEntity<RouteValidationAlertDTO> getLatestAlert(
            @PathVariable UUID contributionId
    ) {
        return alertService.getLatestAlert(contributionId)
                .map(alert -> ResponseEntity.ok(RouteValidationAlertDTO.fromEntity(alert)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Helper to get current admin ID from security context.
     * In production, extract from JWT token principal.
     */
    private String getCurrentAdminId() {
        // TODO: Extract from SecurityContextHolder.getContext().getAuthentication()
        return "admin-user";
    }
    
    // DTO Classes
    
    /**
     * DTO for returning validation alert information to admin.
     */
    record RouteValidationAlertDTO(
            UUID id,
            UUID contributionId,
            String validationType,
            int confidenceScore,
            String expectedRange,
            String actualValue,
            String issueDescription,
            String status,
            String adminNotes,
            String createdAt,
            String reviewedAt,
            String reviewedBy
    ) {
        public static RouteValidationAlertDTO fromEntity(RouteValidationAlertJpaEntity entity) {
            return new RouteValidationAlertDTO(
                    entity.getId(),
                    entity.getContributionId(),
                    entity.getValidationType().name(),
                    entity.getConfidenceScore(),
                    entity.getExpectedRange(),
                    entity.getActualValue(),
                    entity.getIssueDescription(),
                    entity.getStatus().name(),
                    entity.getAdminNotes(),
                    entity.getCreatedAt().toString(),
                    entity.getReviewedAt() != null ? entity.getReviewedAt().toString() : null,
                    entity.getReviewedBy()
            );
        }
    }
    
    record ApprovalRequest(String notes) {}
    
    record DismissalRequest(String reason) {}
    
    record RejectionRequest(String reason) {}
    
    record EscalationRequest(String reason) {}
}
