package com.perundhu.adapter.in.rest;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.service.ContributionProcessingService;
import com.perundhu.domain.model.RouteContribution;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for contribution reprocessing operations.
 * Follows Single Responsibility Principle - handles only reprocessing operations.
 */
@RestController
@RequestMapping("/api/admin/contributions/reprocess")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class ContributionReprocessingController {

    private final ContributionProcessingService contributionProcessingService;

    /**
     * Reprocess failed and pending route contributions
     */
    @PostMapping("/routes")
    public ResponseEntity<Map<String, Object>> reprocessFailedContributions() {
        log.info("Request to reprocess failed and pending route contributions");

        try {
            Map<String, Object> result = new HashMap<>();
            List<RouteContribution> allToReprocess = new ArrayList<>();

            List<String> statusesToReprocess = List.of(
                    "FAILED", "INTEGRATION_FAILED", "PENDING", "APPROVED");

            for (String status : statusesToReprocess) {
                List<RouteContribution> contributions = contributionProcessingService
                        .getRouteContributionsByStatus(status);

                log.info("Found {} contributions with status {} to reprocess", contributions.size(), status);

                for (RouteContribution contribution : contributions) {
                    if (!"INTEGRATED".equals(contribution.getStatus())) {
                        allToReprocess.add(contribution);
                    }
                }
            }

            log.info("Total {} contributions to reprocess in batch", allToReprocess.size());

            var batchResult = contributionProcessingService.integrateApprovedContributionsBatch(allToReprocess);

            result.put("success", true);
            result.put("successCount", batchResult.integratedCount());
            result.put("skippedCount", batchResult.skippedCount());
            result.put("failedCount", batchResult.failedCount());
            result.put("skippedReasons", batchResult.skippedReasons());
            result.put("failedReasons", batchResult.failedReasons());
            result.put("timestamp", LocalDateTime.now());

            log.info("Reprocessing complete: {} success, {} skipped, {} failed", 
                    batchResult.integratedCount(), batchResult.skippedCount(), batchResult.failedCount());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error during reprocessing: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to reprocess contributions: " + e.getMessage()));
        }
    }

    /**
     * Reprocess a single route contribution by ID
     */
    @PostMapping("/routes/{id}")
    public ResponseEntity<Map<String, Object>> reprocessSingleContribution(@PathVariable String id) {
        log.info("Request to reprocess route contribution: {}", id);

        try {
            RouteContribution contribution = contributionProcessingService.getRouteContributionById(id);
            if (contribution == null) {
                return ResponseEntity.notFound().build();
            }

            contributionProcessingService.integrateApprovedContribution(contribution);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("id", id);
            result.put("newStatus", contribution.getStatus());
            result.put("message", "Successfully integrated into bus database");

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to reprocess contribution {}: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "success", false,
                            "id", id,
                            "error", e.getMessage() != null ? e.getMessage() : "Unknown error"));
        }
    }

    /**
     * Get statistics about route contributions by status
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getContributionStats() {
        log.info("Request to get route contribution statistics");

        try {
            Map<String, Object> stats = new HashMap<>();

            List<String> statuses = List.of(
                    "PENDING", "APPROVED", "INTEGRATED",
                    "FAILED", "INTEGRATION_FAILED", "REJECTED", "DUPLICATE");

            for (String status : statuses) {
                List<RouteContribution> contributions = contributionProcessingService
                        .getRouteContributionsByStatus(status);
                stats.put(status, contributions.size());
            }

            stats.put("timestamp", LocalDateTime.now());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting contribution stats: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to get statistics: " + e.getMessage()));
        }
    }
}
