package com.perundhu.adapter.in.rest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.perundhu.application.dto.RouteContributionRequest;
import com.perundhu.application.service.ContributionAdminService;
import com.perundhu.domain.model.LanguageCode;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.RouteContribution.StopContribution;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * REST API Controller for user contributions
 */
@RestController
@RequestMapping("/api/v1/contributions")
public class ContributionController {

    private static final Logger log = LoggerFactory.getLogger(ContributionController.class);
    private final ContributionAdminService contributionAdminService;

    /**
     * Constructor for dependency injection
     */
    public ContributionController(ContributionAdminService contributionAdminService) {
        this.contributionAdminService = contributionAdminService;
    }

    /**
     * Submit a new route contribution
     */
    @PostMapping("/routes")
    public ResponseEntity<RouteContributionResponse> submitRouteContribution(
            @RequestBody RouteContributionRequest request) {
        log.info("Received route contribution request: {}", request);

        // Convert DTO to domain model
        RouteContribution contribution = convertToDomain(request);

        // Process the contribution
        RouteContribution savedContribution = contributionAdminService.submitRouteContribution(contribution);

        // Convert domain model back to response DTO
        return ResponseEntity.ok(convertToResponse(savedContribution));
    }

    /**
     * Get all route contributions (possibly filtered by user)
     */
    @GetMapping("/routes")
    public ResponseEntity<List<RouteContributionResponse>> getRouteContributions(
            @RequestParam(required = false) String userId) {
        log.info("Request for route contributions, userId filter: {}", userId);

        List<RouteContribution> contributions;
        if (userId != null && !userId.isEmpty()) {
            contributions = contributionAdminService.getRouteContributionsByUser(userId);
        } else {
            contributions = contributionAdminService.getAllRouteContributions();
        }

        // Convert domain models to response DTOs using Java 17's toList()
        List<RouteContributionResponse> responseList = contributions.stream()
                .map(this::convertToResponse)
                .toList();

        return ResponseEntity.ok(responseList);
    }

    /**
     * Convert request DTO to domain model
     */
    private RouteContribution convertToDomain(RouteContributionRequest request) {
        // Convert stop contributions first
        List<StopContribution> stops = null;
        if (request.stops() != null) {
            stops = request.stops().stream()
                    .map(stopRequest -> new StopContribution(
                            stopRequest.name(),
                            null, // nameSecondary - not provided in request DTO
                            stopRequest.latitude(),
                            stopRequest.longitude(),
                            parseTime(stopRequest.arrivalTime()),
                            parseTime(stopRequest.departureTime()),
                            stopRequest.stopOrder()))
                    .toList();
        }

        // Parse source language
        LanguageCode sourceLanguage = null;
        if (request.sourceLanguage() != null) {
            try {
                sourceLanguage = new LanguageCode(request.sourceLanguage());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid source language: {}, defaulting to English", request.sourceLanguage());
                sourceLanguage = new LanguageCode("en"); // English
            }
        }

        // Create RouteContribution using record constructor
        return new RouteContribution(
                null, // id will be generated
                request.userId(),
                request.busNumber(),
                request.busName(),
                request.fromLocationName(),
                request.toLocationName(),
                null, // busNameSecondary
                null, // fromLocationNameSecondary
                null, // toLocationNameSecondary
                sourceLanguage,
                request.fromLatitude(),
                request.fromLongitude(),
                request.toLatitude(),
                request.toLongitude(),
                parseTime(request.departureTime()),
                parseTime(request.arrivalTime()),
                request.scheduleInfo(),
                null, // status - will be set by service
                null, // submissionDate - will be set by service
                null, // processedDate
                request.additionalNotes(),
                null, // validationMessage
                stops != null ? stops : new ArrayList<>());
    }

    /**
     * Parse time string to LocalTime
     */
    private LocalTime parseTime(String timeString) {
        if (timeString == null || timeString.trim().isEmpty()) {
            return null;
        }

        try {
            // Try common time formats
            if (timeString.length() == 5) { // HH:mm
                return LocalTime.parse(timeString, DateTimeFormatter.ofPattern("HH:mm"));
            } else if (timeString.length() == 8) { // HH:mm:ss
                return LocalTime.parse(timeString, DateTimeFormatter.ofPattern("HH:mm:ss"));
            } else {
                // Try default ISO format
                return LocalTime.parse(timeString);
            }
        } catch (DateTimeParseException e) {
            log.warn("Failed to parse time: {}, returning null", timeString);
            return null;
        }
    }

    /**
     * Convert domain model to response DTO
     */
    private RouteContributionResponse convertToResponse(RouteContribution contribution) {
        return new RouteContributionResponse(
                contribution.id() != null ? contribution.id().value() : null,
                contribution.userId(),
                contribution.busNumber(),
                contribution.busName(),
                contribution.fromLocationName(),
                contribution.toLocationName(),
                contribution.status() != null ? contribution.status().name() : null,
                contribution.submissionDate() != null ? contribution.submissionDate().toString() : null,
                contribution.processedDate() != null ? contribution.processedDate().toString() : null,
                contribution.validationMessage());
    }

    /**
     * Response DTO for route contributions
     */
    public record RouteContributionResponse(
            String id,
            String userId,
            String busNumber,
            String busName,
            String fromLocationName,
            String toLocationName,
            String status,
            String submissionDate,
            String processedDate,
            String validationMessage) {
    }
}
