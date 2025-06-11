package com.perundhu.adapter.in.rest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.perundhu.application.service.ContributionAdminService;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

/**
 * REST API Controller for admin operations on user contributions
 */
@RestController
@RequestMapping("/api/admin/contributions")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final ContributionAdminService contributionAdminService;

    // Using Java 17 records for request/response DTOs
    private record ContributionAction(String action, String notes) {
        // Validation with compact constructor
        public ContributionAction {
            if (action == null || action.isBlank()) {
                throw new IllegalArgumentException("Action must not be empty");
            }
        }
    }
    
    private record AdminResponse(boolean success, String message) {}

    // Using sealed interface for contribution status with exhaustive pattern matching
    private sealed interface ContributionStatus permits ApprovedStatus, RejectedStatus, PendingStatus {
        String getValue();
        default boolean isTerminal() {
            return this instanceof ApprovedStatus || this instanceof RejectedStatus;
        }
    }
    
    private record ApprovedStatus() implements ContributionStatus {
        @Override
        public String getValue() { return "APPROVED"; }
    }
    
    private record RejectedStatus() implements ContributionStatus {
        @Override
        public String getValue() { return "REJECTED"; }
    }
    
    private record PendingStatus() implements ContributionStatus {
        @Override
        public String getValue() { return "PENDING"; }
    }

    /**
     * Get all pending route contributions
     */
    @GetMapping("/routes/pending")
    public ResponseEntity<List<RouteContribution>> getPendingRouteContributions() {
        log.info("Admin request for pending route contributions");
        var pendingContributions = contributionAdminService.getPendingRouteContributions();
        return ResponseEntity.ok(pendingContributions);
    }

    /**
     * Get all pending image contributions
     */
    @GetMapping("/images/pending")
    public ResponseEntity<List<ImageContribution>> getPendingImageContributions() {
        log.info("Admin request for pending image contributions");
        var pendingContributions = contributionAdminService.getPendingImageContributions();
        return ResponseEntity.ok(pendingContributions);
    }

    /**
     * Approve a route contribution
     */
    @PostMapping("/routes/{id}/approve")
    public ResponseEntity<?> approveRouteContribution(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> notes) {
        log.info("Admin request to approve route contribution: {}", id);
        
        if (id == null || id <= 0) {
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, "Invalid contribution ID"));
        }
        
        // Using Optional for nullable values
        var notesText = Optional.ofNullable(notes)
            .map(n -> n.get("notes"))
            .orElse(null);
        
        try {
            var updatedContribution = contributionAdminService.updateRouteContributionStatus(
                id, 
                new ApprovedStatus().getValue(),
                notesText
            );
            
            return ResponseEntity.ok(updatedContribution);
        } catch (Exception e) {
            log.error("Error approving route contribution: {}", id, e);
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, "Failed to approve: " + e.getMessage()));
        }
    }

    /**
     * Reject a route contribution
     */
    @PostMapping("/routes/{id}/reject")
    public ResponseEntity<?> rejectRouteContribution(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> notes) {
        log.info("Admin request to reject route contribution: {}", id);
        
        if (id == null || id <= 0) {
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, "Invalid contribution ID"));
        }
        
        // Using Optional for nullable values
        var notesText = Optional.ofNullable(notes)
            .map(n -> n.get("notes"))
            .orElse(null);
        
        try {
            var updatedContribution = contributionAdminService.updateRouteContributionStatus(
                id, 
                new RejectedStatus().getValue(),
                notesText
            );
            
            return ResponseEntity.ok(updatedContribution);
        } catch (Exception e) {
            log.error("Error rejecting route contribution: {}", id, e);
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, "Failed to reject: " + e.getMessage()));
        }
    }
    
    /**
     * Approve an image contribution
     */
    @PostMapping("/images/{id}/approve")
    public ResponseEntity<?> approveImageContribution(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> notes) {
        log.info("Admin request to approve image contribution: {}", id);

        if (id == null || id <= 0) {
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, "Invalid contribution ID"));
        }

        // Using Optional for nullable values
        var notesText = Optional.ofNullable(notes)
            .map(n -> n.get("notes"))
            .orElse(null);

        try {
            var updatedContribution = contributionAdminService.updateImageContributionStatus(
                id,
                new ApprovedStatus().getValue(),
                notesText
            );

            return ResponseEntity.ok(updatedContribution);
        } catch (Exception e) {
            log.error("Error approving image contribution: {}", id, e);
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, "Failed to approve: " + e.getMessage()));
        }
    }

    /**
     * Reject an image contribution
     */
    @PostMapping("/images/{id}/reject")
    public ResponseEntity<?> rejectImageContribution(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("Admin request to reject image contribution: {}", id);

        if (id == null || id <= 0) {
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, "Invalid contribution ID"));
        }

        // Process the rejection reason from the request body
        var reason = Optional.ofNullable(body)
            .map(b -> b.get("reason"))
            .orElse(null);

        try {
            var updatedContribution = contributionAdminService.updateImageContributionStatus(
                id,
                new RejectedStatus().getValue(),
                reason
            );

            return ResponseEntity.ok(updatedContribution);
        } catch (Exception e) {
            log.error("Error rejecting image contribution: {}", id, e);
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, "Failed to reject: " + e.getMessage()));
        }
    }

    /**
     * Update status for an image contribution
     */
    @PostMapping("/images/{id}/status")
    public ResponseEntity<?> updateImageContributionStatus(
            @PathVariable Long id,
            @RequestBody ContributionAction action) {
        
        log.info("Admin request to update image contribution: {} with action: {}", 
            id, action.action());
        
        // Using pattern matching with instanceof and Java 17 switch expression
        ContributionStatus status = switch (action.action().toUpperCase()) {
            case "APPROVE" -> new ApprovedStatus();
            case "REJECT" -> new RejectedStatus();
            default -> throw new IllegalArgumentException("Invalid action: " + action.action());
        };
        
        try {
            var updatedContribution = contributionAdminService.updateImageContributionStatus(
                id,
                status.getValue(),
                action.notes()
            );
            
            return ResponseEntity.ok(updatedContribution);
        } catch (Exception e) {
            log.error("Error updating image contribution: {}", id, e);
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, "Failed to update status: " + e.getMessage()));
        }
    }

    /**
     * Get admin dashboard statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        log.info("Admin request for dashboard statistics");
        var stats = contributionAdminService.getAdminDashboardStats();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Generic handler for contribution status updates with functional approach
     */
    private <T> ResponseEntity<?> handleStatusUpdate(
            Long id, 
            ContributionStatus status, 
            String notes,
            Function<Object[], T> serviceMethod) {
        
        try {
            var result = serviceMethod.apply(new Object[]{id, status.getValue(), notes});
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error updating contribution status: {} to {}", id, status.getValue(), e);
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, "Update failed: " + e.getMessage()));
        }
    }
}
