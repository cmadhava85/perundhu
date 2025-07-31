package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Domain model for route contributions from users using Java 17 record
 */
public record RouteContribution(
    RouteContributionId id,
    String userId,
    String busNumber,
    String busName,
    String fromLocationName,
    String toLocationName,
    String busNameSecondary,
    String fromLocationNameSecondary,
    String toLocationNameSecondary,
    LanguageCode sourceLanguage,
    Double fromLatitude,
    Double fromLongitude,
    Double toLatitude,
    Double toLongitude,
    LocalTime departureTime,
    LocalTime arrivalTime,
    String scheduleInfo,
    ContributionStatus status,
    LocalDateTime submissionDate,
    LocalDateTime processedDate,
    String additionalNotes,
    String validationMessage,
    List<StopContribution> stops
) {

    // Compact constructor for validation and defaults
    public RouteContribution {
        if (stops == null) stops = new ArrayList<>();
    }

    /**
     * Value object for RouteContribution ID using Java 17 record
     */
    public record RouteContributionId(String value) {
        public RouteContributionId {
            if (value == null || value.isBlank()) {
                throw new IllegalArgumentException("RouteContributionId value cannot be null or blank");
            }
        }

        public static RouteContributionId generate() {
            return new RouteContributionId(UUID.randomUUID().toString());
        }
    }

    /**
     * Stop contribution record using Java 17 features
     */
    public record StopContribution(
        String name,
        String nameSecondary,
        Double latitude,
        Double longitude,
        LocalTime arrivalTime,
        LocalTime departureTime,
        Integer stopOrder
    ) {
        public StopContribution {
            if (stopOrder != null && stopOrder < 0) {
                throw new IllegalArgumentException("Stop order cannot be negative");
            }
        }
    }

    /**
     * Enum for contribution status
     */
    public enum ContributionStatus {
        PENDING("Pending Review"),
        APPROVED("Approved"),
        REJECTED("Rejected"),
        PROCESSING("Processing"),
        DRAFT("Draft");

        private final String displayName;

        ContributionStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * Factory method to create new route contribution
     */
    public static RouteContribution create(
        String userId,
        String busNumber,
        String busName,
        String fromLocationName,
        String toLocationName,
        LanguageCode sourceLanguage,
        Double fromLatitude,
        Double fromLongitude,
        Double toLatitude,
        Double toLongitude,
        LocalTime departureTime,
        LocalTime arrivalTime
    ) {
        return new RouteContribution(
            RouteContributionId.generate(),
            userId,
            busNumber,
            busName,
            fromLocationName,
            toLocationName,
            null, // Secondary language fields to be filled later
            null,
            null,
            sourceLanguage,
            fromLatitude,
            fromLongitude,
            toLatitude,
            toLongitude,
            departureTime,
            arrivalTime,
            null,
            ContributionStatus.DRAFT,
            LocalDateTime.now(),
            null,
            null,
            null,
            new ArrayList<>()
        );
    }

    /**
     * Add secondary language translations
     */
    public RouteContribution withSecondaryLanguage(
        String busNameSecondary,
        String fromLocationNameSecondary,
        String toLocationNameSecondary
    ) {
        return new RouteContribution(
            id, userId, busNumber, busName, fromLocationName, toLocationName,
            busNameSecondary, fromLocationNameSecondary, toLocationNameSecondary,
            sourceLanguage, fromLatitude, fromLongitude, toLatitude, toLongitude,
            departureTime, arrivalTime, scheduleInfo, status, submissionDate,
            processedDate, additionalNotes, validationMessage, stops
        );
    }

    /**
     * Add a stop to the route
     */
    public RouteContribution withStop(StopContribution stop) {
        List<StopContribution> newStops = new ArrayList<>(stops);
        newStops.add(stop);
        return new RouteContribution(
            id, userId, busNumber, busName, fromLocationName, toLocationName,
            busNameSecondary, fromLocationNameSecondary, toLocationNameSecondary,
            sourceLanguage, fromLatitude, fromLongitude, toLatitude, toLongitude,
            departureTime, arrivalTime, scheduleInfo, status, submissionDate,
            processedDate, additionalNotes, validationMessage, newStops
        );
    }

    /**
     * Check if the contribution has valid coordinates
     */
    public boolean hasValidCoordinates() {
        return fromLatitude != null && fromLongitude != null &&
               toLatitude != null && toLongitude != null &&
               Math.abs(fromLatitude) <= 90 && Math.abs(fromLongitude) <= 180 &&
               Math.abs(toLatitude) <= 90 && Math.abs(toLongitude) <= 180;
    }

    /**
     * Check if the contribution is complete and ready for submission
     */
    public boolean isReadyForSubmission() {
        return busNumber != null && !busNumber.isBlank() &&
               busName != null && !busName.isBlank() &&
               fromLocationName != null && !fromLocationName.isBlank() &&
               toLocationName != null && !toLocationName.isBlank() &&
               hasValidCoordinates() &&
               departureTime != null && arrivalTime != null;
    }
}
