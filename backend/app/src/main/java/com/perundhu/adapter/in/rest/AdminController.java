package com.perundhu.adapter.in.rest;

import com.perundhu.application.port.in.AdminUseCase;
import com.perundhu.application.service.ImageContributionProcessingService;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.port.ImageContributionOutputPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    private final ImageContributionOutputPort imageContributionOutputPort;

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
                Map<String, Object> extractedData = imageProcessingService.extractOCRData(contribution);
                List<RouteContribution> createdRoutes = imageProcessingService.createRouteDataFromOCR(
                        contribution, extractedData);

                // Update contribution
                contribution.setExtractedData(extractedData.toString());
                contribution.setStatus("APPROVED");
                contribution.setProcessedDate(LocalDateTime.now());
                contribution.setValidationMessage("Approved with OCR extraction. Created " +
                        createdRoutes.size() + " route entries.");
                if (approvalNotes != null && !approvalNotes.isBlank()) {
                    contribution.setAdditionalNotes(approvalNotes);
                }

                ImageContribution savedContribution = imageContributionOutputPort.save(contribution);

                result.put("contribution", savedContribution);
                result.put("extractedData", extractedData);
                result.put("createdRoutes", createdRoutes.size());
                result.put("routeIds", createdRoutes.stream().map(RouteContribution::getId).toList());

                log.info("Successfully approved image contribution {} and created {} route entries",
                        id, createdRoutes.size());
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
     * Request class for rejection operations
     */
    @Data
    public static class RejectContributionRequest {
        private String reason;
    }
}
