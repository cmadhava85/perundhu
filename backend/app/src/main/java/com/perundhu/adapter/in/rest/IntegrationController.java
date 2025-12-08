package com.perundhu.adapter.in.rest;

import com.perundhu.application.service.BusTimingRecordIntegrationService;
import com.perundhu.application.service.ContributionProcessingService;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.RouteContributionPort;
import com.perundhu.domain.port.RouteContributionOutputPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for integration operations - syncing approved contributions to
 * main database
 */
@RestController
@RequestMapping("/api/admin/integration")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class IntegrationController {

  private final RouteContributionPort routeContributionPort;
  private final RouteContributionOutputPort routeContributionOutputPort;
  private final ContributionProcessingService contributionProcessingService;
  private final BusTimingRecordIntegrationService busTimingRecordIntegrationService;

  /**
   * Manually integrate all approved route contributions into the main bus
   * database
   * This should be called when approved contributions are not appearing in search
   * results
   */
  @PostMapping("/approved-routes")
  public ResponseEntity<Map<String, Object>> integrateApprovedRoutes() {
    log.info("Manual integration request for approved route contributions");

    Map<String, Object> result = new HashMap<>();
    int successCount = 0;
    int failureCount = 0;

    try {
      // Get all approved route contributions
      List<RouteContribution> approvedContributions = routeContributionPort.findRouteContributionsByStatus("APPROVED");
      log.info("Found {} approved route contributions to integrate", approvedContributions.size());

      for (RouteContribution contribution : approvedContributions) {
        try {
          log.info("Integrating approved route contribution: {} - {} to {}",
              contribution.getBusNumber(),
              contribution.getFromLocationName(),
              contribution.getToLocationName());

          // Call the integration service
          contributionProcessingService.integrateApprovedContribution(contribution);
          successCount++;

          log.info("Successfully integrated route contribution: {}", contribution.getId());

        } catch (Exception e) {
          log.error("Failed to integrate route contribution {}: {}", contribution.getId(), e.getMessage(), e);
          failureCount++;
        }
      }

      result.put("totalProcessed", approvedContributions.size());
      result.put("successCount", successCount);
      result.put("failureCount", failureCount);
      result.put("message", String.format("Integration completed. %d successful, %d failed out of %d total.",
          successCount, failureCount, approvedContributions.size()));

      log.info("Integration completed: {} successful, {} failed", successCount, failureCount);
      return ResponseEntity.ok(result);

    } catch (Exception e) {
      log.error("Error during batch integration: {}", e.getMessage(), e);
      result.put("error", "Integration failed: " + e.getMessage());
      return ResponseEntity.internalServerError().body(result);
    }
  }

  /**
   * Integrate a specific approved route contribution by ID
   */
  @PostMapping("/route/{id}")
  public ResponseEntity<Map<String, Object>> integrateSpecificRoute(@PathVariable String id) {
    log.info("Manual integration request for route contribution: {}", id);

    Map<String, Object> result = new HashMap<>();

    try {
      RouteContribution contribution = routeContributionPort.findRouteContributionById(id)
          .orElseThrow(() -> new RuntimeException("Route contribution not found: " + id));

      if (!"APPROVED".equals(contribution.getStatus())) {
        result.put("error",
            "Route contribution must be approved before integration. Current status: " + contribution.getStatus());
        return ResponseEntity.badRequest().body(result);
      }

      log.info("Integrating route contribution: {} - {} to {}",
          contribution.getBusNumber(),
          contribution.getFromLocationName(),
          contribution.getToLocationName());

      contributionProcessingService.integrateApprovedContribution(contribution);

      result.put("success", true);
      result.put("message", "Successfully integrated route contribution: " + id);

      log.info("Successfully integrated specific route contribution: {}", id);
      return ResponseEntity.ok(result);

    } catch (Exception e) {
      log.error("Error integrating route contribution {}: {}", id, e.getMessage(), e);
      result.put("error", "Integration failed: " + e.getMessage());
      return ResponseEntity.internalServerError().body(result);
    }
  }

  /**
   * Get status of all approved contributions - check which ones need integration
   */
  @GetMapping("/status")
  public ResponseEntity<Map<String, Object>> getIntegrationStatus() {
    Map<String, Object> result = new HashMap<>();

    try {
      List<RouteContribution> approvedContributions = routeContributionPort.findRouteContributionsByStatus("APPROVED");
      List<RouteContribution> integratedContributions = routeContributionPort
          .findRouteContributionsByStatus("INTEGRATED");
      List<RouteContribution> pendingReviewContributions = routeContributionPort
          .findRouteContributionsByStatus("PENDING_REVIEW");

      result.put("approvedCount", approvedContributions.size());
      result.put("integratedCount", integratedContributions.size());
      result.put("pendingReviewCount", pendingReviewContributions.size());
      result.put("pendingIntegrationCount", approvedContributions.size());
      result.put("needsIntegration", approvedContributions.size() > 0);

      // Count how many are missing arrival time
      long missingArrivalTime = approvedContributions.stream()
          .filter(c -> c.getArrivalTime() == null || c.getArrivalTime().isBlank())
          .count();
      result.put("missingArrivalTimeCount", missingArrivalTime);

      return ResponseEntity.ok(result);

    } catch (Exception e) {
      log.error("Error getting integration status: {}", e.getMessage(), e);
      result.put("error", "Failed to get integration status: " + e.getMessage());
      return ResponseEntity.internalServerError().body(result);
    }
  }

  /**
   * Fix routes that are missing arrival times by estimating based on departure
   * time
   * and typical travel duration. Then attempt to integrate them.
   * This is a one-time fix for routes created before arrival time estimation was
   * added.
   */
  @PostMapping("/fix-missing-arrival-times")
  public ResponseEntity<Map<String, Object>> fixMissingArrivalTimes() {
    log.info("Request to fix routes with missing arrival times");

    Map<String, Object> result = new HashMap<>();
    int fixedCount = 0;
    int integratedCount = 0;
    int failedCount = 0;

    try {
      // Get all approved and pending_review contributions
      List<RouteContribution> approvedContributions = routeContributionPort.findRouteContributionsByStatus("APPROVED");
      List<RouteContribution> pendingContributions = routeContributionPort
          .findRouteContributionsByStatus("PENDING_REVIEW");

      // Combine both lists
      approvedContributions.addAll(pendingContributions);

      log.info("Found {} total contributions to check for missing arrival times", approvedContributions.size());

      for (RouteContribution contribution : approvedContributions) {
        try {
          // Check if arrival time is missing
          if (contribution.getArrivalTime() == null || contribution.getArrivalTime().isBlank()) {
            // Estimate arrival time
            String estimatedArrival = estimateArrivalTime(
                contribution.getDepartureTime(),
                contribution.getFromLocationName(),
                contribution.getToLocationName());

            if (estimatedArrival != null) {
              contribution.setArrivalTime(estimatedArrival);
              contribution.setStatus("APPROVED"); // Set to approved for integration
              contribution.setValidationMessage(
                  (contribution.getValidationMessage() != null ? contribution.getValidationMessage() + " | " : "") +
                      "Arrival time estimated by system fix");

              // Save the updated contribution
              routeContributionOutputPort.save(contribution);
              fixedCount++;

              log.info("Fixed contribution {} with estimated arrival: {}",
                  contribution.getId(), estimatedArrival);

              // Now try to integrate it
              try {
                contributionProcessingService.integrateApprovedContribution(contribution);
                integratedCount++;
              } catch (Exception ie) {
                log.warn("Could not integrate fixed contribution {}: {}",
                    contribution.getId(), ie.getMessage());
              }
            }
          } else if ("APPROVED".equals(contribution.getStatus())) {
            // Already has arrival time, try to integrate
            try {
              contributionProcessingService.integrateApprovedContribution(contribution);
              integratedCount++;
            } catch (Exception ie) {
              log.warn("Could not integrate contribution {}: {}",
                  contribution.getId(), ie.getMessage());
            }
          }
        } catch (Exception e) {
          log.error("Failed to process contribution {}: {}", contribution.getId(), e.getMessage());
          failedCount++;
        }
      }

      result.put("totalProcessed", approvedContributions.size());
      result.put("fixedCount", fixedCount);
      result.put("integratedCount", integratedCount);
      result.put("failedCount", failedCount);
      result.put("message", String.format(
          "Fixed %d routes with missing arrival times. Integrated %d into bus database. %d failures.",
          fixedCount, integratedCount, failedCount));

      log.info("Fix completed: {} fixed, {} integrated, {} failed", fixedCount, integratedCount, failedCount);
      return ResponseEntity.ok(result);

    } catch (Exception e) {
      log.error("Error during fix operation: {}", e.getMessage(), e);
      result.put("error", "Fix failed: " + e.getMessage());
      return ResponseEntity.internalServerError().body(result);
    }
  }

  /**
   * Estimate arrival time based on departure time and typical travel duration.
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
      log.warn("Failed to estimate arrival time for departure '{}': {}", departureTime, e.getMessage());
      return null;
    }
  }

  /**
   * Estimate travel duration in minutes between two locations.
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
        return LocalTime.parse(timeOnly, DateTimeFormatter.ofPattern("HH:mm"));
      } catch (Exception ex) {
        // Ignore
      }
    }

    log.debug("Could not parse time: {}", timeStr);
    return null;
  }

  /**
   * Integrate all approved BusTimingRecords (from image contributions) into the
   * main buses table.
   * This is the key fix for when image contributions don't appear in search
   * results.
   */
  @PostMapping("/timing-records")
  public ResponseEntity<Map<String, Object>> integrateTimingRecords() {
    log.info("Manual integration request for BusTimingRecords (image contributions)");

    Map<String, Object> result = new HashMap<>();

    try {
      var integrationResult = busTimingRecordIntegrationService.integrateAllPendingRecords();

      result.put("integratedCount", integrationResult.integratedCount());
      result.put("skippedDuplicates", integrationResult.skippedDuplicates());
      result.put("failedCount", integrationResult.failedCount());
      result.put("errors", integrationResult.errors());
      result.put("message", String.format(
          "Integration completed: %d new buses created, %d duplicates linked, %d failed",
          integrationResult.integratedCount(),
          integrationResult.skippedDuplicates(),
          integrationResult.failedCount()));

      log.info("Timing records integration completed: {} integrated, {} duplicates, {} failed",
          integrationResult.integratedCount(),
          integrationResult.skippedDuplicates(),
          integrationResult.failedCount());

      return ResponseEntity.ok(result);

    } catch (Exception e) {
      log.error("Error integrating timing records: {}", e.getMessage(), e);
      result.put("error", "Integration failed: " + e.getMessage());
      return ResponseEntity.internalServerError().body(result);
    }
  }

  /**
   * Integrate BusTimingRecords for a specific route.
   * Use this when you want to integrate timings for a specific origin-destination
   * pair.
   */
  @PostMapping("/timing-records/route")
  public ResponseEntity<Map<String, Object>> integrateTimingRecordsForRoute(
      @RequestBody Map<String, String> request) {
    String fromLocation = request.get("fromLocation");
    String toLocation = request.get("toLocation");

    log.info("Integration request for route: {} -> {}", fromLocation, toLocation);

    Map<String, Object> result = new HashMap<>();

    if (fromLocation == null || toLocation == null) {
      result.put("error", "Both fromLocation and toLocation are required");
      return ResponseEntity.badRequest().body(result);
    }

    try {
      var integrationResult = busTimingRecordIntegrationService
          .integrateRecordsForRoute(fromLocation, toLocation);

      result.put("route", fromLocation + " -> " + toLocation);
      result.put("integratedCount", integrationResult.integratedCount());
      result.put("skippedDuplicates", integrationResult.skippedDuplicates());
      result.put("failedCount", integrationResult.failedCount());
      result.put("errors", integrationResult.errors());
      result.put("message", String.format(
          "Route integration completed: %d new buses, %d duplicates, %d failed",
          integrationResult.integratedCount(),
          integrationResult.skippedDuplicates(),
          integrationResult.failedCount()));

      return ResponseEntity.ok(result);

    } catch (Exception e) {
      log.error("Error integrating route {} -> {}: {}", fromLocation, toLocation, e.getMessage(), e);
      result.put("error", "Integration failed: " + e.getMessage());
      return ResponseEntity.internalServerError().body(result);
    }
  }
}