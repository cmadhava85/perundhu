package com.perundhu.adapter.in.rest;

import com.perundhu.application.service.ContributionProcessingService;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.RouteContributionPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
  private final ContributionProcessingService contributionProcessingService;

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

      result.put("approvedCount", approvedContributions.size());
      result.put("integratedCount", integratedContributions.size());
      result.put("pendingIntegrationCount", approvedContributions.size());
      result.put("needsIntegration", approvedContributions.size() > 0);

      return ResponseEntity.ok(result);

    } catch (Exception e) {
      log.error("Error getting integration status: {}", e.getMessage(), e);
      result.put("error", "Failed to get integration status: " + e.getMessage());
      return ResponseEntity.internalServerError().body(result);
    }
  }
}