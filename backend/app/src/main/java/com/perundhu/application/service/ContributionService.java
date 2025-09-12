package com.perundhu.application.service;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.RouteContributionOutputPort;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.model.ImageContribution;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.io.IOException;
import java.util.function.Function;

/**
 * Service for handling user contributions
 */
@Service
public class ContributionService {

    private static final Logger logger = LoggerFactory.getLogger(ContributionService.class);

    // Record for file upload result
    private record FileUploadResult(String fileName, String url, long size) {
    }

    private final RouteContributionOutputPort routeContributionOutputPort;
    private final ImageContributionOutputPort imageContributionOutputPort;

    // Constructor injection
    public ContributionService(RouteContributionOutputPort routeContributionOutputPort,
            ImageContributionOutputPort imageContributionOutputPort) {
        this.routeContributionOutputPort = routeContributionOutputPort;
        this.imageContributionOutputPort = imageContributionOutputPort;
    }

    /**
     * Save a new route contribution
     */
    public RouteContribution saveRouteContribution(RouteContribution contribution) {
        // Generate ID if not provided using enhanced string method isBlank()
        var id = (contribution.getId() == null || contribution.getId().isBlank()) ? UUID.randomUUID().toString()
                : contribution.getId();

        contribution.setId(id);

        logger.info("Saving route contribution with id: {}", id);

        return routeContributionOutputPort.save(contribution);
    }

    /**
     * Save an image contribution file
     */
    public String saveImageContribution(ImageContribution contribution, MultipartFile file) throws IOException {
        // Use the file processing helper with functional style
        var uploadResult = processUploadedFile(file, originalName -> UUID.randomUUID().toString() + "_" + originalName);

        logger.info("Saving image contribution with file name: {}, size: {}",
                uploadResult.fileName(), uploadResult.size());

        // In a real implementation, this would save the file to a storage service
        // and return a URL to access it

        return uploadResult.url();
    }

    /**
     * Process an uploaded file with functional transformation for the filename
     */
    private FileUploadResult processUploadedFile(MultipartFile file, Function<String, String> fileNameTransformer) {
        var originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed";
        var newFileName = fileNameTransformer.apply(originalName);

        // For demo purposes, create a dummy URL
        var url = "/uploads/" + newFileName;

        return new FileUploadResult(newFileName, url, file.getSize());
    }

    /**
     * Save image metadata
     */
    public ImageContribution saveImageMetadata(ImageContribution contribution) {
        // Using optional pattern with orElseGet for null-safe ID generation
        var id = Optional.ofNullable(contribution.getId())
                .filter(s -> !s.isBlank())
                .orElseGet(() -> UUID.randomUUID().toString());

        contribution.setId(id);

        logger.info("Saving image metadata with id: {}", id);

        return imageContributionOutputPort.save(contribution);
    }

    /**
     * Get contributions for a specific user
     */
    public List<Map<String, Object>> getUserContributions(String userId) {
        logger.info("Retrieving contributions for user: {}", userId);

        List<Map<String, Object>> contributions = new ArrayList<>();

        // Get route contributions
        List<RouteContribution> routeContributions = routeContributionOutputPort.findByUserId(userId);
        for (RouteContribution contribution : routeContributions) {
            Map<String, Object> contributionMap = new HashMap<>();
            contributionMap.put("id", contribution.getId());
            contributionMap.put("type", "route");
            contributionMap.put("status", contribution.getStatus());
            contributionMap.put("submissionDate", contribution.getSubmissionDate());
            contributionMap.put("busNumber", contribution.getBusNumber());
            contributionMap.put("fromLocation", contribution.getFromLocationName());
            contributionMap.put("toLocation", contribution.getToLocationName());
            contributions.add(contributionMap);
        }

        // Get image contributions
        List<ImageContribution> imageContributions = imageContributionOutputPort.findByUserId(userId);
        for (ImageContribution contribution : imageContributions) {
            Map<String, Object> contributionMap = new HashMap<>();
            contributionMap.put("id", contribution.getId());
            contributionMap.put("type", "image");
            contributionMap.put("status", contribution.getStatus());
            contributionMap.put("submissionDate", contribution.getSubmissionDate());
            contributionMap.put("description", contribution.getDescription());
            contributionMap.put("location", contribution.getLocation());
            contributions.add(contributionMap);
        }

        return contributions;
    }

    /**
     * Check for duplicate routes
     */
    public boolean checkForDuplicateRoute(String busNumber, String fromLocation, String toLocation) {
        logger.info("Checking for duplicate route: {} from {} to {}", busNumber, fromLocation, toLocation);

        // In a real implementation, this would query the database for existing routes
        // For now, return false (no duplicates found)
        return false;
    }

    /**
     * Get user contribution analytics
     */
    public Map<String, Object> getUserContributionAnalytics(String userId) {
        logger.info("Generating contribution analytics for user: {}", userId);

        // Get user's contributions
        List<Map<String, Object>> contributions = getUserContributions(userId);

        Map<String, Object> analytics = new HashMap<>();

        // Count by type
        long routeContributions = contributions.stream()
                .filter(c -> "route".equals(c.get("type")))
                .count();

        long imageContributions = contributions.stream()
                .filter(c -> "image".equals(c.get("type")))
                .count();

        // Count by status
        long approvedCount = contributions.stream()
                .filter(c -> "APPROVED".equals(c.get("status")))
                .count();

        long pendingCount = contributions.stream()
                .filter(c -> "PENDING".equals(c.get("status")))
                .count();

        long rejectedCount = contributions.stream()
                .filter(c -> "REJECTED".equals(c.get("status")))
                .count();

        analytics.put("totalContributions", contributions.size());
        analytics.put("routeContributions", routeContributions);
        analytics.put("imageContributions", imageContributions);
        analytics.put("approvedContributions", approvedCount);
        analytics.put("pendingContributions", pendingCount);
        analytics.put("rejectedContributions", rejectedCount);

        // Calculate success rate
        if (contributions.size() > 0) {
            double successRate = (double) approvedCount / contributions.size() * 100;
            analytics.put("successRate", Math.round(successRate * 100.0) / 100.0);
        } else {
            analytics.put("successRate", 0.0);
        }

        // Calculate contribution streak (days with contributions)
        analytics.put("contributionStreak", calculateContributionStreak(contributions));

        return analytics;
    }

    /**
     * Calculate contribution streak in days
     */
    private int calculateContributionStreak(List<Map<String, Object>> contributions) {
        // Simple implementation - in real app, calculate consecutive days with
        // contributions
        return Math.min(contributions.size(), 30); // Cap at 30 days
    }

    /**
     * Get all contribution status data
     */
    public List<Map<String, Object>> getAllContributionStatus() {
        logger.info("Retrieving all contribution status");

        List<Map<String, Object>> allContributions = new ArrayList<>();

        // Get all route contributions
        List<RouteContribution> routeContributions = routeContributionOutputPort.findAll();
        for (RouteContribution contribution : routeContributions) {
            Map<String, Object> contributionMap = new HashMap<>();
            contributionMap.put("id", contribution.getId());
            contributionMap.put("type", "route");
            contributionMap.put("status", contribution.getStatus());
            contributionMap.put("submissionDate", contribution.getSubmissionDate());
            contributionMap.put("userId", contribution.getUserId());
            allContributions.add(contributionMap);
        }

        // Get all image contributions
        List<ImageContribution> imageContributions = imageContributionOutputPort.findAll();
        for (ImageContribution contribution : imageContributions) {
            Map<String, Object> contributionMap = new HashMap<>();
            contributionMap.put("id", contribution.getId());
            contributionMap.put("type", "image");
            contributionMap.put("status", contribution.getStatus());
            contributionMap.put("submissionDate", contribution.getSubmissionDate());
            contributionMap.put("userId", contribution.getUserId());
            allContributions.add(contributionMap);
        }

        return allContributions;
    }

    /**
     * Get contribution status data for a specific user
     */
    public List<Map<String, Object>> getContributionStatusByUser(String userId) {
        logger.info("Retrieving contribution status for user: {}", userId);
        return getUserContributions(userId);
    }
}