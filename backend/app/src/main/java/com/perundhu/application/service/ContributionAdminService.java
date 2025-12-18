package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.StopContribution;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.port.RouteContributionRepository;
import com.perundhu.domain.port.ImageContributionOutputPort;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
import java.util.function.BiFunction;

/**
 * Service for administrative operations on user contributions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContributionAdminService {

    private final RouteContributionRepository routeContributionRepository;
    private final ImageContributionOutputPort imageContributionOutputPort;
    private final ContributionProcessingService processingService;

    // Using sealed interface for contribution status
    private sealed interface ContributionStatus permits ApprovedStatus, RejectedStatus, PendingStatus {
        String getValue();

        static ContributionStatus fromString(String status) {
            return switch (status.toUpperCase()) {
                case "APPROVED" -> new ApprovedStatus();
                case "REJECTED" -> new RejectedStatus();
                case "PENDING" -> new PendingStatus();
                default -> throw new IllegalArgumentException("Unknown status: " + status);
            };
        }
    }

    private record ApprovedStatus() implements ContributionStatus {
        @Override
        public String getValue() {
            return "APPROVED";
        }
    }

    private record RejectedStatus() implements ContributionStatus {
        @Override
        public String getValue() {
            return "REJECTED";
        }
    }

    private record PendingStatus() implements ContributionStatus {
        @Override
        public String getValue() {
            return "PENDING";
        }
    }

    // Using record for dashboard statistics
    private record DashboardStats(
            long totalRouteContributions,
            long pendingRouteContributions,
            long approvedRouteContributions,
            long rejectedRouteContributions,
            long totalImageContributions,
            long pendingImageContributions,
            long approvedImageContributions,
            long rejectedImageContributions) {
        public Map<String, Object> toMap() {
            var stats = new HashMap<String, Object>();

            // Add counts to stats map
            stats.put("totalRouteContributions", totalRouteContributions);
            stats.put("pendingRouteContributions", pendingRouteContributions);
            stats.put("approvedRouteContributions", approvedRouteContributions);
            stats.put("rejectedRouteContributions", rejectedRouteContributions);

            stats.put("totalImageContributions", totalImageContributions);
            stats.put("pendingImageContributions", pendingImageContributions);
            stats.put("approvedImageContributions", approvedImageContributions);
            stats.put("rejectedImageContributions", rejectedImageContributions);

            // Calculate overall stats
            stats.put("totalContributions", totalRouteContributions + totalImageContributions);
            stats.put("pendingContributions", pendingRouteContributions + pendingImageContributions);
            stats.put("approvedContributions", approvedRouteContributions + approvedImageContributions);
            stats.put("rejectedContributions", rejectedRouteContributions + rejectedImageContributions);

            return stats;
        }
    }

    /**
     * Get all route contributions with "PENDING" status
     * 
     * @return List of pending route contributions
     */
    public List<RouteContribution> getPendingRouteContributions() {
        return routeContributionRepository.findByStatus(new PendingStatus().getValue());
    }

    /**
     * Get all route contributions
     * 
     * @return List of all route contributions
     */
    public List<RouteContribution> getAllRouteContributions() {
        return routeContributionRepository.findAll();
    }

    /**
     * Get all image contributions with "PENDING" status
     * 
     * @return List of pending image contributions
     */
    public List<ImageContribution> getPendingImageContributions() {
        return imageContributionOutputPort.findByStatus(new PendingStatus().getValue());
    }

    /**
     * Get all image contributions
     * 
     * @return List of all image contributions
     */
    public List<ImageContribution> getAllImageContributions() {
        return imageContributionOutputPort.findAll();
    }

    /**
     * Update route contribution status
     * 
     * @param id     Contribution ID
     * @param status New status
     * @param notes  Optional notes
     * @return Updated contribution
     */
    @Transactional
    public RouteContribution updateRouteContributionStatus(String id, String status, String notes) {
        var contributionStatus = ContributionStatus.fromString(status);

        // Java 21 pattern matching for switch
        return switch (contributionStatus) {
            case ApprovedStatus() -> approveRouteContribution(id, notes)
                    .orElseThrow(() -> new IllegalArgumentException("Route contribution not found with id: " + id));
            case RejectedStatus() -> rejectRouteContribution(id, notes)
                    .orElseThrow(() -> new IllegalArgumentException("Route contribution not found with id: " + id));
            case PendingStatus() -> throw new IllegalArgumentException("Cannot set status back to PENDING");
        };
    }

    /**
     * Update image contribution status
     * 
     * @param id     Contribution ID
     * @param status New status
     * @param notes  Optional notes
     * @return Updated contribution
     */
    @Transactional
    public ImageContribution updateImageContributionStatus(String id, String status, String notes) {
        var contributionStatus = ContributionStatus.fromString(status);

        // Java 21 pattern matching for switch
        return switch (contributionStatus) {
            case ApprovedStatus() -> approveImageContribution(id, notes)
                    .orElseThrow(() -> new IllegalArgumentException("Image contribution not found with id: " + id));
            case RejectedStatus() -> rejectImageContribution(id, notes)
                    .orElseThrow(() -> new IllegalArgumentException("Image contribution not found with id: " + id));
            case PendingStatus() -> throw new IllegalArgumentException("Cannot set status back to PENDING");
        };
    }

    /**
     * Approve a route contribution
     * 
     * @param id            ID of the contribution to approve
     * @param approvalNotes Optional notes for the approval
     * @return Updated contribution if found
     */
    @Transactional
    public Optional<RouteContribution> approveRouteContribution(String id, String approvalNotes) {
        return routeContributionRepository.findById(id)
                .map(contribution -> {
                    // Update status and processed date
                    contribution.setStatus(new ApprovedStatus().getValue());
                    contribution.setProcessedDate(LocalDateTime.now());

                    // Add approval notes if provided
                    addNotesToContribution(contribution, approvalNotes, "Approval notes");

                    // Save the updated contribution
                    var saved = routeContributionRepository.save(contribution);

                    // Immediately integrate the approved contribution into main bus tables
                    try {
                        processingService.integrateApprovedContribution(saved);
                        log.info("Successfully integrated approved route contribution ID: {}", id);
                    } catch (Exception e) {
                        log.error("Error integrating approved route contribution ID {}: {}", id, e.getMessage(), e);
                        // Update status to indicate integration failure
                        saved.setStatus("INTEGRATION_FAILED");
                        saved.setValidationMessage("Failed to integrate into bus system: " + e.getMessage());
                        saved = routeContributionRepository.save(saved);
                    }

                    log.info("Approved route contribution with ID: {}", id);
                    return saved;
                });
    }

    /**
     * Reject a route contribution
     * 
     * @param id     ID of the contribution to reject
     * @param reason Rejection reason
     * @return Updated contribution if found
     */
    @Transactional
    public Optional<RouteContribution> rejectRouteContribution(String id, String reason) {
        return routeContributionRepository.findById(id)
                .map(contribution -> {
                    // Update status, validation message, and processed date
                    contribution.setStatus(new RejectedStatus().getValue());
                    contribution.setValidationMessage(reason);
                    contribution.setProcessedDate(LocalDateTime.now());

                    // Save the updated contribution
                    var saved = routeContributionRepository.save(contribution);

                    log.info("Rejected route contribution with ID: {}", id);
                    return saved;
                });
    }

    /**
     * Approve an image contribution
     * 
     * @param id            ID of the contribution to approve
     * @param approvalNotes Optional notes for the approval
     * @return Updated contribution if found
     */
    @Transactional
    public Optional<ImageContribution> approveImageContribution(String id, String approvalNotes) {
        return imageContributionOutputPort.findById(id)
                .map(contribution -> {
                    // Update status and processed date
                    contribution.setStatus(new ApprovedStatus().getValue());
                    contribution.setProcessedDate(LocalDateTime.now());

                    // Add approval notes if provided
                    addNotesToContribution(contribution, approvalNotes, "Approval notes");

                    // Save the updated contribution
                    var saved = imageContributionOutputPort.save(contribution);

                    // Process the approved contribution
                    processingService.processImageContributions();

                    log.info("Approved image contribution with ID: {}", id);
                    return saved;
                });
    }

    /**
     * Reject an image contribution
     * 
     * @param id     ID of the contribution to reject
     * @param reason Rejection reason
     * @return Updated contribution if found
     */
    @Transactional
    public Optional<ImageContribution> rejectImageContribution(String id, String reason) {
        return imageContributionOutputPort.findById(id)
                .map(contribution -> {
                    // Update status, validation message, and processed date
                    contribution.setStatus(new RejectedStatus().getValue());
                    contribution.setValidationMessage(reason);
                    contribution.setProcessedDate(LocalDateTime.now());

                    // Save the updated contribution
                    var saved = imageContributionOutputPort.save(contribution);

                    log.info("Rejected image contribution with ID: {}", id);
                    return saved;
                });
    }

    /**
     * Helper method to add notes to a contribution
     */
    private <T> void addNotesToContribution(T contribution, String notes, String noteType) {
        if (notes != null && !notes.isBlank()) {
            // Java 21 pattern matching for switch
            switch (contribution) {
                case RouteContribution rc -> {
                    String currentNotes = rc.getAdditionalNotes() != null ? rc.getAdditionalNotes() : "";
                    rc.setAdditionalNotes(currentNotes + "\n" + noteType + ": " + notes);
                }
                case ImageContribution ic -> {
                    String currentNotes = ic.getAdditionalNotes() != null ? ic.getAdditionalNotes() : "";
                    ic.setAdditionalNotes(currentNotes + "\n" + noteType + ": " + notes);
                }
                default -> { /* No action for other types */ }
            }
        }
    }

    /**
     * Delete a route contribution
     * 
     * @param id ID of the contribution to delete
     */
    @Transactional
    public void deleteRouteContribution(String id) {
        routeContributionRepository.deleteById(id);
        log.info("Deleted route contribution with ID: {}", id);
    }

    /**
     * Delete an image contribution
     * 
     * @param id ID of the contribution to delete
     */
    @Transactional
    public void deleteImageContribution(String id) {
        imageContributionOutputPort.deleteById(id);
        log.info("Deleted image contribution with ID: {}", id);
    }

    /**
     * Get dashboard statistics for admin
     * 
     * @return Map containing various statistics
     */
    public Map<String, Object> getAdminDashboardStats() {
        var stats = new DashboardStats(
                routeContributionRepository.count(),
                routeContributionRepository.countByStatus(new PendingStatus().getValue()),
                routeContributionRepository.countByStatus(new ApprovedStatus().getValue()),
                routeContributionRepository.countByStatus(new RejectedStatus().getValue()),
                imageContributionOutputPort.count(),
                imageContributionOutputPort.countByStatus(new PendingStatus().getValue()),
                imageContributionOutputPort.countByStatus(new ApprovedStatus().getValue()),
                imageContributionOutputPort.countByStatus(new RejectedStatus().getValue()));

        return stats.toMap();
    }
}