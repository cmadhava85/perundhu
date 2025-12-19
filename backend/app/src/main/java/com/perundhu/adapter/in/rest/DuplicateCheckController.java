package com.perundhu.adapter.in.rest;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.service.DuplicateDetectionService;
import com.perundhu.application.service.DuplicateDetectionService.DuplicateCheckResult;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for duplicate detection API.
 * Provides customer-side soft check before contribution submission.
 */
@RestController
@RequestMapping("/api/v1/duplicates")
@RequiredArgsConstructor
@Slf4j
public class DuplicateCheckController {

    private final DuplicateDetectionService duplicateDetectionService;

    /**
     * Check for potential duplicate routes before user submits a contribution.
     * This is a "soft check" - it suggests matches but doesn't block submission.
     */
    @PostMapping("/check")
    public ResponseEntity<DuplicateCheckResponse> checkForDuplicates(
            @RequestBody DuplicateCheckRequest request) {

        log.info("Checking for duplicates: {} → {} at {}",
                request.fromLocation(), request.toLocation(), request.departureTime());

        List<DuplicateCheckResult> matches = duplicateDetectionService.findPotentialDuplicates(
                request.fromLocation(),
                request.toLocation(),
                request.departureTime(),
                request.busNumber());

        if (matches.isEmpty()) {
            return ResponseEntity.ok(new DuplicateCheckResponse(
                    false,
                    "No similar routes found. You can proceed with your contribution.",
                    List.of()));
        }

        List<MatchedBusInfo> matchedBuses = matches.stream()
                .map(m -> new MatchedBusInfo(
                        m.matchedBus() != null ? m.matchedBus().getId().getValue() : null,
                        m.matchedBus() != null ? m.matchedBus().getBusNumber() : null,
                        m.matchedBus() != null && m.matchedBus().getFromLocation() != null 
                                ? m.matchedBus().getFromLocation().getName() : null,
                        m.matchedBus() != null && m.matchedBus().getToLocation() != null 
                                ? m.matchedBus().getToLocation().getName() : null,
                        m.matchedBus() != null && m.matchedBus().getDepartureTime() != null 
                                ? m.matchedBus().getDepartureTime().toString() : null,
                        m.matchType().name(),
                        m.details(),
                        m.confidenceScore()))
                .collect(Collectors.toList());

        String message = matches.size() == 1
                ? "Similar route found. Is this the same bus?"
                : String.format("%d similar routes found. Please check if any matches your bus.", matches.size());

        return ResponseEntity.ok(new DuplicateCheckResponse(
                true,
                message,
                matchedBuses));
    }

    /**
     * Request payload for duplicate check
     */
    public record DuplicateCheckRequest(
            String fromLocation,
            String toLocation,
            String departureTime,
            String busNumber  // Optional
    ) {}

    /**
     * Response payload for duplicate check
     */
    public record DuplicateCheckResponse(
            boolean hasPotentialDuplicates,
            String message,
            List<MatchedBusInfo> matches
    ) {}

    /**
     * Information about a matched bus
     */
    public record MatchedBusInfo(
            Long busId,
            String busNumber,
            String fromLocation,
            String toLocation,
            String departureTime,
            String matchType,
            String details,
            int confidenceScore
    ) {}
}
