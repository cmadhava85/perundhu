package com.perundhu.adapter.in.rest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.adapter.in.rest.dto.ImageContributionSummaryDTO;
import com.perundhu.application.port.in.AdminUseCase;
import com.perundhu.application.service.ContributionProcessingService;
import com.perundhu.application.service.ImageContributionProcessingService;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.ImageContributionOutputPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for image contribution admin operations.
 * Follows Single Responsibility Principle - handles only image admin operations.
 */
@RestController
@RequestMapping("/admin/contributions/images")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class ImageAdminController {

    private final AdminUseCase adminUseCase;
    private final ImageContributionProcessingService imageProcessingService;
    private final ContributionProcessingService contributionProcessingService;
    private final ImageContributionOutputPort imageContributionOutputPort;

    /**
     * Get all image contributions with pagination
     *
     * @param page page number (default 0)
     * @param size page size (default 50)
     * @return Paginated list of all image contributions
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllImageContributions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.info("Request to get all image contributions - page: {}, size: {}", page, size);
        List<ImageContribution> contributions = adminUseCase.getImageContributionsPaged(page, size);
        long total = adminUseCase.countAllImageContributions();

        List<ImageContributionSummaryDTO> dtos = contributions.stream()
            .map(this::convertToSummaryDTO)
            .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("data", dtos);
        response.put("total", total);
        response.put("page", page);
        response.put("size", size);
        response.put("totalPages", (int) Math.ceil((double) total / size));
        log.info("Returning {} image contributions (total: {})", dtos.size(), total);
        return ResponseEntity.ok(response);
    }

    /**
     * Get pending image contributions with pagination
     * 
     * @param page   Page number (default 0)
     * @param size   Page size (default 20)
     * @return Paginated list of pending image contributions
     */
    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> getPendingImageContributions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Request to get pending image contributions - page: {}, size: {}", page, size);
        
        long startTime = System.currentTimeMillis();
        
        List<ImageContribution> contributions = adminUseCase.getPendingImageContributionsPaged(page, size);
        long totalCount = adminUseCase.countPendingImageContributions();
        
        List<ImageContributionSummaryDTO> dtos = contributions.parallelStream()
            .map(this::convertToSummaryDTO)
            .collect(Collectors.toList());
        
        long duration = System.currentTimeMillis() - startTime;
        log.info("Returning {} pending image contributions (total: {}) in {}ms", 
            dtos.size(), totalCount, duration);
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", dtos);
        response.put("total", totalCount);
        response.put("page", page);
        response.put("size", size);
        response.put("totalPages", (int) Math.ceil((double) totalCount / size));
        response.put("duration_ms", duration);
        
        return ResponseEntity.ok(response);
    }
    
    private ImageContributionSummaryDTO convertToSummaryDTO(ImageContribution contribution) {
        return ImageContributionSummaryDTO.builder()
            .id(contribution.getId())
            .userId(contribution.getUserId())
            .imageUrl(contribution.getImageUrl())
            .description(contribution.getDescription())
            .location(contribution.getLocation())
            .routeName(contribution.getRouteName())
            .extractedData(contribution.getExtractedData())
            .status(contribution.getStatus())
            .validationMessage(contribution.getValidationMessage())
            .additionalNotes(contribution.getAdditionalNotes())
            .submissionDate(contribution.getSubmissionDate())
            .processedDate(contribution.getProcessedDate())
            .imageContentType(contribution.getImageContentType())
            .build();
    }

    /**
     * Approve an image contribution with enhanced OCR processing
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveImageContribution(@PathVariable String id,
            @RequestBody Map<String, Object> requestBody) {
        try {
            log.info("Request to approve image contribution with id: {}", id);

            String approvalNotes = (String) requestBody.get("approvalNotes");
            Boolean extractOCRData = (Boolean) requestBody.getOrDefault("extractOCRData", false);

            ImageContribution contribution = imageContributionOutputPort.findById(id)
                    .orElseThrow(() -> new RuntimeException("Image contribution not found: " + id));

            Map<String, Object> result = new HashMap<>();

            if (extractOCRData) {
                Map<String, Object> extractedData = imageProcessingService.extractOCRData(contribution);
                List<RouteContribution> createdRoutes = imageProcessingService.createRouteDataFromOCR(
                        contribution, extractedData, true);

                var batchResult = contributionProcessingService.integrateApprovedContributionsBatch(createdRoutes);
                
                contribution.setExtractedData(extractedData.toString());
                contribution.setStatus("APPROVED");
                contribution.setProcessedDate(LocalDateTime.now());
                String validationMsg = String.format(
                        "Approved with OCR extraction. Created %d route entries, integrated %d into bus database.",
                        createdRoutes.size(), batchResult.integratedCount());
                if (batchResult.skippedCount() > 0) {
                    validationMsg += String.format(" (%d skipped - missing data)", batchResult.skippedCount());
                }
                contribution.setValidationMessage(validationMsg);
                if (approvalNotes != null && !approvalNotes.isBlank()) {
                    contribution.setAdditionalNotes(approvalNotes);
                }

                ImageContribution savedContribution = imageContributionOutputPort.save(contribution);

                result.put("contribution", savedContribution);
                result.put("extractedData", extractedData);
                result.put("createdRoutes", createdRoutes.size());
                result.put("integratedRoutes", batchResult.integratedCount());
            } else {
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
     */
    @PostMapping("/{id}/reject")
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
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImageContribution(@PathVariable String id) {
        log.info("Request to delete image contribution with id: {}", id);
        adminUseCase.deleteImageContribution(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Extract OCR data from an image contribution
     */
    @PostMapping("/{id}/extract-ocr")
    public ResponseEntity<Map<String, Object>> extractOCRFromContribution(@PathVariable String id) {
        try {
            log.info("Request to extract OCR from image contribution with id: {}", id);

            ImageContribution contribution = imageContributionOutputPort.findById(id)
                    .orElseThrow(() -> new RuntimeException("Image contribution not found: " + id));

            Map<String, Object> extractedData = imageProcessingService.extractOCRData(contribution);

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
     * Update the extracted OCR data for an image contribution
     */
    @PutMapping("/{id}/update-extracted-data")
    public ResponseEntity<Map<String, Object>> updateExtractedData(
            @PathVariable String id,
            @RequestBody Map<String, Object> correctedData) {
        try {
            log.info("Request to update extracted data for contribution: {}", id);

            ImageContribution contribution = imageContributionOutputPort.findById(id)
                    .orElseThrow(() -> new RuntimeException("Image contribution not found: " + id));

            correctedData.put("manuallyCorrected", true);
            correctedData.put("correctedAt", LocalDateTime.now().toString());

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

    /**
     * Serve image data for contributions
     */
    @GetMapping("/{id}/data")
    public ResponseEntity<byte[]> getImageData(@PathVariable String id) {
        try {
            log.debug("Request to fetch image data for contribution: {}", id);
            
            Optional<ImageContribution> optionalContribution = imageContributionOutputPort.findById(id);
            
            if (optionalContribution.isEmpty()) {
                log.warn("Image contribution not found: {}", id);
                return ResponseEntity.notFound().build();
            }
            
            ImageContribution contribution = optionalContribution.get();
            byte[] imageData = contribution.getImageData();
            
            if (imageData == null || imageData.length == 0) {
                log.warn("Image data not found for contribution: {}", id);
                return ResponseEntity.notFound().build();
            }
            
            String contentType = contribution.getImageContentType();
            if (contentType == null || contentType.isBlank()) {
                contentType = "image/jpeg";
            }
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "inline; filename=\"" + id + ".jpg\"")
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                    .body(imageData);
                    
        } catch (Exception e) {
            log.error("Error retrieving image data for contribution {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
