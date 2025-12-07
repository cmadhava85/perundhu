package com.perundhu.adapter.in.rest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.port.in.AdminUseCase;
import com.perundhu.application.service.ContributionProcessingService;
import com.perundhu.application.service.ImageContributionProcessingService;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.port.input.SocialMediaMonitoringInputPort;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for admin operations
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private static final Logger log = LoggerFactory.getLogger(AdminController.class);

    private final AdminUseCase adminUseCase;
    private final ImageContributionProcessingService imageProcessingService;
    private final ContributionProcessingService contributionProcessingService;
    private final ImageContributionOutputPort imageContributionOutputPort;
    private final Optional<SocialMediaMonitoringInputPort> socialMediaMonitoringService;

    /**
     * Get all route contributions
     * 
     * @return List of all route contributions
     */
    @GetMapping("/contributions/routes")
    public ResponseEntity<List<RouteContribution>> getAllRouteContributions() {
        log.info("Request to get all route contributions");
        return ResponseEntity.ok(adminUseCase.getAllRouteContributions());
    }

    /**
     * Get pending route contributions
     * 
     * @return List of pending route contributions
     */
    @GetMapping("/contributions/routes/pending")
    public ResponseEntity<List<RouteContribution>> getPendingRouteContributions() {
        log.info("Request to get pending route contributions");
        return ResponseEntity.ok(adminUseCase.getPendingRouteContributions());
    }

    /**
     * Approve a route contribution
     * 
     * @param id The ID of the contribution to approve
     * @return The approved route contribution
     */
    @PostMapping("/contributions/routes/{id}/approve")
    public ResponseEntity<RouteContribution> approveRouteContribution(@PathVariable String id) {
        log.info("Request to approve route contribution with id: {}", id);
        return ResponseEntity.ok(adminUseCase.approveRouteContribution(id));
    }

    /**
     * Reject a route contribution
     * 
     * @param id          The ID of the contribution to reject
     * @param requestBody The rejection reason
     * @return The rejected route contribution
     */
    @PostMapping("/contributions/routes/{id}/reject")
    public ResponseEntity<RouteContribution> rejectRouteContribution(
            @PathVariable String id,
            @RequestBody Map<String, String> requestBody) {
        String reason = requestBody.get("reason");
        if (reason == null || reason.isBlank()) {
            reason = "No reason provided";
        }

        log.info("Request to reject route contribution with id: {}, reason: {}", id, reason);
        return ResponseEntity.ok(adminUseCase.rejectRouteContribution(id, reason));
    }

    /**
     * Delete a route contribution
     * 
     * @param id The ID of the contribution to delete
     * @return No content response
     */
    @DeleteMapping("/contributions/routes/{id}")
    public ResponseEntity<Void> deleteRouteContribution(@PathVariable String id) {
        log.info("Request to delete route contribution with id: {}", id);
        adminUseCase.deleteRouteContribution(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get all image contributions
     * 
     * @return List of all image contributions
     */
    @GetMapping("/contributions/images")
    public ResponseEntity<List<?>> getAllImageContributions() {
        log.info("Request to get all image contributions");
        return ResponseEntity.ok(adminUseCase.getAllImageContributions());
    }

    /**
     * Get pending image contributions
     * 
     * @return List of pending image contributions
     */
    @GetMapping("/contributions/images/pending")
    public ResponseEntity<List<?>> getPendingImageContributions() {
        log.info("Request to get pending image contributions");
        return ResponseEntity.ok(adminUseCase.getPendingImageContributions());
    }

    /**
     * Approve an image contribution with enhanced OCR processing
     * 
     * @param id          The ID of the contribution to approve
     * @param requestBody The approval request containing notes and options
     * @return The approved contribution with created route data
     */
    @PostMapping("/contributions/images/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveImageContributionEnhanced(@PathVariable String id,
            @RequestBody Map<String, Object> requestBody) {
        try {
            log.info("Request to approve image contribution with id: {}", id);

            String approvalNotes = (String) requestBody.get("approvalNotes");
            Boolean extractOCRData = (Boolean) requestBody.getOrDefault("extractOCRData", false);

            // Get the image contribution
            ImageContribution contribution = imageContributionOutputPort.findById(id)
                    .orElseThrow(() -> new RuntimeException("Image contribution not found: " + id));

            Map<String, Object> result = new HashMap<>();

            if (extractOCRData) {
                // Extract OCR data and create route entries
                // Pass autoApprove=true since admin is explicitly approving the image
                // contribution
                // This creates routes with APPROVED status directly, visible in search results
                Map<String, Object> extractedData = imageProcessingService.extractOCRData(contribution);
                List<RouteContribution> createdRoutes = imageProcessingService.createRouteDataFromOCR(
                        contribution, extractedData, true);

                // IMPORTANT: Integrate the created routes into the main bus/location/stops
                // tables
                // This is the missing step that was causing approved routes not to appear in
                // search
                int integratedCount = 0;
                int failedCount = 0;
                for (RouteContribution route : createdRoutes) {
                    try {
                        contributionProcessingService.integrateApprovedContribution(route);
                        integratedCount++;
                    } catch (Exception integrationError) {
                        log.error("Failed to integrate route {} into bus tables: {}",
                                route.getId(), integrationError.getMessage());
                        failedCount++;
                    }
                }

                log.info("Integrated {}/{} routes into bus tables ({} failed)",
                        integratedCount, createdRoutes.size(), failedCount);

                // Update contribution
                contribution.setExtractedData(extractedData.toString());
                contribution.setStatus("APPROVED");
                contribution.setProcessedDate(LocalDateTime.now());
                String validationMsg = String.format(
                        "Approved with OCR extraction. Created %d route entries, integrated %d into bus database.",
                        createdRoutes.size(), integratedCount);
                if (failedCount > 0) {
                    validationMsg += String.format(" (%d integration failures)", failedCount);
                }
                contribution.setValidationMessage(validationMsg);
                if (approvalNotes != null && !approvalNotes.isBlank()) {
                    contribution.setAdditionalNotes(approvalNotes);
                }

                ImageContribution savedContribution = imageContributionOutputPort.save(contribution);

                result.put("contribution", savedContribution);
                result.put("extractedData", extractedData);
                result.put("createdRoutes", createdRoutes.size());
                result.put("integratedRoutes", integratedCount);
                result.put("failedIntegrations", failedCount);
                result.put("routeIds", createdRoutes.stream().map(RouteContribution::getId).toList());

                log.info("Successfully approved image contribution {} and created {} route entries ({} integrated)",
                        id, createdRoutes.size(), integratedCount);
            } else {
                // Simple approval without OCR
                ImageContribution approved = adminUseCase.approveImageContribution(id);
                if (approvalNotes != null && !approvalNotes.isBlank()) {
                    approved.setAdditionalNotes(approvalNotes);
                    approved = imageContributionOutputPort.save(approved);
                }
                result.put("contribution", approved);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error approving image contribution {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to approve contribution: " + e.getMessage()));
        }
    }

    /**
     * Reject an image contribution
     * 
     * @param id          The ID of the contribution to reject
     * @param requestBody The rejection request containing the reason
     * @return The rejected contribution
     */
    @PostMapping("/contributions/images/{id}/reject")
    public ResponseEntity<ImageContribution> rejectImageContribution(@PathVariable String id,
            @RequestBody Map<String, String> requestBody) {
        String reason = requestBody.get("reason");
        if (reason == null || reason.isBlank()) {
            reason = "No reason provided";
        }

        log.info("Request to reject image contribution with id: {} for reason: {}", id, reason);
        ImageContribution rejected = adminUseCase.rejectImageContribution(id, reason);
        return ResponseEntity.ok(rejected);
    }

    /**
     * Delete an image contribution
     * 
     * @param id The ID of the contribution to delete
     * @return No content response
     */
    @DeleteMapping("/contributions/images/{id}")
    public ResponseEntity<Void> deleteImageContribution(@PathVariable String id) {
        log.info("Request to delete image contribution with id: {}", id);
        adminUseCase.deleteImageContribution(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Extract OCR data from an image contribution
     * 
     * @param id The ID of the contribution to process
     * @return The extracted OCR data
     */
    @PostMapping("/contributions/images/{id}/extract-ocr")
    public ResponseEntity<Map<String, Object>> extractOCRFromContribution(@PathVariable String id) {
        try {
            log.info("Request to extract OCR from image contribution with id: {}", id);

            // Get the image contribution
            ImageContribution contribution = imageContributionOutputPort.findById(id)
                    .orElseThrow(() -> new RuntimeException("Image contribution not found: " + id));

            // Extract OCR data
            Map<String, Object> extractedData = imageProcessingService.extractOCRData(contribution);

            // Update the contribution with extracted data
            contribution.setExtractedData(extractedData.toString());
            contribution.setStatus("MANUAL_REVIEW_NEEDED");
            contribution.setProcessedDate(LocalDateTime.now());
            imageContributionOutputPort.save(contribution);

            return ResponseEntity.ok(extractedData);
        } catch (Exception e) {
            log.error("Error extracting OCR from contribution {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to extract OCR data: " + e.getMessage()));
        }
    }

    /**
     * Update the extracted OCR data for an image contribution with manual
     * corrections.
     * Allows admins to fix OCR errors before approving the contribution.
     * 
     * @param id            The ID of the contribution to update
     * @param correctedData The manually corrected OCR data
     * @return Success response or error
     */
    @PutMapping("/contributions/images/{id}/update-extracted-data")
    public ResponseEntity<Map<String, Object>> updateExtractedData(
            @PathVariable String id,
            @RequestBody Map<String, Object> correctedData) {
        try {
            log.info("Request to update extracted data for contribution: {}", id);

            // Get the image contribution
            ImageContribution contribution = imageContributionOutputPort.findById(id)
                    .orElseThrow(() -> new RuntimeException("Image contribution not found: " + id));

            // Mark as manually corrected
            correctedData.put("manuallyCorrected", true);
            correctedData.put("correctedAt", LocalDateTime.now().toString());

            // Update the contribution with corrected data
            contribution.setExtractedData(correctedData.toString());
            contribution.setStatus("MANUAL_REVIEW_NEEDED");
            contribution.setValidationMessage("OCR data manually corrected by admin");
            contribution.setProcessedDate(LocalDateTime.now());
            imageContributionOutputPort.save(contribution);

            log.info("Successfully updated extracted data for contribution: {}", id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Extracted data updated successfully",
                    "contributionId", id));
        } catch (Exception e) {
            log.error("Error updating extracted data for contribution {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to update extracted data: " + e.getMessage()));
        }
    }

    // ==================== Social Media Monitoring Endpoints ====================

    /**
     * Get social media monitoring statistics
     * Only available if social media integration is enabled
     * 
     * @return Social media monitoring statistics
     */
    @GetMapping("/social-media/stats")
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
     * Useful for testing or forcing an immediate check
     * 
     * @return Monitoring results
     */
    @PostMapping("/social-media/monitor")
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

    /**
     * Request class for rejection operations
     */
    @Data
    public static class RejectContributionRequest {
        private String reason;
    }
}
