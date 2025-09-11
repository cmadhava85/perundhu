package com.perundhu.application.service;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.application.port.input.ImageContributionInputPort;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.infrastructure.adapter.output.RouteContributionOutputPort;
import com.perundhu.domain.service.OCRService;
import com.perundhu.infrastructure.adapter.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.scheduling.annotation.Async;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ImageContributionProcessingService implements ImageContributionInputPort {

    private static final Logger logger = LoggerFactory.getLogger(ImageContributionProcessingService.class);

    private final OCRService ocrService;
    private final FileStorageService fileStorageService;
    private final ImageContributionOutputPort imageContributionOutputPort;
    private final RouteContributionOutputPort routeContributionOutputPort;

    // Thread pool for async processing
    private final Executor asyncExecutor = Executors.newFixedThreadPool(5);

    /**
     * Process an uploaded bus schedule image
     * This is the main entry point for image contribution processing
     */
    public ImageContribution processImageContribution(
            MultipartFile imageFile,
            Map<String, String> metadata,
            String userId) {

        logger.info("Starting image contribution processing for user: {}", userId);

        try {
            // 1. Validate and store the image file
            String imageUrl = fileStorageService.storeImageFile(imageFile, userId);

            // 2. Create initial image contribution record
            ImageContribution contribution = createInitialContribution(imageFile, metadata, userId, imageUrl);
            ImageContribution saved = imageContributionOutputPort.save(contribution);

            // 3. Process asynchronously to avoid blocking the user
            processImageAsync(saved, imageFile);

            logger.info("Image contribution created with ID: {}", saved.getId());
            return saved;

        } catch (Exception e) {
            logger.error("Error processing image contribution for user {}: {}", userId, e.getMessage(), e);

            // Create a failed contribution record for tracking
            ImageContribution failedContribution = createFailedContribution(imageFile, metadata, userId,
                    e.getMessage());
            return imageContributionOutputPort.save(failedContribution);
        }
    }

    /**
     * Process image contribution asynchronously
     */
    private void processImageAsync(ImageContribution contribution, MultipartFile imageFile) {
        CompletableFuture.runAsync(() -> {
            try {
                processImageWithOCR(contribution, imageFile);
            } catch (Exception e) {
                logger.error("Async image processing failed for contribution {}: {}",
                        contribution.getId(), e.getMessage(), e);
                markProcessingFailed(contribution, e.getMessage());
            }
        }, asyncExecutor);
    }

    /**
     * Process image with OCR and extract bus schedule data
     */
    private void processImageWithOCR(ImageContribution contribution, MultipartFile imageFile) {
        logger.info("Starting OCR processing for contribution: {}", contribution.getId());

        try {
            // 1. Validate if image contains bus schedule
            if (!ocrService.isValidBusScheduleImage(imageFile)) {
                markProcessingFailed(contribution, "Image does not appear to contain bus schedule information");
                return;
            }

            // 2. Extract text using OCR
            String extractedText = ocrService.extractTextFromImage(imageFile);
            if (extractedText == null || extractedText.trim().isEmpty()) {
                markProcessingFailed(contribution, "Unable to extract text from image");
                return;
            }

            double confidence = ocrService.getExtractionConfidence(imageFile);
            logger.info("OCR extraction confidence: {} for contribution: {}", confidence, contribution.getId());

            // 3. Update contribution with extracted text
            contribution.setExtractedData(extractedText);

            // 4. Parse the extracted text into structured data
            if (confidence >= 0.6) { // High confidence - auto-process
                processHighConfidenceExtraction(contribution, extractedText);
            } else if (confidence >= 0.3) { // Medium confidence - manual review needed
                processMediumConfidenceExtraction(contribution, extractedText);
            } else { // Low confidence - mark for manual review
                processLowConfidenceExtraction(contribution, extractedText);
            }

        } catch (Exception e) {
            logger.error("OCR processing failed for contribution {}: {}", contribution.getId(), e.getMessage(), e);
            markProcessingFailed(contribution, "OCR processing failed: " + e.getMessage());
        }
    }

    /**
     * Process high confidence OCR results - attempt auto-approval
     */
    private void processHighConfidenceExtraction(ImageContribution contribution, String extractedText) {
        try {
            // Try to parse extracted text into route contributions
            List<RouteContribution> routes = ocrService.parseMultipleRoutes(extractedText);

            if (!routes.isEmpty()) {
                // Create route contributions from extracted data
                List<String> createdRouteIds = new ArrayList<>();

                for (RouteContribution route : routes) {
                    route.setUserId(contribution.getUserId());
                    route.setSubmissionDate(LocalDateTime.now());
                    route.setStatus("PENDING_REVIEW"); // Still needs manual verification
                    route.setAdditionalNotes("Auto-extracted from image contribution: " + contribution.getId());

                    RouteContribution savedRoute = routeContributionOutputPort.save(route);
                    createdRouteIds.add(savedRoute.getId());
                }

                // Update image contribution status
                contribution.setStatus("PROCESSED");
                contribution.setProcessedDate(LocalDateTime.now());
                contribution.setValidationMessage(
                        String.format("Successfully extracted %d route(s). Route IDs: %s",
                                routes.size(), String.join(", ", createdRouteIds)));

                logger.info("High confidence processing completed for contribution: {}, created {} routes",
                        contribution.getId(), routes.size());
            } else {
                processMediumConfidenceExtraction(contribution, extractedText);
            }

        } catch (Exception e) {
            logger.error("High confidence processing failed for contribution {}: {}",
                    contribution.getId(), e.getMessage(), e);
            processMediumConfidenceExtraction(contribution, extractedText);
        }

        imageContributionOutputPort.save(contribution);
    }

    /**
     * Process medium confidence OCR results - store for manual review
     */
    private void processMediumConfidenceExtraction(ImageContribution contribution, String extractedText) {
        try {
            // Attempt to parse what we can
            Map<String, Object> parsedData = ocrService.parseScheduleTextToMap(extractedText);

            contribution.setStatus("MANUAL_REVIEW_NEEDED");
            contribution.setProcessedDate(LocalDateTime.now());
            contribution.setValidationMessage(
                    "Medium confidence OCR extraction. Manual review required. " +
                            "Parsed data: " + parsedData.toString());

            logger.info("Medium confidence processing completed for contribution: {}", contribution.getId());

        } catch (Exception e) {
            logger.error("Medium confidence processing failed for contribution {}: {}",
                    contribution.getId(), e.getMessage(), e);
            processLowConfidenceExtraction(contribution, extractedText);
        }

        imageContributionOutputPort.save(contribution);
    }

    /**
     * Process low confidence OCR results - mark for manual processing
     */
    private void processLowConfidenceExtraction(ImageContribution contribution, String extractedText) {
        contribution.setStatus("LOW_CONFIDENCE_OCR");
        contribution.setProcessedDate(LocalDateTime.now());
        contribution.setValidationMessage(
                "Low confidence OCR extraction. Manual processing required. " +
                        "Raw extracted text available for review.");

        logger.info("Low confidence processing completed for contribution: {}", contribution.getId());
        imageContributionOutputPort.save(contribution);
    }

    /**
     * Mark image processing as failed
     */
    private void markProcessingFailed(ImageContribution contribution, String errorMessage) {
        contribution.setStatus("PROCESSING_FAILED");
        contribution.setProcessedDate(LocalDateTime.now());
        contribution.setValidationMessage("Processing failed: " + errorMessage);

        logger.warn("Processing failed for contribution {}: {}", contribution.getId(), errorMessage);
        imageContributionOutputPort.save(contribution);
    }

    /**
     * Create initial image contribution record
     */
    private ImageContribution createInitialContribution(
            MultipartFile imageFile,
            Map<String, String> metadata,
            String userId,
            String imageUrl) {

        return ImageContribution.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .imageUrl(imageUrl)
                .description(metadata.getOrDefault("description", "Bus schedule image"))
                .location(metadata.getOrDefault("location", ""))
                .routeName(metadata.getOrDefault("routeName", ""))
                .status("PROCESSING")
                .submissionDate(LocalDateTime.now())
                .additionalNotes(String.format("Original filename: %s, Size: %d bytes",
                        imageFile.getOriginalFilename(), imageFile.getSize()))
                .build();
    }

    /**
     * Create failed contribution record for tracking
     */
    private ImageContribution createFailedContribution(
            MultipartFile imageFile,
            Map<String, String> metadata,
            String userId,
            String errorMessage) {

        return ImageContribution.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .description(metadata.getOrDefault("description", "Bus schedule image"))
                .location(metadata.getOrDefault("location", ""))
                .routeName(metadata.getOrDefault("routeName", ""))
                .status("UPLOAD_FAILED")
                .submissionDate(LocalDateTime.now())
                .validationMessage("Upload failed: " + errorMessage)
                .additionalNotes(String.format("Failed upload attempt - Original filename: %s, Size: %d bytes",
                        imageFile.getOriginalFilename(), imageFile.getSize()))
                .build();
    }

    /**
     * Retry processing for failed image contributions
     */
    public boolean retryImageProcessing(String contributionId) {
        try {
            Optional<ImageContribution> optContribution = imageContributionOutputPort.findById(contributionId);
            if (optContribution.isEmpty()) {
                logger.warn("Image contribution not found for retry: {}", contributionId);
                return false;
            }

            ImageContribution contribution = optContribution.get();
            if (!canRetryProcessing(contribution)) {
                logger.warn("Cannot retry processing for contribution {}: status = {}",
                        contributionId, contribution.getStatus());
                return false;
            }

            // Reset status and retry processing
            contribution.setStatus("PROCESSING");
            contribution.setValidationMessage("Retrying processing...");
            imageContributionOutputPort.save(contribution);

            // Since we don't have the original file, work with the stored image
            CompletableFuture.runAsync(() -> {
                try {
                    retryOCRProcessing(contribution);
                } catch (Exception e) {
                    logger.error("Retry processing failed for contribution {}: {}",
                            contributionId, e.getMessage(), e);
                    markProcessingFailed(contribution, "Retry failed: " + e.getMessage());
                }
            }, asyncExecutor);

            return true;

        } catch (Exception e) {
            logger.error("Error retrying image processing for {}: {}", contributionId, e.getMessage(), e);
            return false;
        }
    }

    private boolean canRetryProcessing(ImageContribution contribution) {
        String status = contribution.getStatus();
        return "PROCESSING_FAILED".equals(status) ||
                "LOW_CONFIDENCE_OCR".equals(status) ||
                "UPLOAD_FAILED".equals(status);
    }

    private void retryOCRProcessing(ImageContribution contribution) {
        // For retry, we can't process from URL directly since OCR needs MultipartFile
        // Mark for manual review instead
        contribution.setStatus("MANUAL_REVIEW_NEEDED");
        contribution.setProcessedDate(LocalDateTime.now());
        contribution.setValidationMessage(
                "Retry processing: Image stored but original file no longer available. Manual review required.");

        logger.info("Retry processing marked for manual review: {}", contribution.getId());
        imageContributionOutputPort.save(contribution);
    }

    /**
     * Get processing statistics for admin dashboard
     */
    public Map<String, Object> getProcessingStatistics() {
        Map<String, Object> stats = new HashMap<>();

        try {
            long totalImages = imageContributionOutputPort.count();
            long processing = imageContributionOutputPort.countByStatus("PROCESSING");
            long processed = imageContributionOutputPort.countByStatus("PROCESSED");
            long failed = imageContributionOutputPort.countByStatus("PROCESSING_FAILED");
            long needsReview = imageContributionOutputPort.countByStatus("MANUAL_REVIEW_NEEDED");
            long lowConfidence = imageContributionOutputPort.countByStatus("LOW_CONFIDENCE_OCR");

            stats.put("totalImages", totalImages);
            stats.put("processing", processing);
            stats.put("processed", processed);
            stats.put("failed", failed);
            stats.put("needsReview", needsReview);
            stats.put("lowConfidence", lowConfidence);
            stats.put("successRate", totalImages > 0 ? (double) processed / totalImages * 100 : 0.0);

        } catch (Exception e) {
            logger.error("Error getting processing statistics: {}", e.getMessage(), e);
            stats.put("error", "Unable to retrieve statistics");
        }

        return stats;
    }

    /**
     * Extract OCR data from an image contribution
     * 
     * @param contribution The image contribution to process
     * @return Map containing extracted OCR data
     */
    public Map<String, Object> extractOCRData(ImageContribution contribution) {
        logger.info("Extracting OCR data from image contribution: {}", contribution.getId());

        try {
            // Extract text from the image URL
            String extractedText = ocrService.extractTextFromImage(contribution.getImageUrl());

            // Parse the text into structured data
            Map<String, Object> parsedData = ocrService.parseScheduleTextToMap(extractedText);

            // Add raw text and confidence information
            Map<String, Object> result = new HashMap<>(parsedData);
            result.put("extractedText", extractedText);
            result.put("confidence", calculateConfidence(extractedText, parsedData));
            result.put("extractedAt", LocalDateTime.now());

            logger.info("Successfully extracted OCR data from contribution: {}", contribution.getId());
            return result;

        } catch (Exception e) {
            logger.error("Failed to extract OCR data from contribution {}: {}",
                    contribution.getId(), e.getMessage(), e);

            // Return error data
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", e.getMessage());
            errorResult.put("confidence", 0.0);
            errorResult.put("extractedText", "");
            errorResult.put("extractedAt", LocalDateTime.now());
            return errorResult;
        }
    }

    /**
     * Create route data from OCR extracted information
     * 
     * @param contribution  The original image contribution
     * @param extractedData The OCR extracted data
     * @return List of created route contributions
     */
    public List<RouteContribution> createRouteDataFromOCR(
            ImageContribution contribution,
            Map<String, Object> extractedData) {

        logger.info("Creating route data from OCR for contribution: {}", contribution.getId());

        List<RouteContribution> createdRoutes = new ArrayList<>();

        try {
            // Extract route information from OCR data
            String routeNumber = (String) extractedData.get("routeNumber");
            String fromLocation = (String) extractedData.get("fromLocation");
            String toLocation = (String) extractedData.get("toLocation");
            String operatorName = (String) extractedData.get("operatorName");
            String fare = (String) extractedData.get("fare");
            @SuppressWarnings("unchecked")
            List<String> timings = (List<String>) extractedData.get("timing");

            // Create route contribution for the main route
            if (routeNumber != null && fromLocation != null && toLocation != null) {
                RouteContribution routeContribution = createRouteContribution(
                        contribution, routeNumber, fromLocation, toLocation,
                        operatorName, fare, timings);

                RouteContribution savedRoute = routeContributionOutputPort.save(routeContribution);
                createdRoutes.add(savedRoute);

                logger.info("Created route contribution: {} -> {} (Route: {})",
                        fromLocation, toLocation, routeNumber);
            }

            // If there are multiple routes detected, create additional entries
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> multipleRoutes = (List<Map<String, Object>>) extractedData.get("multipleRoutes");

            if (multipleRoutes != null) {
                for (Map<String, Object> routeData : multipleRoutes) {
                    RouteContribution additionalRoute = createRouteContribution(
                            contribution,
                            (String) routeData.get("routeNumber"),
                            (String) routeData.get("fromLocation"),
                            (String) routeData.get("toLocation"),
                            (String) routeData.get("operatorName"),
                            (String) routeData.get("fare"),
                            (List<String>) routeData.get("timing"));

                    RouteContribution savedAdditionalRoute = routeContributionOutputPort.save(additionalRoute);
                    createdRoutes.add(savedAdditionalRoute);
                }
            }

            logger.info("Successfully created {} route entries from OCR data", createdRoutes.size());

        } catch (Exception e) {
            logger.error("Failed to create route data from OCR for contribution {}: {}",
                    contribution.getId(), e.getMessage(), e);
        }

        return createdRoutes;
    }

    /**
     * Create a route contribution from extracted data
     */
    private RouteContribution createRouteContribution(
            ImageContribution imageContribution,
            String routeNumber,
            String fromLocation,
            String toLocation,
            String operatorName,
            String fare,
            List<String> timings) {

        RouteContribution.RouteContributionBuilder builder = RouteContribution.builder()
                .id(UUID.randomUUID().toString())
                .userId(imageContribution.getUserId())
                .busNumber(routeNumber)
                .fromLocationName(fromLocation)
                .toLocationName(toLocation)
                .submissionDate(LocalDateTime.now())
                .status("PENDING_REVIEW") // Routes created from images need review
                .additionalNotes("Auto-created from image contribution: " + imageContribution.getId());

        // Add operator information if available
        if (operatorName != null && !operatorName.isBlank()) {
            builder.additionalNotes(builder.build().getAdditionalNotes() +
                    ". Operator: " + operatorName);
        }

        // Add fare information if available
        if (fare != null && !fare.isBlank()) {
            builder.additionalNotes(builder.build().getAdditionalNotes() +
                    ". Fare: " + fare);
        }

        // Add timing information if available
        if (timings != null && !timings.isEmpty()) {
            builder.additionalNotes(builder.build().getAdditionalNotes() +
                    ". Timings: " + String.join(", ", timings));
        }

        return builder.build();
    }

    /**
     * Calculate confidence score based on extracted text and parsed data
     */
    private double calculateConfidence(String extractedText, Map<String, Object> parsedData) {
        if (extractedText == null || extractedText.trim().isEmpty()) {
            return 0.0;
        }

        double confidence = 0.0;

        // Base confidence from text length and quality
        if (extractedText.length() > 20)
            confidence += 0.2;
        if (extractedText.length() > 50)
            confidence += 0.1;

        // Check for key route information
        if (parsedData.get("routeNumber") != null)
            confidence += 0.2;
        if (parsedData.get("fromLocation") != null)
            confidence += 0.2;
        if (parsedData.get("toLocation") != null)
            confidence += 0.2;

        // Check for timing information
        @SuppressWarnings("unchecked")
        List<String> timings = (List<String>) parsedData.get("timing");
        if (timings != null && !timings.isEmpty()) {
            confidence += 0.1;
        }

        // Additional checks for common bus schedule keywords
        String lowerText = extractedText.toLowerCase();
        if (lowerText.contains("bus") || lowerText.contains("route") ||
                lowerText.contains("schedule") || lowerText.contains("time")) {
            confidence += 0.1;
        }

        return Math.min(confidence, 1.0); // Cap at 1.0
    }
}