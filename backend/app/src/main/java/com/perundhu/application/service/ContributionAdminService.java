package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.port.RouteContributionRepository;
import com.perundhu.domain.port.ImageContributionRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;

/**
 * Service for administrative operations on user contributions
 */
@Service
public class ContributionAdminService {
    
    private static final Logger log = LoggerFactory.getLogger(ContributionAdminService.class);

    private final RouteContributionRepository routeContributionRepository;
    private final ImageContributionRepository imageContributionRepository;
    private final ContributionProcessingService processingService;
    
    /**
     * Constructor for dependency injection
     * Replaces Lombok's @RequiredArgsConstructor
     */
    public ContributionAdminService(
            RouteContributionRepository routeContributionRepository,
            ImageContributionRepository imageContributionRepository,
            ContributionProcessingService processingService) {
        this.routeContributionRepository = routeContributionRepository;
        this.imageContributionRepository = imageContributionRepository;
        this.processingService = processingService;
    }

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
    
    // Using record for dashboard statistics
    private record DashboardStats(
        long totalRouteContributions,
        long pendingRouteContributions,
        long approvedRouteContributions,
        long rejectedRouteContributions,
        long totalImageContributions,
        long pendingImageContributions,
        long approvedImageContributions,
        long rejectedImageContributions
    ) {
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
        return routeContributionRepository.findByStatus(RouteContribution.ContributionStatus.PENDING);
    }
    
    /**
     * Get all route contributions using findByUserId with null to get all
     *
     * @return List of all route contributions
     */
    public List<RouteContribution> getAllRouteContributions() {
        // Use existing repository methods to get all contributions
        var pending = routeContributionRepository.findByStatus(RouteContribution.ContributionStatus.PENDING);
        var approved = routeContributionRepository.findByStatus(RouteContribution.ContributionStatus.APPROVED);
        var rejected = routeContributionRepository.findByStatus(RouteContribution.ContributionStatus.REJECTED);

        var allContributions = new java.util.ArrayList<RouteContribution>();
        allContributions.addAll(pending);
        allContributions.addAll(approved);
        allContributions.addAll(rejected);

        return allContributions;
    }
    
    /**
     * Get all image contributions with "PENDING" status
     * 
     * @return List of pending image contributions
     */
    public List<ImageContribution> getPendingImageContributions() {
        return imageContributionRepository.findByStatus(ImageContribution.ContributionStatus.PENDING);
    }
    
    /**
     * Update route contribution status
     * 
     * @param id Contribution ID
     * @param status New status
     * @param notes Optional notes
     * @return Updated contribution
     */
    @Transactional
    public RouteContribution updateRouteContributionStatus(Long id, String status, String notes) {
        var contributionStatus = ContributionStatus.fromString(status);
        
        return switch (contributionStatus) {
            case ApprovedStatus ignored -> approveRouteContribution(id, notes)
                .orElseThrow(() -> new IllegalArgumentException("Route contribution not found with id: " + id));
            case RejectedStatus ignored -> rejectRouteContribution(id, notes)
                .orElseThrow(() -> new IllegalArgumentException("Route contribution not found with id: " + id));
            case PendingStatus ignored -> throw new IllegalArgumentException("Cannot set status back to PENDING");
        };
    }
    
    /**
     * Update image contribution status
     * 
     * @param id Contribution ID
     * @param status New status
     * @param notes Optional notes
     * @return Updated contribution
     */
    @Transactional
    public ImageContribution updateImageContributionStatus(Long id, String status, String notes) {
        var contributionStatus = ContributionStatus.fromString(status);
        
        return switch (contributionStatus) {
            case ApprovedStatus ignored -> approveImageContribution(id, notes)
                .orElseThrow(() -> new IllegalArgumentException("Image contribution not found with id: " + id));
            case RejectedStatus ignored -> rejectImageContribution(id, notes)
                .orElseThrow(() -> new IllegalArgumentException("Image contribution not found with id: " + id));
            case PendingStatus ignored -> throw new IllegalArgumentException("Cannot set status back to PENDING");
        };
    }
    
    /**
     * Approve a route contribution
     * 
     * @param id ID of the contribution to approve
     * @param approvalNotes Optional notes for the approval
     * @return Updated contribution if found
     */
    @Transactional
    public Optional<RouteContribution> approveRouteContribution(Long id, String approvalNotes) {
        return routeContributionRepository.findById(new RouteContribution.RouteContributionId(id.toString()))
            .map(contribution -> {
                // Create new record with updated status and processed date since records are immutable
                var updatedContribution = new RouteContribution(
                    contribution.id(),
                    contribution.userId(),
                    contribution.busNumber(),
                    contribution.busName(),
                    contribution.fromLocationName(),
                    contribution.toLocationName(),
                    contribution.busNameSecondary(),
                    contribution.fromLocationNameSecondary(),
                    contribution.toLocationNameSecondary(),
                    contribution.sourceLanguage(),
                    contribution.fromLatitude(),
                    contribution.fromLongitude(),
                    contribution.toLatitude(),
                    contribution.toLongitude(),
                    contribution.departureTime(),
                    contribution.arrivalTime(),
                    contribution.scheduleInfo(),
                    RouteContribution.ContributionStatus.APPROVED, // Updated status
                    contribution.submissionDate(),
                    LocalDateTime.now(), // Updated processed date
                    approvalNotes != null ? approvalNotes : contribution.additionalNotes(), // Updated notes
                    contribution.validationMessage(),
                    contribution.stops()
                );

                // Save the updated contribution
                var saved = routeContributionRepository.save(updatedContribution);

                // Process the approved contribution
                processingService.processRouteContributions();
                
                log.info("Approved route contribution with ID: {}", id);
                return saved;
            });
    }

    /**
     * Reject a route contribution
     * 
     * @param id ID of the contribution to reject
     * @param reason Rejection reason
     * @return Updated contribution if found
     */
    @Transactional
    public Optional<RouteContribution> rejectRouteContribution(Long id, String reason) {
        return routeContributionRepository.findById(new RouteContribution.RouteContributionId(id.toString()))
            .map(contribution -> {
                // Create new record with updated status, validation message, and processed date
                var updatedContribution = new RouteContribution(
                    contribution.id(),
                    contribution.userId(),
                    contribution.busNumber(),
                    contribution.busName(),
                    contribution.fromLocationName(),
                    contribution.toLocationName(),
                    contribution.busNameSecondary(),
                    contribution.fromLocationNameSecondary(),
                    contribution.toLocationNameSecondary(),
                    contribution.sourceLanguage(),
                    contribution.fromLatitude(),
                    contribution.fromLongitude(),
                    contribution.toLatitude(),
                    contribution.toLongitude(),
                    contribution.departureTime(),
                    contribution.arrivalTime(),
                    contribution.scheduleInfo(),
                    RouteContribution.ContributionStatus.REJECTED, // Updated status
                    contribution.submissionDate(),
                    LocalDateTime.now(), // Updated processed date
                    contribution.additionalNotes(),
                    reason, // Updated validation message
                    contribution.stops()
                );

                // Save the updated contribution
                var saved = routeContributionRepository.save(updatedContribution);

                log.info("Rejected route contribution with ID: {}", id);
                return saved;
            });
    }

    /**
     * Approve an image contribution
     * 
     * @param id ID of the contribution to approve
     * @param approvalNotes Optional notes for the approval
     * @return Updated contribution if found
     */
    @Transactional
    public Optional<ImageContribution> approveImageContribution(Long id, String approvalNotes) {
        return imageContributionRepository.findById(new ImageContribution.ImageContributionId(id.toString()))
            .map(contribution -> {
                // Create new record with updated status and processed date since records are immutable
                var updatedContribution = new ImageContribution(
                    contribution.id(),
                    contribution.userId(),
                    contribution.description(),
                    contribution.location(),
                    contribution.routeName(),
                    contribution.imageUrl(),
                    ImageContribution.ContributionStatus.APPROVED, // Updated status
                    contribution.submissionDate(),
                    LocalDateTime.now(), // Updated processed date
                    approvalNotes != null ? approvalNotes : contribution.additionalNotes(), // Updated notes
                    contribution.validationMessage(),
                    contribution.busNumber(),
                    contribution.imageDescription(),
                    contribution.locationName(),
                    contribution.extractedData()
                );

                // Save the updated contribution
                var saved = imageContributionRepository.save(updatedContribution);

                // Process the approved contribution
                processingService.processImageContributions();
                
                log.info("Approved image contribution with ID: {}", id);
                return saved;
            });
    }

    /**
     * Reject an image contribution
     * 
     * @param id ID of the contribution to reject
     * @param reason Rejection reason
     * @return Updated contribution if found
     */
    @Transactional
    public Optional<ImageContribution> rejectImageContribution(Long id, String reason) {
        return imageContributionRepository.findById(new ImageContribution.ImageContributionId(id.toString()))
            .map(contribution -> {
                // Create new record with updated status, validation message, and processed date
                var updatedContribution = new ImageContribution(
                    contribution.id(),
                    contribution.userId(),
                    contribution.description(),
                    contribution.location(),
                    contribution.routeName(),
                    contribution.imageUrl(),
                    ImageContribution.ContributionStatus.REJECTED, // Updated status
                    contribution.submissionDate(),
                    LocalDateTime.now(), // Updated processed date
                    contribution.additionalNotes(),
                    reason, // Updated validation message
                    contribution.busNumber(),
                    contribution.imageDescription(),
                    contribution.locationName(),
                    contribution.extractedData()
                );

                // Save the updated contribution
                var saved = imageContributionRepository.save(updatedContribution);

                log.info("Rejected image contribution with ID: {}", id);
                return saved;
            });
    }

    /**
     * Submit a new route contribution
     *
     * @param contribution The route contribution to submit
     * @return The saved route contribution with assigned ID
     */
    @Transactional
    public RouteContribution submitRouteContribution(RouteContribution contribution) {
        // Create new record with initial status set to PENDING and submission date set to now
        // since records are immutable
        var submittedContribution = new RouteContribution(
            contribution.id(),
            contribution.userId() != null && !contribution.userId().trim().isEmpty() ?
                contribution.userId() : "anonymous", // Ensure userId is set
            contribution.busNumber(),
            contribution.busName(),
            contribution.fromLocationName(),
            contribution.toLocationName(),
            contribution.busNameSecondary(),
            contribution.fromLocationNameSecondary(),
            contribution.toLocationNameSecondary(),
            contribution.sourceLanguage(),
            contribution.fromLatitude(),
            contribution.fromLongitude(),
            contribution.toLatitude(),
            contribution.toLongitude(),
            contribution.departureTime(),
            contribution.arrivalTime(),
            contribution.scheduleInfo(),
            RouteContribution.ContributionStatus.PENDING, // Set initial status to PENDING
            LocalDateTime.now(), // Set submission date to now
            contribution.processedDate(),
            contribution.additionalNotes(),
            contribution.validationMessage(),
            contribution.stops()
        );

        log.info("Submitting new route contribution: {}", submittedContribution);
        return routeContributionRepository.save(submittedContribution);
    }

    /**
     * Submit a new image contribution
     *
     * @param contribution The image contribution to submit
     * @return The saved image contribution with assigned ID
     */
    @Transactional
    public ImageContribution submitImageContribution(ImageContribution contribution) {
        // Create new record with initial status set to PENDING and submission date set to now
        var submittedContribution = new ImageContribution(
            contribution.id(),
            contribution.userId() != null && !contribution.userId().trim().isEmpty() ?
                contribution.userId() : "anonymous", // Ensure userId is set
            contribution.description(),
            contribution.location(),
            contribution.routeName(),
            contribution.imageUrl(),
            ImageContribution.ContributionStatus.PENDING, // Set initial status to PENDING
            LocalDateTime.now(), // Set submission date to now
            contribution.processedDate(),
            contribution.additionalNotes(),
            contribution.validationMessage(),
            contribution.busNumber(),
            contribution.imageDescription(),
            contribution.locationName(),
            contribution.extractedData()
        );

        log.info("Submitting new image contribution: {}", submittedContribution);
        return imageContributionRepository.save(submittedContribution);
    }

    /**
     * Get dashboard statistics for admin
     *
     * @return Map containing various statistics about contributions
     */
    public Map<String, Object> getAdminDashboardStats() {
        var stats = new DashboardStats(
            routeContributionRepository.count(),
            routeContributionRepository.countByStatus(RouteContribution.ContributionStatus.PENDING),
            routeContributionRepository.countByStatus(RouteContribution.ContributionStatus.APPROVED),
            routeContributionRepository.countByStatus(RouteContribution.ContributionStatus.REJECTED),
            imageContributionRepository.count(),
            imageContributionRepository.countByStatus(ImageContribution.ContributionStatus.PENDING),
            imageContributionRepository.countByStatus(ImageContribution.ContributionStatus.APPROVED),
            imageContributionRepository.countByStatus(ImageContribution.ContributionStatus.REJECTED)
        );

        return stats.toMap();
    }

    /**
     * Get route contributions by user ID
     *
     * @param userId The ID of the user who submitted the contributions
     * @return List of route contributions submitted by the specified user
     */
    public List<RouteContribution> getRouteContributionsByUser(String userId) {
        log.info("Fetching route contributions for user: {}", userId);
        return routeContributionRepository.findByUserId(userId);
    }
}
