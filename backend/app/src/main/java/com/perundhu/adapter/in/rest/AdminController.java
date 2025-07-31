package com.perundhu.adapter.in.rest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.perundhu.application.service.ContributionAdminService;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST API Controller for admin operations on user contributions
 */
@RestController
@RequestMapping("/api/admin/contributions")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);
    private final ContributionAdminService contributionAdminService;

    /**
     * Constructor for dependency injection
     * Replaces Lombok's @RequiredArgsConstructor
     */
    public AdminController(ContributionAdminService contributionAdminService) {
        this.contributionAdminService = contributionAdminService;
    }

    // Constants to avoid duplication
    private static final String INVALID_ID_MESSAGE = "Invalid contribution ID";
    private static final String NOTES_KEY = "notes";
    private static final String REASON_KEY = "reason";

    // Using Java 17 records for request/response DTOs
    public record ContributionAction(String action, String notes) {
        // Validation with compact constructor
        public ContributionAction {
            if (action == null || action.isBlank()) {
                throw new IllegalArgumentException("Action must not be empty");
            }
        }
    }
    
    public record AdminResponse(boolean success, String message) {}

    // Using sealed interface for contribution status with exhaustive pattern matching
    private sealed interface ContributionStatus permits ApprovedStatus, RejectedStatus, PendingStatus {
        String getValue();
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
     * Response DTO for route contributions in admin view
     */
    public record RouteContributionAdminResponse(
        Long id,
        String userId,
        String busNumber,
        String busName,
        String fromLocationName,
        String toLocationName,
        String status,
        String submissionDate,
        String processedDate,
        String additionalNotes,
        String validationMessage
    ) {
        /**
         * Factory method to create from domain model
         */
        public static RouteContributionAdminResponse fromDomain(RouteContribution contribution) {
            return new RouteContributionAdminResponse(
                contribution.id() != null ? Long.parseLong(contribution.id().value()) : null,
                contribution.userId(),
                contribution.busNumber(),
                contribution.busName(),
                contribution.fromLocationName(),
                contribution.toLocationName(),
                contribution.status() != null ? contribution.status().name() : null,
                contribution.submissionDate() != null ? contribution.submissionDate().toString() : null,
                contribution.processedDate() != null ? contribution.processedDate().toString() : null,
                contribution.additionalNotes(),
                contribution.validationMessage()
            );
        }
    }

    /**
     * Response DTO for image contributions in admin view
     */
    public record ImageContributionAdminResponse(
        Long id,
        String userId,
        String imageUrl,
        String locationName,
        String busNumber,
        String routeName,
        String status,
        String submissionDate,
        String processedDate,
        String description,
        String validationMessage
    ) {
        /**
         * Factory method to create from domain model
         */
        public static ImageContributionAdminResponse fromDomain(ImageContribution contribution) {
            return new ImageContributionAdminResponse(
                contribution.id() != null ? Long.parseLong(contribution.id().value()) : null,
                contribution.userId(),
                contribution.imageUrl(),
                contribution.locationName(),
                contribution.busNumber(),
                contribution.routeName(),
                contribution.status() != null ? contribution.status().name() : null,
                contribution.submissionDate() != null ? contribution.submissionDate().toString() : null,
                contribution.processedDate() != null ? contribution.processedDate().toString() : null,
                contribution.description(),
                contribution.validationMessage()
            );
        }
    }

    /**
     * Get all pending route contributions
     */
    @GetMapping("/routes/pending")
    public ResponseEntity<List<RouteContributionAdminResponse>> getPendingRouteContributions() {
        log.info("Admin request for pending route contributions");
        var pendingContributions = contributionAdminService.getPendingRouteContributions();

        var responseList = pendingContributions.stream()
            .map(RouteContributionAdminResponse::fromDomain)
            .toList(); // Using Java 17's toList() for immutable list

        return ResponseEntity.ok(responseList);
    }

    /**
     * Get all pending image contributions
     */
    @GetMapping("/images/pending")
    public ResponseEntity<List<ImageContributionAdminResponse>> getPendingImageContributions() {
        log.info("Admin request for pending image contributions");
        var pendingContributions = contributionAdminService.getPendingImageContributions();

        var responseList = pendingContributions.stream()
            .map(ImageContributionAdminResponse::fromDomain)
            .toList(); // Using Java 17's toList() for immutable list

        return ResponseEntity.ok(responseList);
    }

    /**
     * Approve a route contribution
     */
    @PostMapping("/routes/{id}/approve")
    public ResponseEntity<Object> approveRouteContribution(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> notes) {
        log.info("Admin request to approve route contribution: {}", id);
        
        if (id == null || id <= 0) {
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, INVALID_ID_MESSAGE));
        }
        
        // Using Optional for nullable values
        var notesText = Optional.ofNullable(notes)
            .map(n -> n.get(NOTES_KEY))
            .orElse(null);
        
        try {
            var contribution = contributionAdminService.updateRouteContributionStatus(
                id,
                new ApprovedStatus().getValue(),
                notesText
            );
            
            // Convert domain model to response DTO
            var response = RouteContributionAdminResponse.fromDomain(contribution);
            return ResponseEntity.ok(response);
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
    public ResponseEntity<Object> rejectRouteContribution(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> notes) {
        log.info("Admin request to reject route contribution: {}", id);
        
        if (id == null || id <= 0) {
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, INVALID_ID_MESSAGE));
        }
        
        // Using Optional for nullable values
        var notesText = Optional.ofNullable(notes)
            .map(n -> n.get(NOTES_KEY))
            .orElse(null);
        
        try {
            var contribution = contributionAdminService.updateRouteContributionStatus(
                id,
                new RejectedStatus().getValue(),
                notesText
            );
            
            // Convert domain model to response DTO
            var response = RouteContributionAdminResponse.fromDomain(contribution);
            return ResponseEntity.ok(response);
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
    public ResponseEntity<Object> approveImageContribution(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> notes) {
        log.info("Admin request to approve image contribution: {}", id);

        if (id == null || id <= 0) {
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, INVALID_ID_MESSAGE));
        }

        // Using Optional for nullable values
        var notesText = Optional.ofNullable(notes)
            .map(n -> n.get(NOTES_KEY))
            .orElse(null);

        try {
            var contribution = contributionAdminService.updateImageContributionStatus(
                id,
                new ApprovedStatus().getValue(),
                notesText
            );

            // Convert domain model to response DTO
            var response = ImageContributionAdminResponse.fromDomain(contribution);
            return ResponseEntity.ok(response);
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
    public ResponseEntity<Object> rejectImageContribution(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("Admin request to reject image contribution: {}", id);

        if (id == null || id <= 0) {
            return ResponseEntity.badRequest()
                .body(new AdminResponse(false, INVALID_ID_MESSAGE));
        }

        // Process the rejection reason from the request body
        var reason = Optional.ofNullable(body)
            .map(b -> b.get(REASON_KEY))
            .orElse(null);

        try {
            var contribution = contributionAdminService.updateImageContributionStatus(
                id,
                new RejectedStatus().getValue(),
                reason
            );

            // Convert domain model to response DTO
            var response = ImageContributionAdminResponse.fromDomain(contribution);
            return ResponseEntity.ok(response);
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
    public ResponseEntity<Object> updateImageContributionStatus(
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
            var contribution = contributionAdminService.updateImageContributionStatus(
                id,
                status.getValue(),
                action.notes()
            );
            
            // Convert domain model to response DTO
            var response = ImageContributionAdminResponse.fromDomain(contribution);
            return ResponseEntity.ok(response);
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
}
