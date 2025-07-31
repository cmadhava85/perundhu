package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Domain model for image contributions from users using Java 17 record
 */
public record ImageContribution(
    ImageContributionId id,
    String userId,
    String description,
    String location,
    String routeName,
    String imageUrl,
    ContributionStatus status,
    LocalDateTime submissionDate,
    LocalDateTime processedDate,
    String additionalNotes,
    String validationMessage,
    String busNumber,
    String imageDescription,
    String locationName,
    String extractedData
) {

    /**
     * Value object for ImageContribution ID using Java 17 record
     */
    public record ImageContributionId(String value) {
        public ImageContributionId {
            if (value == null || value.isBlank()) {
                throw new IllegalArgumentException("ImageContributionId value cannot be null or blank");
            }
        }

        public static ImageContributionId generate() {
            return new ImageContributionId(UUID.randomUUID().toString());
        }
    }

    /**
     * Enum for contribution status using Java 17 features
     */
    public enum ContributionStatus {
        PENDING("Pending Review"),
        APPROVED("Approved"),
        REJECTED("Rejected"),
        PROCESSING("Processing");

        private final String displayName;

        ContributionStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * Factory method to create new image contribution
     */
    public static ImageContribution create(
        String userId,
        String description,
        String location,
        String routeName,
        String imageUrl,
        String busNumber,
        String locationName
    ) {
        return new ImageContribution(
            ImageContributionId.generate(),
            userId,
            description,
            location,
            routeName,
            imageUrl,
            ContributionStatus.PENDING,
            LocalDateTime.now(),
            null,
            null,
            null,
            busNumber,
            description, // Use description as imageDescription for now
            locationName,
            null // extractedData will be set during processing
        );
    }

    /**
     * Create a processed version with validation results
     */
    public ImageContribution withProcessingResults(
        ContributionStatus newStatus,
        String validationMessage,
        String extractedData
    ) {
        return new ImageContribution(
            id,
            userId,
            description,
            location,
            routeName,
            imageUrl,
            newStatus,
            submissionDate,
            LocalDateTime.now(),
            additionalNotes,
            validationMessage,
            busNumber,
            imageDescription,
            locationName,
            extractedData
        );
    }

    /**
     * Check if the contribution is approved
     */
    public boolean isApproved() {
        return status == ContributionStatus.APPROVED;
    }

    /**
     * Check if the contribution is pending
     */
    public boolean isPending() {
        return status == ContributionStatus.PENDING;
    }
}

