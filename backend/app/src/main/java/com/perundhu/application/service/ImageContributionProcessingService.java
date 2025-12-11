package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import javax.annotation.PreDestroy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.perundhu.application.port.input.ImageContributionInputPort;
import com.perundhu.domain.model.FileUpload;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.StopContribution;
import com.perundhu.domain.port.FileStorageService;
import com.perundhu.domain.port.GeminiVisionService;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.port.RouteContributionOutputPort;

import org.springframework.context.annotation.Lazy;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ImageContributionProcessingService implements ImageContributionInputPort {

    private static final Logger logger = LoggerFactory.getLogger(ImageContributionProcessingService.class);

    private final FileStorageService fileStorageService;
    private final ImageContributionOutputPort imageContributionOutputPort;
    private final RouteContributionOutputPort routeContributionOutputPort;
    private final LocationResolutionService locationResolutionService;
    private final GeminiVisionService geminiVisionService;
    @Lazy
    private final ContributionProcessingService contributionProcessingService;

    // Thread pool for async processing
    private final ExecutorService asyncExecutor = Executors.newFixedThreadPool(5);

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
            FileUpload fileUpload = convertToFileUpload(imageFile);
            String imageUrl = fileStorageService.storeImageFile(fileUpload, userId);

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
     * Process image with Gemini Vision AI to extract bus schedule data
     */
    private void processImageWithOCR(ImageContribution contribution, MultipartFile imageFile) {
        logger.info("Starting image processing for contribution: {}", contribution.getId());

        try {
            // Use Gemini Vision AI for image processing
            if (geminiVisionService.isAvailable()) {
                logger.info("Using Gemini Vision AI for image processing");
                processWithGeminiVision(contribution, imageFile);
                return;
            }

            // Gemini not available - mark for manual entry
            logger.warn("Gemini Vision AI not available. Marking contribution for manual entry.");
            markForManualEntry(contribution, "AI image processing not available. Please enter route details manually.");

        } catch (Exception e) {
            logger.error("Image processing failed for contribution {}: {}", contribution.getId(), e.getMessage(), e);
            markProcessingFailed(contribution, "Image processing failed: " + e.getMessage());
        }
    }

    /**
     * Mark contribution for manual entry when AI processing is not available
     */
    private void markForManualEntry(ImageContribution contribution, String message) {
        contribution.setStatus("MANUAL_ENTRY_REQUIRED");
        contribution.setProcessedDate(LocalDateTime.now());
        contribution.setValidationMessage(message);
        imageContributionOutputPort.save(contribution);
        logger.info("Contribution {} marked for manual entry", contribution.getId());
    }

    /**
     * Process image using Gemini Vision AI for semantic understanding
     */
    private void processWithGeminiVision(ImageContribution contribution, MultipartFile imageFile) {
        try {
            // Use stored image data from contribution (MultipartFile may be invalid after
            // async)
            byte[] imageBytes = contribution.getImageData();

            // Fallback to MultipartFile only if imageData is not stored
            if (imageBytes == null || imageBytes.length == 0) {
                try {
                    imageBytes = imageFile.getBytes();
                } catch (Exception e) {
                    logger.error("Failed to read image bytes from MultipartFile: {}", e.getMessage());
                    markProcessingFailed(contribution, "Image data unavailable for processing");
                    return;
                }
            }

            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            // Use stored MIME type from contribution
            String mimeType = contribution.getImageContentType();
            if (mimeType == null || mimeType.isEmpty()) {
                mimeType = "image/jpeg"; // Default
            }

            // Extract structured data using Gemini Vision
            Map<String, Object> extractedData = geminiVisionService.extractBusScheduleFromBase64(base64Image, mimeType);

            if (extractedData == null || extractedData.isEmpty()) {
                logger.warn("Gemini Vision returned empty data, marking for manual entry");
                markForManualEntry(contribution,
                        "AI could not extract data from image. Please enter route details manually.");
                return;
            }

            // Check if extraction was successful
            if (extractedData.containsKey("error")) {
                logger.error("Gemini Vision extraction error: {}", extractedData.get("error"));
                markForManualEntry(contribution, "AI extraction error: " + extractedData.get("error")
                        + ". Please enter route details manually.");
                return;
            }

            // Get confidence from Gemini response
            double confidence = extractedData.containsKey("confidence")
                    ? ((Number) extractedData.get("confidence")).doubleValue()
                    : 0.8; // Default high confidence for Gemini

            logger.info("Gemini Vision extraction confidence: {} for contribution: {}", confidence,
                    contribution.getId());

            // Store extracted data as JSON string
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                contribution.setExtractedData(mapper.writeValueAsString(extractedData));
            } catch (Exception e) {
                contribution.setExtractedData(extractedData.toString());
            }

            // Process based on confidence
            if (confidence >= 0.6) {
                processHighConfidenceGeminiExtraction(contribution, extractedData);
            } else if (confidence >= 0.3) {
                processMediumConfidenceGeminiExtraction(contribution, extractedData);
            } else {
                processLowConfidenceGeminiExtraction(contribution, extractedData);
            }

        } catch (Exception e) {
            logger.error("Gemini Vision processing failed for contribution {}: {}",
                    contribution.getId(), e.getMessage(), e);
            markProcessingFailed(contribution, "AI image processing failed: " + e.getMessage());
        }
    }

    /**
     * Process high confidence Gemini Vision extraction
     */
    private void processHighConfidenceGeminiExtraction(ImageContribution contribution,
            Map<String, Object> extractedData) {
        try {
            List<RouteContribution> routes = createRouteContributionsFromGeminiData(contribution, extractedData);

            if (!routes.isEmpty()) {
                List<RouteContribution> savedRoutes = new ArrayList<>();
                List<String> createdRouteIds = new ArrayList<>();
                for (RouteContribution route : routes) {
                    RouteContribution savedRoute = routeContributionOutputPort.save(route);
                    savedRoutes.add(savedRoute);
                    createdRouteIds.add(savedRoute.getId());
                }

                // Immediately integrate approved routes into the bus database
                // This avoids waiting for the hourly scheduled job
                try {
                    var integrationResult = contributionProcessingService
                            .integrateApprovedContributionsBatch(savedRoutes);
                    logger.info("Immediate integration completed: {} integrated, {} skipped, {} failed",
                            integrationResult.integratedCount(), integrationResult.skippedCount(),
                            integrationResult.failedCount());

                    contribution.setStatus("INTEGRATED");
                    contribution.setValidationMessage(
                            String.format(
                                    "[Gemini AI] Extracted and integrated %d route(s). %d skipped (duplicates/invalid). Route IDs: %s",
                                    integrationResult.integratedCount(), integrationResult.skippedCount(),
                                    String.join(", ", createdRouteIds)));
                } catch (Exception integrationError) {
                    logger.warn("Immediate integration failed, routes will be integrated by scheduled job: {}",
                            integrationError.getMessage());
                    contribution.setStatus("PROCESSED");
                    contribution.setValidationMessage(
                            String.format(
                                    "[Gemini AI] Successfully extracted %d route(s). Pending integration. Route IDs: %s",
                                    routes.size(), String.join(", ", createdRouteIds)));
                }

                contribution.setProcessedDate(LocalDateTime.now());

                logger.info("Gemini high confidence processing completed for contribution: {}, created {} routes",
                        contribution.getId(), routes.size());
            } else {
                processMediumConfidenceGeminiExtraction(contribution, extractedData);
            }

        } catch (Exception e) {
            logger.error("Gemini high confidence processing failed: {}", e.getMessage(), e);
            processMediumConfidenceGeminiExtraction(contribution, extractedData);
        }

        imageContributionOutputPort.save(contribution);
    }

    /**
     * Process medium confidence Gemini Vision extraction
     */
    private void processMediumConfidenceGeminiExtraction(ImageContribution contribution,
            Map<String, Object> extractedData) {
        contribution.setStatus("MANUAL_REVIEW_NEEDED");
        contribution.setProcessedDate(LocalDateTime.now());
        contribution.setValidationMessage(
                "[Gemini AI] Medium confidence extraction. Manual review required. " +
                        "Extracted data available for verification.");

        logger.info("Gemini medium confidence processing completed for contribution: {}", contribution.getId());
        imageContributionOutputPort.save(contribution);
    }

    /**
     * Process low confidence Gemini Vision extraction
     */
    private void processLowConfidenceGeminiExtraction(ImageContribution contribution,
            Map<String, Object> extractedData) {
        contribution.setStatus("LOW_CONFIDENCE_OCR");
        contribution.setProcessedDate(LocalDateTime.now());
        contribution.setValidationMessage(
                "[Gemini AI] Low confidence extraction. Manual processing required. " +
                        "Extracted data may be incomplete or inaccurate.");

        logger.info("Gemini low confidence processing completed for contribution: {}", contribution.getId());
        imageContributionOutputPort.save(contribution);
    }

    /**
     * Create route contributions from Gemini extracted data
     */
    @SuppressWarnings("unchecked")
    private List<RouteContribution> createRouteContributionsFromGeminiData(
            ImageContribution contribution, Map<String, Object> extractedData) {

        List<RouteContribution> routes = new ArrayList<>();

        try {
            String origin = (String) extractedData.get("origin");

            // Handle grouped routes (routes grouped by destination)
            List<Map<String, Object>> groupedRoutes = (List<Map<String, Object>>) extractedData.get("groupedRoutes");
            if (groupedRoutes != null && !groupedRoutes.isEmpty()) {
                for (Map<String, Object> group : groupedRoutes) {
                    String destination = (String) group.get("destination");
                    List<Map<String, Object>> routesList = (List<Map<String, Object>>) group.get("routes");

                    if (routesList != null) {
                        for (Map<String, Object> routeData : routesList) {
                            // Create one route per departure time
                            List<RouteContribution> expandedRoutes = createExpandedRoutesFromGeminiData(
                                    contribution, origin, destination, routeData);
                            routes.addAll(expandedRoutes);
                        }
                    }
                }
            }

            // Handle routes from 'routes' array (from Gemini pipe-delimited format)
            List<Map<String, Object>> routesArray = (List<Map<String, Object>>) extractedData.get("routes");
            if (routesArray != null && !routesArray.isEmpty()) {
                for (Map<String, Object> routeData : routesArray) {
                    String fromLocation = (String) routeData.get("fromLocation");
                    String toLocation = (String) routeData.get("toLocation");

                    // Create one route per departure time
                    List<RouteContribution> expandedRoutes = createExpandedRoutesFromGeminiData(
                            contribution,
                            fromLocation != null ? fromLocation : origin,
                            toLocation,
                            routeData);
                    routes.addAll(expandedRoutes);
                }
            }

            // Handle multiple routes (flat list) - legacy format
            List<Map<String, Object>> multipleRoutes = (List<Map<String, Object>>) extractedData.get("multipleRoutes");
            if (multipleRoutes != null && !multipleRoutes.isEmpty()) {
                for (Map<String, Object> routeData : multipleRoutes) {
                    String fromLocation = (String) routeData.get("fromLocation");
                    String toLocation = (String) routeData.get("toLocation");

                    // Create one route per departure time
                    List<RouteContribution> expandedRoutes = createExpandedRoutesFromGeminiData(
                            contribution,
                            fromLocation != null ? fromLocation : origin,
                            toLocation,
                            routeData);
                    routes.addAll(expandedRoutes);
                }
            }

            logger.info(
                    "Created {} route contributions from Gemini data for contribution: {} (expanded from departure times)",
                    routes.size(), contribution.getId());

        } catch (Exception e) {
            logger.error("Error creating route contributions from Gemini data: {}", e.getMessage(), e);
        }

        return routes;
    }

    /**
     * Create expanded route contributions - one per departure time.
     * If a route has 97 departure times (like Madurai), this creates 97
     * RouteContribution entries.
     */
    @SuppressWarnings("unchecked")
    private List<RouteContribution> createExpandedRoutesFromGeminiData(
            ImageContribution contribution,
            String origin,
            String destination,
            Map<String, Object> routeData) {

        List<RouteContribution> routes = new ArrayList<>();

        try {
            String routeNumber = (String) routeData.get("routeNumber");
            String via = (String) routeData.get("via");

            // Get all departure times
            List<String> departureTimes = (List<String>) routeData.get("departureTimes");
            if (departureTimes == null) {
                departureTimes = (List<String>) routeData.get("timings");
            }

            // Fallback to single departureTime
            String singleDepartureTime = (String) routeData.get("departureTime");
            if ((departureTimes == null || departureTimes.isEmpty()) && singleDepartureTime != null) {
                departureTimes = List.of(singleDepartureTime);
            }

            // Validate locations
            String validatedFrom = validateAndResolveLocation(origin);
            String validatedTo = validateAndResolveLocation(destination);

            if (validatedFrom == null || validatedTo == null || validatedFrom.equals(validatedTo)) {
                logger.warn("Skipping Gemini route: invalid locations - from='{}', to='{}'", origin, destination);
                return routes;
            }

            // Generate route group ID for grouping related schedules
            String routeGroupId = generateRouteGroupId(validatedFrom, validatedTo, via);

            // Create one route contribution per departure time
            if (departureTimes != null && !departureTimes.isEmpty()) {
                int totalSchedules = departureTimes.size();
                int scheduleIndex = 0;

                for (String departureTime : departureTimes) {
                    scheduleIndex++;

                    // Estimate arrival time based on departure and route
                    String estimatedArrival = estimateArrivalTime(departureTime, validatedFrom, validatedTo);

                    RouteContribution route = RouteContribution.builder()
                            .id(UUID.randomUUID().toString())
                            .userId(contribution.getUserId())
                            .busNumber(routeNumber != null ? routeNumber : "UNKNOWN")
                            .fromLocationName(validatedFrom)
                            .toLocationName(validatedTo)
                            .departureTime(departureTime)
                            .arrivalTime(estimatedArrival)
                            .scheduleInfo(via != null && !via.isBlank() ? "Via: " + via : null)
                            .submissionDate(LocalDateTime.now())
                            .status("APPROVED")
                            .sourceImageId(contribution.getId())
                            .routeGroupId(routeGroupId)
                            .additionalNotes(
                                    String.format("[Gemini AI] Auto-approved schedule %d of %d from image: %s",
                                            scheduleIndex, totalSchedules, contribution.getId()))
                            .build();

                    routes.add(route);
                }

                logger.debug("Created {} routes for {} -> {} (departures: {})",
                        routes.size(), validatedFrom, validatedTo, totalSchedules);
            } else {
                logger.warn("No departure times found for route {} -> {}", origin, destination);
            }

        } catch (Exception e) {
            logger.error("Error creating expanded routes from Gemini data: {}", e.getMessage(), e);
        }

        return routes;
    }

    /**
     * Create a single route contribution from Gemini route data
     */
    @SuppressWarnings("unchecked")
    private RouteContribution createRouteFromGeminiRouteData(
            ImageContribution contribution,
            String origin,
            String destination,
            Map<String, Object> routeData) {

        try {
            String routeNumber = (String) routeData.get("routeNumber");
            String via = (String) routeData.get("via");
            String departureTime = (String) routeData.get("departureTime");
            List<String> departureTimes = (List<String>) routeData.get("departureTimes");

            // Validate locations
            String validatedFrom = validateAndResolveLocation(origin);
            String validatedTo = validateAndResolveLocation(destination);

            if (validatedFrom == null || validatedTo == null || validatedFrom.equals(validatedTo)) {
                logger.warn("Skipping Gemini route: invalid locations - from='{}', to='{}'", origin, destination);
                return null;
            }

            // Build timing list - use the first departure time for this contribution
            String primaryDepartureTime = null;
            if (departureTime != null && !departureTime.isEmpty()) {
                primaryDepartureTime = departureTime;
            } else if (departureTimes != null && !departureTimes.isEmpty()) {
                primaryDepartureTime = departureTimes.get(0);
            }

            // Generate route group ID for grouping related schedules
            String routeGroupId = generateRouteGroupId(validatedFrom, validatedTo, via);

            return RouteContribution.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(contribution.getUserId())
                    .busNumber(routeNumber != null ? routeNumber : "UNKNOWN")
                    .fromLocationName(validatedFrom)
                    .toLocationName(validatedTo)
                    .departureTime(primaryDepartureTime)
                    .scheduleInfo(via != null && !via.isBlank() ? "Via: " + via : null)
                    .submissionDate(LocalDateTime.now())
                    .status("APPROVED")
                    .sourceImageId(contribution.getId())
                    .routeGroupId(routeGroupId)
                    .additionalNotes(
                            "[Gemini AI] Auto-approved from high-confidence image extraction: " + contribution.getId())
                    .build();

        } catch (Exception e) {
            logger.error("Error creating route from Gemini data: {}", e.getMessage(), e);
            return null;
        }
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

        // Store image bytes directly in database for persistent storage (Cloud Run
        // compatible)
        byte[] imageData = null;
        String contentType = "image/jpeg";
        try {
            imageData = imageFile.getBytes();
            contentType = imageFile.getContentType() != null ? imageFile.getContentType() : "image/jpeg";
            logger.info("Storing image data in database: {} bytes, type: {}", imageData.length, contentType);
        } catch (Exception e) {
            logger.warn("Failed to read image bytes for database storage: {}", e.getMessage());
        }

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
                .imageData(imageData)
                .imageContentType(contentType)
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

        // Truncate error message to fit database column (max 255 chars)
        String truncatedError = errorMessage != null && errorMessage.length() > 200
                ? errorMessage.substring(0, 200) + "..."
                : errorMessage;

        return ImageContribution.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .imageUrl("failed-upload") // Placeholder for failed uploads
                .description(metadata.getOrDefault("description", "Bus schedule image"))
                .location(metadata.getOrDefault("location", ""))
                .routeName(metadata.getOrDefault("routeName", ""))
                .status("UPLOAD_FAILED")
                .submissionDate(LocalDateTime.now())
                .validationMessage("Upload failed: " + truncatedError)
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
            // Try Gemini Vision first if available (provides better semantic understanding)
            if (geminiVisionService.isAvailable()) {
                logger.info("Using Gemini Vision AI for OCR extraction");

                // First try to read image bytes from database (persistent storage for Cloud
                // Run)
                byte[] imageBytes = contribution.getImageData();
                String mimeType = contribution.getImageContentType();

                // If not in database, try filesystem (for backward compatibility)
                if (imageBytes == null || imageBytes.length == 0) {
                    logger.info("Image data not in database, trying filesystem...");
                    imageBytes = fileStorageService.getImageBytes(contribution.getImageUrl());
                    mimeType = fileStorageService.getImageContentType(contribution.getImageUrl());
                }

                if (imageBytes != null && imageBytes.length > 0) {
                    String base64Image = Base64.getEncoder().encodeToString(imageBytes);
                    if (mimeType == null || mimeType.isEmpty()) {
                        mimeType = "image/jpeg";
                    }

                    logger.info("Sending image to Gemini Vision (size: {} bytes, type: {})",
                            imageBytes.length, mimeType);

                    Map<String, Object> geminiResult = geminiVisionService.extractBusScheduleFromBase64(base64Image,
                            mimeType);

                    if (geminiResult != null && !geminiResult.containsKey("error")) {
                        // Add metadata
                        geminiResult.put("extractedAt", LocalDateTime.now().toString());
                        geminiResult.put("extractionMethod", "gemini-vision");

                        // Calculate confidence if not present
                        if (!geminiResult.containsKey("confidence")) {
                            geminiResult.put("confidence", 0.85); // Default high confidence for Gemini
                        }

                        logger.info("Successfully extracted OCR data using Gemini Vision for contribution: {}",
                                contribution.getId());
                        return geminiResult;
                    } else {
                        String errorMsg = geminiResult != null ? String.valueOf(geminiResult.get("message"))
                                : "Unknown error";
                        logger.warn("Gemini Vision extraction failed: {}, falling back to traditional OCR", errorMsg);
                    }
                } else {
                    logger.warn("Could not read image bytes from storage");
                }
            } else {
                logger.warn("Gemini Vision service not available");
            }

            // If we reach here, Gemini Vision extraction failed
            // Mark for manual entry instead of using OCR
            logger.info("AI extraction failed, marking contribution {} for manual entry", contribution.getId());

            Map<String, Object> manualEntryResult = new HashMap<>();
            manualEntryResult.put("error", "AI extraction failed - manual entry required");
            manualEntryResult.put("requiresManualEntry", true);
            manualEntryResult.put("confidence", 0.0);
            manualEntryResult.put("extractedText", "");
            manualEntryResult.put("extractedAt", LocalDateTime.now().toString());
            manualEntryResult.put("extractionMethod", "manual-required");

            return manualEntryResult;

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
        // Default: routes need review (PENDING_REVIEW status)
        return createRouteDataFromOCR(contribution, extractedData, false);
    }

    /**
     * Create route data from OCR extracted text with optional auto-approval.
     * When autoApprove is true, routes are created with APPROVED status directly.
     * 
     * @param contribution  The original image contribution
     * @param extractedData The OCR extracted data
     * @param autoApprove   If true, routes are created as APPROVED (admin has
     *                      approved)
     * @return List of created route contributions
     */
    public List<RouteContribution> createRouteDataFromOCR(
            ImageContribution contribution,
            Map<String, Object> extractedData,
            boolean autoApprove) {
        String status = autoApprove ? "APPROVED" : "PENDING_REVIEW";

        logger.info("Creating route data from OCR for contribution: {}", contribution.getId());

        List<RouteContribution> createdRoutes = new ArrayList<>();
        int skippedRoutes = 0;

        try {
            // Extract route information from OCR data
            String routeNumber = (String) extractedData.get("routeNumber");
            String fromLocation = (String) extractedData.get("fromLocation");
            String toLocation = (String) extractedData.get("toLocation");
            String operatorName = (String) extractedData.get("operatorName");
            String fare = (String) extractedData.get("fare");
            @SuppressWarnings("unchecked")
            List<String> timings = (List<String>) extractedData.get("timing");

            // Validate and resolve locations for the main route
            if (routeNumber != null && fromLocation != null && toLocation != null) {
                String validatedFrom = validateAndResolveLocation(fromLocation);
                String validatedTo = validateAndResolveLocation(toLocation);

                if (validatedFrom != null && validatedTo != null && !validatedFrom.equals(validatedTo)) {
                    RouteContribution routeContribution = createRouteContribution(
                            contribution, routeNumber, validatedFrom, validatedTo,
                            operatorName, fare, timings, status);

                    RouteContribution savedRoute = routeContributionOutputPort.save(routeContribution);
                    createdRoutes.add(savedRoute);

                    logger.info("Created route contribution: {} -> {} (Route: {})",
                            validatedFrom, validatedTo, routeNumber);
                } else {
                    logger.warn(
                            "Skipping main route: invalid locations - from='{}' (resolved: {}), to='{}' (resolved: {})",
                            fromLocation, validatedFrom, toLocation, validatedTo);
                    skippedRoutes++;
                }
            }

            // Handle 'routes' array from Gemini (routes with multiple departureTimes each)
            // Each route needs to be EXPANDED: one DB entry per departure time
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> routesArray = (List<Map<String, Object>>) extractedData.get("routes");

            if (routesArray != null && !routesArray.isEmpty()) {
                logger.info("Processing {} routes from Gemini data for expansion", routesArray.size());

                for (Map<String, Object> routeData : routesArray) {
                    String routeFrom = (String) routeData.get("fromLocation");
                    String routeTo = (String) routeData.get("toLocation");
                    if (routeTo == null) {
                        routeTo = (String) routeData.get("destination");
                    }
                    String via = (String) routeData.get("via");

                    // Validate locations
                    String validatedFrom = validateAndResolveLocation(routeFrom);
                    String validatedTo = validateAndResolveLocation(routeTo);

                    if (validatedFrom == null || validatedTo == null || validatedFrom.equals(validatedTo)) {
                        logger.warn("Skipping route: invalid locations - from='{}', to='{}'", routeFrom, routeTo);
                        skippedRoutes++;
                        continue;
                    }

                    // Get ALL departure times for this route
                    @SuppressWarnings("unchecked")
                    List<String> departureTimes = (List<String>) routeData.get("departureTimes");
                    if (departureTimes == null) {
                        departureTimes = (List<String>) routeData.get("timings");
                    }

                    // If no times found, use single departureTime
                    if (departureTimes == null || departureTimes.isEmpty()) {
                        String singleTime = (String) routeData.get("departureTime");
                        if (singleTime != null) {
                            departureTimes = List.of(singleTime);
                        }
                    }

                    if (departureTimes == null || departureTimes.isEmpty()) {
                        logger.warn("Skipping route {} -> {}: no departure times found", validatedFrom, validatedTo);
                        skippedRoutes++;
                        continue;
                    }

                    // EXPAND: Create one RouteContribution per departure time
                    logger.info("Expanding route {} -> {} with {} departure times",
                            validatedFrom, validatedTo, departureTimes.size());

                    String busNumber = (String) routeData.get("routeNumber");
                    if (busNumber == null || busNumber.isBlank()) {
                        busNumber = "TNSTC"; // Default bus operator for Tamil Nadu routes
                    }

                    for (String departureTime : departureTimes) {
                        RouteContribution route = createRouteContributionWithDepartureTime(
                                contribution,
                                busNumber,
                                validatedFrom,
                                validatedTo,
                                via,
                                null, // operatorName
                                null, // fare
                                departureTime,
                                List.of(departureTime), // single timing
                                null, // stops
                                status);

                        RouteContribution savedRoute = routeContributionOutputPort.save(route);
                        createdRoutes.add(savedRoute);
                    }

                    logger.info("Created {} route entries for {} -> {}",
                            departureTimes.size(), validatedFrom, validatedTo);
                }
            }

            // If there are multiple routes detected (already expanded - one per departure
            // time)
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> multipleRoutes = (List<Map<String, Object>>) extractedData.get("multipleRoutes");

            if (multipleRoutes != null && !multipleRoutes.isEmpty()) {
                for (Map<String, Object> routeData : multipleRoutes) {
                    String routeFrom = (String) routeData.get("fromLocation");
                    String routeTo = (String) routeData.get("toLocation");
                    String via = (String) routeData.get("via");

                    // Validate origin and destination
                    String validatedFrom = validateAndResolveLocation(routeFrom);
                    String validatedTo = validateAndResolveLocation(routeTo);

                    // Skip route if either location is invalid or if they are the same
                    if (validatedFrom == null || validatedTo == null) {
                        logger.warn(
                                "Skipping route: invalid locations - from='{}' (resolved: {}), to='{}' (resolved: {})",
                                routeFrom, validatedFrom, routeTo, validatedTo);
                        skippedRoutes++;
                        continue;
                    }

                    if (validatedFrom.equals(validatedTo)) {
                        logger.warn("Skipping route: origin equals destination - from='{}', to='{}'",
                                validatedFrom, validatedTo);
                        skippedRoutes++;
                        continue;
                    }

                    // Check if destination is actually a VIA city (should not be a destination)
                    if (isViaCity(validatedTo, via)) {
                        logger.warn("Skipping route: destination '{}' is a VIA city in route pattern", validatedTo);
                        skippedRoutes++;
                        continue;
                    }

                    // Get intermediate stops (extracted from VIA column)
                    @SuppressWarnings("unchecked")
                    List<Map<String, String>> stopsData = (List<Map<String, String>>) routeData.get("stops");

                    // Validate and resolve stop locations
                    List<Map<String, String>> validatedStops = validateStops(stopsData);

                    // Get the single departure time (from expanded routes)
                    String departureTime = (String) routeData.get("departureTime");

                    // Fallback to timings array if departureTime not set
                    @SuppressWarnings("unchecked")
                    List<String> routeTimings = (List<String>) routeData.get("timings");

                    // Create one route per entry (each entry now has a single departure time)
                    RouteContribution additionalRoute = createRouteContributionWithDepartureTime(
                            contribution,
                            (String) routeData.get("routeNumber"),
                            validatedFrom,
                            validatedTo,
                            via,
                            (String) routeData.get("operatorName"),
                            (String) routeData.get("fare"),
                            departureTime,
                            routeTimings,
                            validatedStops,
                            status);

                    RouteContribution savedAdditionalRoute = routeContributionOutputPort.save(additionalRoute);
                    createdRoutes.add(savedAdditionalRoute);

                    int stopCount = validatedStops != null ? validatedStops.size() : 0;
                    logger.info("Created route: {} -> {} via {} at {} with {} intermediate stops",
                            validatedFrom, validatedTo, via, departureTime, stopCount);
                }
            }

            logger.info("Successfully created {} route entries from OCR data ({} skipped due to invalid locations)",
                    createdRoutes.size(), skippedRoutes);

        } catch (Exception e) {
            logger.error("Failed to create route data from OCR for contribution {}: {}",
                    contribution.getId(), e.getMessage(), e);
        }

        return createdRoutes;
    }

    /**
     * Validate and resolve a location name using LocationResolutionService.
     * Returns the resolved name if valid, null if invalid.
     */
    private String validateAndResolveLocation(String locationName) {
        if (locationName == null || locationName.trim().isEmpty()) {
            return null;
        }

        String cleaned = locationName.trim().toUpperCase();

        // Skip if it's a non-location keyword
        if (isNonLocationKeyword(cleaned)) {
            logger.debug("Rejecting non-location keyword: {}", cleaned);
            return null;
        }

        // Use LocationResolutionService to validate and resolve the location
        LocationResolutionService.LocationResolution resolution = locationResolutionService.resolve(cleaned);

        if (resolution.getResolvedName() != null && resolution.getConfidence() >= 0.5) {
            logger.debug("Resolved location '{}' -> '{}' (confidence: {}, source: {})",
                    locationName, resolution.getResolvedName(), resolution.getConfidence(), resolution.getSource());
            return resolution.getResolvedName();
        }

        // If resolution failed but the name looks like a valid location (4+ chars, not
        // a keyword)
        if (cleaned.length() >= 4 && !isNonLocationKeyword(cleaned)) {
            logger.debug("Accepting unresolved location as-is: {} (needs verification)", cleaned);
            return cleaned;
        }

        logger.debug("Rejecting invalid location: {} (too short or keyword)", locationName);
        return null;
    }

    /**
     * Check if a word is a non-location keyword (bus type, service class, etc.)
     */
    private boolean isNonLocationKeyword(String word) {
        if (word == null)
            return true;
        String upper = word.toUpperCase();
        return upper.matches(
                "ORDINARY|SEATER|SUPER|DELUXE|EXPRESS|ROUTE|TIME|VIA|DESTINATION|FAST|SLEEPER|VOLVO|LUXURY|DEPARTURE|ARRIVAL|FARE|BUS|STAND|STATION|AC|NON-AC|SEMI|3X2|2X2");
    }

    /**
     * Check if a destination is actually listed in the VIA column (should not be a
     * destination)
     */
    private boolean isViaCity(String destination, String via) {
        if (destination == null || via == null || via.isEmpty()) {
            return false;
        }
        String destUpper = destination.toUpperCase().trim();
        String viaUpper = via.toUpperCase();

        // Split via into individual city names and check if destination matches any
        for (String viaCity : viaUpper.split("[,\\s]+")) {
            if (viaCity.trim().equals(destUpper)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Validate and resolve stop locations
     */
    private List<Map<String, String>> validateStops(List<Map<String, String>> stopsData) {
        if (stopsData == null || stopsData.isEmpty()) {
            return new ArrayList<>();
        }

        List<Map<String, String>> validatedStops = new ArrayList<>();
        for (Map<String, String> stop : stopsData) {
            String stopName = stop.get("name");
            String validatedName = validateAndResolveLocation(stopName);

            if (validatedName != null) {
                Map<String, String> validatedStop = new HashMap<>(stop);
                validatedStop.put("name", validatedName);
                validatedStops.add(validatedStop);
            } else {
                logger.debug("Skipping invalid stop: {}", stopName);
            }
        }
        return validatedStops;
    }

    /**
     * Create a route contribution with a specific departure time and intermediate
     * stops
     */
    private RouteContribution createRouteContributionWithDepartureTime(
            ImageContribution imageContribution,
            String routeNumber,
            String fromLocation,
            String toLocation,
            String via,
            String operatorName,
            String fare,
            String departureTime,
            List<String> timings,
            List<Map<String, String>> stopsData,
            String status) {

        // Generate route group ID for grouping related schedules
        String routeGroupId = generateRouteGroupId(fromLocation, toLocation, via);

        // Estimate arrival time based on departure and route
        String estimatedArrival = estimateArrivalTime(departureTime, fromLocation, toLocation);

        RouteContribution.RouteContributionBuilder builder = RouteContribution.builder()
                .id(UUID.randomUUID().toString())
                .userId(imageContribution.getUserId())
                .busNumber(routeNumber)
                .fromLocationName(fromLocation)
                .toLocationName(toLocation)
                .departureTime(departureTime) // Set the specific departure time
                .arrivalTime(estimatedArrival) // Set the estimated arrival time
                .submissionDate(LocalDateTime.now())
                .status(status)
                .sourceImageId(imageContribution.getId()) // Track source image
                .routeGroupId(routeGroupId) // Group related schedules
                .additionalNotes(
                        "Auto-created from image contribution: " + imageContribution.getId() + " (arrival estimated)");

        // Add via information
        if (via != null && !via.isBlank()) {
            builder.scheduleInfo("Via: " + via);
        }

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

        // Convert intermediate stops data to StopContribution objects
        if (stopsData != null && !stopsData.isEmpty()) {
            List<StopContribution> stops = new ArrayList<>();
            for (Map<String, String> stopData : stopsData) {
                String stopName = stopData.get("name");
                String stopOrderStr = stopData.get("stopOrder");
                Integer stopOrder = stopOrderStr != null ? Integer.parseInt(stopOrderStr) : null;

                StopContribution stop = StopContribution.builder()
                        .name(stopName)
                        .stopOrder(stopOrder)
                        .build();
                stops.add(stop);

                logger.debug("Added intermediate stop: {} (order: {})", stopName, stopOrder);
            }
            builder.stops(stops);
        }

        return builder.build();
    }

    /**
     * Generate a route group ID for grouping related schedules
     */
    private String generateRouteGroupId(String from, String to, String via) {
        StringBuilder groupId = new StringBuilder();
        if (from != null) {
            groupId.append(from.toUpperCase().trim());
        }
        groupId.append("-");
        if (to != null) {
            groupId.append(to.toUpperCase().trim());
        }
        if (via != null && !via.isBlank()) {
            groupId.append("-").append(via.toUpperCase().trim());
        }
        return groupId.toString();
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
            List<String> timings,
            String status) {

        RouteContribution.RouteContributionBuilder builder = RouteContribution.builder()
                .id(UUID.randomUUID().toString())
                .userId(imageContribution.getUserId())
                .busNumber(routeNumber)
                .fromLocationName(fromLocation)
                .toLocationName(toLocation)
                .submissionDate(LocalDateTime.now())
                .status(status)
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

    /**
     * Converts a Spring MultipartFile to domain FileUpload
     */
    private FileUpload convertToFileUpload(MultipartFile multipartFile) {
        try {
            return new FileUpload(
                    multipartFile.getOriginalFilename(),
                    multipartFile.getContentType(),
                    multipartFile.getSize(),
                    multipartFile.getInputStream());
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert MultipartFile to FileUpload", e);
        }
    }

    /**
     * Cleanup method called when the application shuts down
     * Ensures proper shutdown of the async thread pool
     */
    @PreDestroy
    public void cleanup() {
        logger.info("Shutting down image processing thread pool");
        asyncExecutor.shutdown();
        try {
            if (!asyncExecutor.awaitTermination(30, TimeUnit.SECONDS)) {
                logger.warn("Image processing thread pool did not terminate gracefully, forcing shutdown");
                asyncExecutor.shutdownNow();
                if (!asyncExecutor.awaitTermination(10, TimeUnit.SECONDS)) {
                    logger.error("Image processing thread pool did not terminate after forced shutdown");
                }
            } else {
                logger.info("Image processing thread pool shut down successfully");
            }
        } catch (InterruptedException e) {
            logger.error("Thread pool shutdown interrupted, forcing immediate shutdown");
            asyncExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Estimate arrival time based on departure time and typical travel duration.
     * Uses distance-based estimates for Tamil Nadu bus routes:
     * - Within district: ~1-2 hours
     * - Cross-district: ~2-4 hours
     * - Long distance: ~4-6 hours
     * 
     * @param departureTime The departure time string (HH:mm or HH:mm:ss format)
     * @param fromLocation  Origin location name
     * @param toLocation    Destination location name
     * @return Estimated arrival time string, or null if calculation fails
     */
    private String estimateArrivalTime(String departureTime, String fromLocation, String toLocation) {
        if (departureTime == null || departureTime.isBlank()) {
            return null;
        }

        try {
            // Parse departure time flexibly
            LocalTime departure = parseTimeFlexible(departureTime);
            if (departure == null) {
                return null;
            }

            // Estimate travel duration based on known routes
            int travelMinutes = estimateTravelDuration(fromLocation, toLocation);

            // Calculate arrival time
            LocalTime arrival = departure.plusMinutes(travelMinutes);

            return arrival.format(DateTimeFormatter.ofPattern("HH:mm"));

        } catch (Exception e) {
            logger.warn("Failed to estimate arrival time for departure '{}': {}", departureTime, e.getMessage());
            return null;
        }
    }

    /**
     * Estimate travel duration in minutes between two locations.
     * Uses hardcoded estimates for common Tamil Nadu routes.
     */
    private int estimateTravelDuration(String from, String to) {
        if (from == null || to == null) {
            return 90; // Default 1.5 hours
        }

        String fromUpper = from.toUpperCase().trim();
        String toUpper = to.toUpperCase().trim();

        // Known route duration estimates (in minutes)
        // Sivakasi to Madurai: ~60 km, takes about 1.5-2 hours by local bus
        if ((fromUpper.contains("SIVAKASI") && toUpper.contains("MADURAI")) ||
                (fromUpper.contains("MADURAI") && toUpper.contains("SIVAKASI"))) {
            return 120; // 2 hours
        }

        // Sivakasi to Virudhunagar: ~15 km, about 30-45 min
        if ((fromUpper.contains("SIVAKASI") && toUpper.contains("VIRUDHUNAGAR")) ||
                (fromUpper.contains("VIRUDHUNAGAR") && toUpper.contains("SIVAKASI"))) {
            return 45; // 45 min
        }

        // Madurai to Virudhunagar: ~45 km, about 1-1.5 hours
        if ((fromUpper.contains("MADURAI") && toUpper.contains("VIRUDHUNAGAR")) ||
                (fromUpper.contains("VIRUDHUNAGAR") && toUpper.contains("MADURAI"))) {
            return 90; // 1.5 hours
        }

        // Chennai routes (long distance)
        if (fromUpper.contains("CHENNAI") || toUpper.contains("CHENNAI")) {
            return 360; // 6 hours average
        }

        // Coimbatore/Tirupur routes
        if (fromUpper.contains("COIMBATORE") || toUpper.contains("COIMBATORE") ||
                fromUpper.contains("TIRUPUR") || toUpper.contains("TIRUPUR")) {
            return 240; // 4 hours average
        }

        // Default estimate based on typical intercity route
        return 120; // 2 hours default
    }

    /**
     * Parse time string flexibly, handling various formats.
     */
    private LocalTime parseTimeFlexible(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) {
            return null;
        }

        String normalized = timeStr.trim();

        // Handle various time formats
        DateTimeFormatter[] formatters = {
                DateTimeFormatter.ofPattern("HH:mm"),
                DateTimeFormatter.ofPattern("H:mm"),
                DateTimeFormatter.ofPattern("HH:mm:ss"),
                DateTimeFormatter.ofPattern("h:mm a"),
                DateTimeFormatter.ofPattern("h:mma"),
                DateTimeFormatter.ofPattern("hh:mm a"),
                DateTimeFormatter.ofPattern("hh:mma")
        };

        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalTime.parse(normalized, formatter);
            } catch (DateTimeParseException e) {
                // Try next format
            }
        }

        // Try simple HH:mm extraction
        if (normalized.matches("\\d{1,2}:\\d{2}.*")) {
            try {
                String timeOnly = normalized.substring(0, 5);
                if (normalized.length() > 5) {
                    timeOnly = normalized.replaceAll("[^0-9:]", "").substring(0,
                            Math.min(5, normalized.replaceAll("[^0-9:]", "").length()));
                }
                return LocalTime.parse(timeOnly, DateTimeFormatter.ofPattern("HH:mm"));
            } catch (Exception ex) {
                // Ignore
            }
        }

        logger.debug("Could not parse time: {}", timeStr);
        return null;
    }
}