package com.perundhu.adapter.in.rest;

import com.perundhu.application.dto.StopDTO;
import com.perundhu.application.service.AuthenticationService;
import com.perundhu.application.service.RouteIssueService;
import com.perundhu.application.service.RouteIssueService.IssueDetails;
import com.perundhu.application.service.RouteIssueService.IssueStatistics;
import com.perundhu.application.service.RouteIssueService.RouteIssueRequest;
import com.perundhu.application.service.RouteIssueService.StatusUpdateResult;
import com.perundhu.application.service.RouteIssueService.SubmitResult;
import com.perundhu.domain.model.RouteIssue;
import com.perundhu.domain.model.RouteIssue.IssuePriority;
import com.perundhu.domain.model.RouteIssue.IssueStatus;
import com.perundhu.domain.model.RouteIssue.IssueType;
import com.perundhu.domain.port.RouteIssuePort.PagedResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * REST controller for reporting and managing route issues.
 * Allows users to report wrong timings, non-existent buses, etc.
 * 
 * Follows hexagonal architecture - uses application service, not infrastructure
 * repositories.
 * 
 * Public endpoints: POST /report, GET /my-reports, GET /route, GET /bus/{busId}
 * Admin endpoints (require ADMIN role): /admin/**
 */
@RestController
@RequestMapping("/api/v1/route-issues")
@RequiredArgsConstructor
@Slf4j
public class RouteIssueController {

  private final RouteIssueService routeIssueService;
  private final AuthenticationService authenticationService;

  /**
   * Submit a new route issue report
   */
  @PostMapping
  public ResponseEntity<?> submitIssue(@RequestBody IssueSubmitRequest request) {
    log.info("Received route issue report: type={}, busId={}, from={}, to={}",
        request.issueType, request.busId, request.fromLocation, request.toLocation);

    try {
      RouteIssueRequest serviceRequest = new RouteIssueRequest(
          request.busId,
          request.busName,
          request.busNumber,
          request.fromLocation,
          request.toLocation,
          request.issueType,
          request.description,
          request.suggestedDepartureTime,
          request.suggestedArrivalTime,
          request.lastTraveledDate,
          request.reporterId);

      SubmitResult result = routeIssueService.submitIssue(serviceRequest);

      if (result instanceof SubmitResult.Success success) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Thank you for reporting! We'll review and update the information.",
            "issueId", success.issueId(),
            "status", success.status().name()));
      } else if (result instanceof SubmitResult.ExistingIssue existing) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Thank you! This issue has been reported by others too. We're looking into it.",
            "issueId", existing.issueId(),
            "reportCount", existing.reportCount(),
            "existingIssue", true));
      } else if (result instanceof SubmitResult.ValidationError error) {
        return ResponseEntity.badRequest().body(Map.of("error", error.error()));
      }
      return ResponseEntity.internalServerError().body(Map.of("error", "Unexpected error"));

    } catch (Exception e) {
      log.error("Error submitting route issue", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to submit report. Please try again."));
    }
  }

  /**
   * Get user's own reports
   * SECURITY: Users can only view their own reports
   */
  @GetMapping("/my-reports")
  public ResponseEntity<?> getMyReports(@RequestParam String reporterId) {
    try {
      // IDOR Protection: Verify the requesting user matches the reporterId parameter
      String currentUserId = authenticationService.getCurrentUserId();
      if (currentUserId == null || (!currentUserId.equals(reporterId) && !reporterId.startsWith("anonymous_"))) {
        log.warn("IDOR attempt: User {} tried to access reports of user {}", currentUserId, reporterId);
        return ResponseEntity.status(403)
            .body(Map.of("error", "Access denied. You can only view your own reports."));
      }

      List<RouteIssue> issues = routeIssueService.getReportsByReporterId(reporterId);
      return ResponseEntity.ok(Map.of(
          "issues", issues.stream().map(this::toResponse).toList(),
          "count", issues.size()));
    } catch (Exception e) {
      log.error("Error fetching user reports", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to fetch reports"));
    }
  }

  @GetMapping("/route")
  public ResponseEntity<?> getRouteIssues(@RequestParam String from, @RequestParam String to) {
    try {
      List<RouteIssue> confirmedIssues = routeIssueService.getConfirmedIssuesForRoute(from, to);

      return ResponseEntity.ok(Map.of(
          "issues", confirmedIssues.stream().map(this::toPublicResponse).toList(),
          "hasIssues", !confirmedIssues.isEmpty()));
    } catch (Exception e) {
      log.error("Error fetching route issues", e);
      return ResponseEntity.ok(Map.of("issues", List.of(), "hasIssues", false));
    }
  }

  @GetMapping("/bus/{busId}")
  public ResponseEntity<?> getBusIssues(@PathVariable Long busId) {
    try {
      List<RouteIssue> confirmedIssues = routeIssueService.getConfirmedIssuesForBus(busId);

      return ResponseEntity.ok(Map.of(
          "issues", confirmedIssues.stream().map(this::toPublicResponse).toList(),
          "hasIssues", !confirmedIssues.isEmpty()));
    } catch (Exception e) {
      log.error("Error fetching bus issues", e);
      return ResponseEntity.ok(Map.of("issues", List.of(), "hasIssues", false));
    }
  }

  // ================== ADMIN ENDPOINTS ==================
  // All admin endpoints require ADMIN role

  @GetMapping("/admin/pending")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> getPendingIssues(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    try {
      PagedResult<RouteIssue> issues = routeIssueService.getPendingIssues(page, size);

      return ResponseEntity.ok(Map.of(
          "issues", issues.content().stream().map(this::toResponse).toList(),
          "totalCount", issues.totalElements(),
          "page", issues.page(),
          "totalPages", issues.totalPages()));
    } catch (Exception e) {
      log.error("Error fetching pending issues", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to fetch issues"));
    }
  }

  @GetMapping("/admin/high-priority")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> getHighPriorityIssues() {
    try {
      List<RouteIssue> issues = routeIssueService.getHighPriorityIssues();
      return ResponseEntity.ok(Map.of(
          "issues", issues.stream().map(this::toResponse).toList(),
          "count", issues.size()));
    } catch (Exception e) {
      log.error("Error fetching high priority issues", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to fetch issues"));
    }
  }

  @GetMapping("/admin/statistics")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> getStatistics() {
    try {
      IssueStatistics stats = routeIssueService.getStatistics();

      return ResponseEntity.ok(Map.of(
          "byStatus", stats.byStatus(),
          "byType", stats.byType(),
          "totalPending", stats.totalPending(),
          "highPriorityCount", stats.highPriorityCount()));
    } catch (Exception e) {
      log.error("Error fetching statistics", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to fetch statistics"));
    }
  }

  @GetMapping("/admin/by-status")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> getIssuesByStatus(
      @RequestParam String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "100") int size) {
    try {
      IssueStatus issueStatus = IssueStatus.valueOf(status.toUpperCase());
      PagedResult<RouteIssue> issues = routeIssueService.getIssuesByStatus(issueStatus, page, size);

      return ResponseEntity.ok(Map.of(
          "issues", issues.content().stream().map(this::toResponse).toList(),
          "totalCount", issues.totalElements(),
          "page", issues.page(),
          "totalPages", issues.totalPages()));
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest()
          .body(Map.of("error", "Invalid status: " + status));
    } catch (Exception e) {
      log.error("Error fetching issues by status", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to fetch issues"));
    }
  }

  @PutMapping("/admin/{issueId}/status")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> updateStatus(
      @PathVariable Long issueId,
      @RequestBody StatusUpdateRequest request) {
    try {
      StatusUpdateResult result = routeIssueService.updateStatus(
          issueId, request.status, request.adminNotes, request.resolution);

      if (result instanceof StatusUpdateResult.Success success) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("issue", toResponse(success.issue()));
        if (success.busDeactivated()) {
          response.put("busDeactivated", true);
          response.put("message", "Bus has been deactivated and will no longer appear in search results");
        }
        return ResponseEntity.ok(response);
      } else if (result instanceof StatusUpdateResult.NotFound) {
        return ResponseEntity.notFound().build();
      }
      return ResponseEntity.internalServerError().body(Map.of("error", "Unexpected error"));
    } catch (Exception e) {
      log.error("Error updating issue status", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to update status"));
    }
  }

  @PutMapping("/admin/{issueId}/priority")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> updatePriority(
      @PathVariable Long issueId,
      @RequestBody PriorityUpdateRequest request) {
    try {
      boolean updated = routeIssueService.updatePriority(issueId, request.priority);
      if (!updated) {
        return ResponseEntity.notFound().build();
      }

      return ResponseEntity.ok(Map.of("success", true));
    } catch (Exception e) {
      log.error("Error updating priority", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to update priority"));
    }
  }

  /**
   * Get detailed issue information including bus route details
   * This allows admin to see the current bus data alongside the reported issue
   */
  @GetMapping("/admin/{issueId}/details")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> getIssueDetails(@PathVariable Long issueId) {
    try {
      Optional<IssueDetails> optDetails = routeIssueService.getIssueDetails(issueId);
      if (optDetails.isEmpty()) {
        return ResponseEntity.notFound().build();
      }

      IssueDetails details = optDetails.get();
      Map<String, Object> response = new LinkedHashMap<>();

      // Add basic issue info
      response.put("issue", toResponse(details.issue()));

      // If we have bus details
      if (details.currentBusDetails() != null) {
        Map<String, Object> busDetails = new LinkedHashMap<>();
        busDetails.put("id", details.currentBusDetails().id());
        busDetails.put("busNumber", details.currentBusDetails().number());
        busDetails.put("busName", details.currentBusDetails().name());
        busDetails.put("departureTime", details.currentBusDetails().departureTime());
        busDetails.put("arrivalTime", details.currentBusDetails().arrivalTime());
        busDetails.put("fromLocation", details.currentBusDetails().fromLocationName());
        busDetails.put("toLocation", details.currentBusDetails().toLocationName());
        busDetails.put("busType", details.currentBusDetails().type());
        busDetails.put("operator", details.currentBusDetails().operator());
        response.put("currentBusDetails", busDetails);

        List<Map<String, Object>> stopsList = new ArrayList<>();
        for (StopDTO stop : details.currentStops()) {
          Map<String, Object> stopData = new LinkedHashMap<>();
          stopData.put("id", stop.id());
          stopData.put("name", stop.name());
          stopData.put("locationId", stop.locationId());
          stopData.put("stopOrder", stop.sequence());
          stopData.put("arrivalTime", stop.arrivalTime() != null ? stop.arrivalTime().toString() : null);
          stopData.put("departureTime", stop.departureTime() != null ? stop.departureTime().toString() : null);
          stopsList.add(stopData);
        }
        response.put("currentStops", stopsList);
      } else {
        response.put("currentBusDetails", null);
        response.put("currentStops", List.of());
        if (details.busNotFound()) {
          response.put("busNotFound", true);
        }
      }

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error fetching issue details", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to fetch issue details"));
    }
  }

  // ================== HELPER METHODS ==================

  private Map<String, Object> toResponse(RouteIssue issue) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("id", issue.getId());
    response.put("busId", issue.getBusId());
    response.put("busName", issue.getBusName());
    response.put("busNumber", issue.getBusNumber());
    response.put("fromLocation", issue.getFromLocation());
    response.put("toLocation", issue.getToLocation());
    response.put("issueType", issue.getIssueType());
    response.put("description", issue.getDescription());
    response.put("suggestedDepartureTime", issue.getSuggestedDepartureTime());
    response.put("suggestedArrivalTime", issue.getSuggestedArrivalTime());
    response.put("lastTraveledDate", issue.getLastTraveledDate());
    response.put("status", issue.getStatus());
    response.put("priority", issue.getPriority());
    response.put("reportCount", issue.getReportCount());
    response.put("adminNotes", issue.getAdminNotes());
    response.put("resolution", issue.getResolution());
    response.put("createdAt", issue.getCreatedAt());
    response.put("updatedAt", issue.getUpdatedAt());
    response.put("resolvedAt", issue.getResolvedAt());
    return response;
  }

  private Map<String, Object> toPublicResponse(RouteIssue issue) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("id", issue.getId());
    response.put("issueType", issue.getIssueType());
    response.put("status", issue.getStatus());
    response.put("reportCount", issue.getReportCount());
    response.put("resolution", issue.getResolution());
    return response;
  }

  // ================== REQUEST DTOs ==================

  public record IssueSubmitRequest(
      Long busId,
      String busName,
      String busNumber,
      String fromLocation,
      String toLocation,
      IssueType issueType,
      String description,
      String suggestedDepartureTime,
      String suggestedArrivalTime,
      String lastTraveledDate,
      String reporterId) {
  }

  public record StatusUpdateRequest(
      IssueStatus status,
      String adminNotes,
      String resolution) {
  }

  public record PriorityUpdateRequest(
      IssuePriority priority) {
  }
}
