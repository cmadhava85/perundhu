package com.perundhu.adapter.in.rest;

import com.perundhu.domain.model.RouteIssue;
import com.perundhu.domain.model.RouteIssue.IssueStatus;
import com.perundhu.domain.model.RouteIssue.IssueType;
import com.perundhu.domain.model.RouteIssue.IssuePriority;
import com.perundhu.domain.port.RouteIssueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * REST controller for reporting and managing route issues.
 * Allows users to report wrong timings, non-existent buses, etc.
 */
@RestController
@RequestMapping("/api/v1/route-issues")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class RouteIssueController {

  private final RouteIssueRepository routeIssueRepository;

  /**
   * Submit a new route issue report
   */
  @PostMapping
  public ResponseEntity<?> submitIssue(@RequestBody RouteIssueRequest request) {
    log.info("Received route issue report: type={}, busId={}, from={}, to={}",
        request.issueType, request.busId, request.fromLocation, request.toLocation);

    try {
      // Validate request
      if (request.issueType == null) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", "Issue type is required"));
      }

      // Check for similar existing issue
      if (request.busId != null) {
        List<IssueStatus> activeStatuses = Arrays.asList(
            IssueStatus.PENDING, IssueStatus.UNDER_REVIEW, IssueStatus.CONFIRMED);

        Optional<RouteIssue> existingIssue = routeIssueRepository
            .findFirstByBusIdAndIssueTypeAndStatusIn(
                request.busId, request.issueType, activeStatuses);

        if (existingIssue.isPresent()) {
          // Increment report count for existing issue
          RouteIssue issue = existingIssue.get();
          issue.setReportCount(issue.getReportCount() + 1);

          // Increase priority if many reports
          if (issue.getReportCount() >= 5 && issue.getPriority() != IssuePriority.CRITICAL) {
            issue.setPriority(IssuePriority.CRITICAL);
          } else if (issue.getReportCount() >= 3 && issue.getPriority() == IssuePriority.MEDIUM) {
            issue.setPriority(IssuePriority.HIGH);
          }

          // Append description if provided
          if (request.description != null && !request.description.isBlank()) {
            String existingDesc = issue.getDescription() != null ? issue.getDescription() : "";
            issue.setDescription(existingDesc + "\n\n---\nAdditional report:\n" + request.description);
          }

          routeIssueRepository.save(issue);

          log.info("Incremented report count for existing issue id={}, count={}",
              issue.getId(), issue.getReportCount());

          return ResponseEntity.ok(Map.of(
              "success", true,
              "message", "Thank you! This issue has been reported by others too. We're looking into it.",
              "issueId", issue.getId(),
              "reportCount", issue.getReportCount(),
              "existingIssue", true));
        }
      }

      // Create new issue
      IssuePriority priority = determinePriority(request.issueType);

      RouteIssue issue = RouteIssue.builder()
          .busId(request.busId)
          .busName(request.busName)
          .busNumber(request.busNumber)
          .fromLocation(request.fromLocation)
          .toLocation(request.toLocation)
          .issueType(request.issueType)
          .description(request.description)
          .suggestedDepartureTime(request.suggestedDepartureTime)
          .suggestedArrivalTime(request.suggestedArrivalTime)
          .lastTraveledDate(request.lastTraveledDate)
          .status(IssueStatus.PENDING)
          .priority(priority)
          .reporterId(request.reporterId)
          .createdAt(LocalDateTime.now())
          .build();

      RouteIssue saved = routeIssueRepository.save(issue);

      log.info("Created new route issue id={}, type={}, priority={}",
          saved.getId(), saved.getIssueType(), saved.getPriority());

      return ResponseEntity.ok(Map.of(
          "success", true,
          "message", "Thank you for reporting! We'll review and update the information.",
          "issueId", saved.getId(),
          "status", saved.getStatus().name()));

    } catch (Exception e) {
      log.error("Error submitting route issue", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to submit report. Please try again."));
    }
  }

  /**
   * Get issues reported by a user
   */
  @GetMapping("/my-reports")
  public ResponseEntity<?> getMyReports(@RequestParam String reporterId) {
    try {
      List<RouteIssue> issues = routeIssueRepository.findByReporterIdOrderByCreatedAtDesc(reporterId);
      return ResponseEntity.ok(Map.of(
          "issues", issues.stream().map(this::toResponse).toList(),
          "count", issues.size()));
    } catch (Exception e) {
      log.error("Error fetching user reports", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to fetch reports"));
    }
  }

  /**
   * Get issues for a specific route (for display to users)
   */
  @GetMapping("/route")
  public ResponseEntity<?> getRouteIssues(
      @RequestParam String from,
      @RequestParam String to) {
    try {
      List<RouteIssue> issues = routeIssueRepository.findIssuesForRoute(from, to);

      // Only return confirmed issues to regular users
      List<RouteIssue> confirmedIssues = issues.stream()
          .filter(i -> i.getStatus() == IssueStatus.CONFIRMED)
          .toList();

      return ResponseEntity.ok(Map.of(
          "issues", confirmedIssues.stream().map(this::toPublicResponse).toList(),
          "hasIssues", !confirmedIssues.isEmpty()));
    } catch (Exception e) {
      log.error("Error fetching route issues", e);
      return ResponseEntity.ok(Map.of("issues", List.of(), "hasIssues", false));
    }
  }

  /**
   * Get issues for a specific bus
   */
  @GetMapping("/bus/{busId}")
  public ResponseEntity<?> getBusIssues(@PathVariable Long busId) {
    try {
      List<RouteIssue> issues = routeIssueRepository.findByBusId(busId);

      // Only return confirmed issues to regular users
      List<RouteIssue> confirmedIssues = issues.stream()
          .filter(i -> i.getStatus() == IssueStatus.CONFIRMED)
          .toList();

      return ResponseEntity.ok(Map.of(
          "issues", confirmedIssues.stream().map(this::toPublicResponse).toList(),
          "hasIssues", !confirmedIssues.isEmpty()));
    } catch (Exception e) {
      log.error("Error fetching bus issues", e);
      return ResponseEntity.ok(Map.of("issues", List.of(), "hasIssues", false));
    }
  }

  // ================== ADMIN ENDPOINTS ==================

  /**
   * Get all pending issues (admin)
   */
  @GetMapping("/admin/pending")
  public ResponseEntity<?> getPendingIssues(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    try {
      Page<RouteIssue> issues = routeIssueRepository.findByStatus(
          IssueStatus.PENDING,
          PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

      return ResponseEntity.ok(Map.of(
          "issues", issues.getContent().stream().map(this::toResponse).toList(),
          "totalCount", issues.getTotalElements(),
          "page", page,
          "totalPages", issues.getTotalPages()));
    } catch (Exception e) {
      log.error("Error fetching pending issues", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to fetch issues"));
    }
  }

  /**
   * Get high priority issues (admin)
   */
  @GetMapping("/admin/high-priority")
  public ResponseEntity<?> getHighPriorityIssues() {
    try {
      List<RouteIssue> issues = routeIssueRepository.findHighPriorityIssues();
      return ResponseEntity.ok(Map.of(
          "issues", issues.stream().map(this::toResponse).toList(),
          "count", issues.size()));
    } catch (Exception e) {
      log.error("Error fetching high priority issues", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to fetch issues"));
    }
  }

  /**
   * Get issue statistics (admin)
   */
  @GetMapping("/admin/statistics")
  public ResponseEntity<?> getStatistics() {
    try {
      Map<String, Long> statusCounts = new HashMap<>();
      for (IssueStatus status : IssueStatus.values()) {
        statusCounts.put(status.name(), routeIssueRepository.countByStatus(status));
      }

      Map<String, Long> typeCounts = new HashMap<>();
      for (IssueType type : IssueType.values()) {
        typeCounts.put(type.name(), routeIssueRepository.countByIssueType(type));
      }

      return ResponseEntity.ok(Map.of(
          "byStatus", statusCounts,
          "byType", typeCounts,
          "totalPending", routeIssueRepository.countByStatus(IssueStatus.PENDING),
          "highPriorityCount", routeIssueRepository.findHighPriorityIssues().size()));
    } catch (Exception e) {
      log.error("Error fetching statistics", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to fetch statistics"));
    }
  }

  /**
   * Update issue status (admin)
   */
  @PutMapping("/admin/{issueId}/status")
  public ResponseEntity<?> updateStatus(
      @PathVariable Long issueId,
      @RequestBody StatusUpdateRequest request) {
    try {
      Optional<RouteIssue> optIssue = routeIssueRepository.findById(issueId);
      if (optIssue.isEmpty()) {
        return ResponseEntity.notFound().build();
      }

      RouteIssue issue = optIssue.get();
      IssueStatus oldStatus = issue.getStatus();
      issue.setStatus(request.status);

      if (request.adminNotes != null) {
        issue.setAdminNotes(request.adminNotes);
      }
      if (request.resolution != null) {
        issue.setResolution(request.resolution);
      }
      if (request.status == IssueStatus.RESOLVED) {
        issue.setResolvedAt(LocalDateTime.now());
      }

      routeIssueRepository.save(issue);

      log.info("Updated issue {} status: {} -> {}", issueId, oldStatus, request.status);

      return ResponseEntity.ok(Map.of(
          "success", true,
          "issue", toResponse(issue)));
    } catch (Exception e) {
      log.error("Error updating issue status", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to update status"));
    }
  }

  /**
   * Update issue priority (admin)
   */
  @PutMapping("/admin/{issueId}/priority")
  public ResponseEntity<?> updatePriority(
      @PathVariable Long issueId,
      @RequestBody PriorityUpdateRequest request) {
    try {
      Optional<RouteIssue> optIssue = routeIssueRepository.findById(issueId);
      if (optIssue.isEmpty()) {
        return ResponseEntity.notFound().build();
      }

      RouteIssue issue = optIssue.get();
      issue.setPriority(request.priority);
      routeIssueRepository.save(issue);

      log.info("Updated issue {} priority to {}", issueId, request.priority);

      return ResponseEntity.ok(Map.of("success", true));
    } catch (Exception e) {
      log.error("Error updating priority", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to update priority"));
    }
  }

  // ================== HELPER METHODS ==================

  private IssuePriority determinePriority(IssueType type) {
    return switch (type) {
      case BUS_NOT_AVAILABLE, SERVICE_SUSPENDED -> IssuePriority.HIGH;
      case WRONG_TIMING, ROUTE_CHANGED -> IssuePriority.MEDIUM;
      case WRONG_STOPS, WRONG_FARE, WRONG_SCHEDULE -> IssuePriority.MEDIUM;
      case OTHER -> IssuePriority.LOW;
    };
  }

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
    // Don't expose description or reporter details publicly
    return response;
  }

  // ================== REQUEST DTOs ==================

  public record RouteIssueRequest(
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
