package com.perundhu.adapter.in.rest;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.application.service.AuthenticationService;
import com.perundhu.application.service.BusScheduleService;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.RouteIssueJpaEntity;
import com.perundhu.infrastructure.persistence.entity.RouteIssueJpaEntity.IssueStatus;
import com.perundhu.infrastructure.persistence.entity.RouteIssueJpaEntity.IssueType;
import com.perundhu.infrastructure.persistence.entity.RouteIssueJpaEntity.IssuePriority;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;
import com.perundhu.infrastructure.persistence.repository.RouteIssueJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * REST controller for reporting and managing route issues.
 * Allows users to report wrong timings, non-existent buses, etc.
 * 
 * Public endpoints: POST /report, GET /my-reports, GET /route, GET /bus/{busId}
 * Admin endpoints (require ADMIN role): /admin/**
 */
@RestController
@RequestMapping("/api/v1/route-issues")
@RequiredArgsConstructor
@Slf4j
public class RouteIssueController {

  private final RouteIssueJpaRepository routeIssueRepository;
  private final AuthenticationService authenticationService;
  private final BusScheduleService busScheduleService;
  private final BusJpaRepository busJpaRepository;
  private final CacheManager cacheManager;

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

        Optional<RouteIssueJpaEntity> existingIssue = routeIssueRepository
            .findFirstByBusIdAndIssueTypeAndStatusIn(
                request.busId, request.issueType, activeStatuses);

        if (existingIssue.isPresent()) {
          RouteIssueJpaEntity issue = existingIssue.get();
          issue.setReportCount(issue.getReportCount() + 1);

          if (issue.getReportCount() >= 5 && issue.getPriority() != IssuePriority.CRITICAL) {
            issue.setPriority(IssuePriority.CRITICAL);
          } else if (issue.getReportCount() >= 3 && issue.getPriority() == IssuePriority.MEDIUM) {
            issue.setPriority(IssuePriority.HIGH);
          }

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

      IssuePriority priority = determinePriority(request.issueType);

      RouteIssueJpaEntity issue = RouteIssueJpaEntity.builder()
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

      RouteIssueJpaEntity saved = routeIssueRepository.save(issue);

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

      List<RouteIssueJpaEntity> issues = routeIssueRepository.findByReporterIdOrderByCreatedAtDesc(reporterId);
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
      List<RouteIssueJpaEntity> issues = routeIssueRepository.findIssuesForRoute(from, to);
      List<RouteIssueJpaEntity> confirmedIssues = issues.stream()
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

  @GetMapping("/bus/{busId}")
  public ResponseEntity<?> getBusIssues(@PathVariable Long busId) {
    try {
      List<RouteIssueJpaEntity> issues = routeIssueRepository.findByBusId(busId);
      List<RouteIssueJpaEntity> confirmedIssues = issues.stream()
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
  // All admin endpoints require ADMIN role

  @GetMapping("/admin/pending")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> getPendingIssues(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    try {
      Page<RouteIssueJpaEntity> issues = routeIssueRepository.findByStatus(
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

  @GetMapping("/admin/high-priority")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> getHighPriorityIssues() {
    try {
      List<RouteIssueJpaEntity> issues = routeIssueRepository.findHighPriorityIssues();
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

  @GetMapping("/admin/by-status")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> getIssuesByStatus(
      @RequestParam String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "100") int size) {
    try {
      IssueStatus issueStatus = IssueStatus.valueOf(status.toUpperCase());
      Page<RouteIssueJpaEntity> issues = routeIssueRepository.findByStatus(
          issueStatus,
          PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

      return ResponseEntity.ok(Map.of(
          "issues", issues.getContent().stream().map(this::toResponse).toList(),
          "totalCount", issues.getTotalElements(),
          "page", page,
          "totalPages", issues.getTotalPages()));
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
  @Transactional
  public ResponseEntity<?> updateStatus(
      @PathVariable Long issueId,
      @RequestBody StatusUpdateRequest request) {
    try {
      Optional<RouteIssueJpaEntity> optIssue = routeIssueRepository.findById(issueId);
      if (optIssue.isEmpty()) {
        return ResponseEntity.notFound().build();
      }

      RouteIssueJpaEntity issue = optIssue.get();
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

      // Handle bus deactivation for confirmed BUS_NOT_AVAILABLE or SERVICE_SUSPENDED issues
      boolean busDeactivated = false;
      if (request.status == IssueStatus.CONFIRMED && issue.getBusId() != null) {
        IssueType issueType = issue.getIssueType();
        if (issueType == IssueType.BUS_NOT_AVAILABLE || issueType == IssueType.SERVICE_SUSPENDED) {
          Optional<BusJpaEntity> busOpt = busJpaRepository.findById(issue.getBusId());
          if (busOpt.isPresent()) {
            BusJpaEntity bus = busOpt.get();
            bus.setActive(false);
            busJpaRepository.save(bus);
            busDeactivated = true;
            log.info("Deactivated bus {} (ID: {}) due to confirmed {} issue",
                bus.getBusNumber(), bus.getId(), issueType);
            
            // Clear the bus search cache to ensure deactivated buses don't appear in results
            var busSearchCache = cacheManager.getCache("busSearchCache");
            if (busSearchCache != null) {
              busSearchCache.clear();
              log.info("Cleared busSearchCache after deactivating bus {}", bus.getId());
            }
            
            // Update resolution message
            String deactivationNote = String.format("Bus deactivated from search results. Issue type: %s", issueType);
            issue.setResolution(issue.getResolution() != null ? 
                issue.getResolution() + " | " + deactivationNote : deactivationNote);
          }
        }
      }

      routeIssueRepository.save(issue);

      log.info("Updated issue {} status: {} -> {}", issueId, oldStatus, request.status);

      Map<String, Object> response = new LinkedHashMap<>();
      response.put("success", true);
      response.put("issue", toResponse(issue));
      if (busDeactivated) {
        response.put("busDeactivated", true);
        response.put("message", "Bus has been deactivated and will no longer appear in search results");
      }
      
      return ResponseEntity.ok(response);
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
      Optional<RouteIssueJpaEntity> optIssue = routeIssueRepository.findById(issueId);
      if (optIssue.isEmpty()) {
        return ResponseEntity.notFound().build();
      }

      RouteIssueJpaEntity issue = optIssue.get();
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

  /**
   * Get detailed issue information including bus route details
   * This allows admin to see the current bus data alongside the reported issue
   */
  @GetMapping("/admin/{issueId}/details")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<?> getIssueDetails(@PathVariable Long issueId) {
    try {
      Optional<RouteIssueJpaEntity> optIssue = routeIssueRepository.findById(issueId);
      if (optIssue.isEmpty()) {
        return ResponseEntity.notFound().build();
      }

      RouteIssueJpaEntity issue = optIssue.get();
      Map<String, Object> response = new LinkedHashMap<>();

      // Add basic issue info
      response.put("issue", toResponse(issue));

      // If we have a busId, fetch the current bus details
      if (issue.getBusId() != null) {
        try {
          Optional<BusDTO> busOpt = busScheduleService.getBusById(issue.getBusId());
          if (busOpt.isPresent()) {
            BusDTO bus = busOpt.get();
            Map<String, Object> busDetails = new LinkedHashMap<>();
            busDetails.put("id", bus.id());
            busDetails.put("busNumber", bus.number());
            busDetails.put("busName", bus.name());
            busDetails.put("departureTime", bus.departureTime());
            busDetails.put("arrivalTime", bus.arrivalTime());
            busDetails.put("fromLocation", bus.fromLocationName());
            busDetails.put("toLocation", bus.toLocationName());
            busDetails.put("busType", bus.type());
            busDetails.put("operator", bus.operator());
            response.put("currentBusDetails", busDetails);

            // Also fetch the stops for this bus
            try {
              List<StopDTO> stops = busScheduleService.getStopsForBus(issue.getBusId(), "en");
              List<Map<String, Object>> stopsList = new ArrayList<>();
              for (StopDTO stop : stops) {
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
            } catch (Exception e) {
              log.warn("Could not fetch stops for bus {}: {}", issue.getBusId(), e.getMessage());
              response.put("currentStops", List.of());
            }
          } else {
            response.put("currentBusDetails", null);
            response.put("currentStops", List.of());
            response.put("busNotFound", true);
          }
        } catch (Exception e) {
          log.warn("Could not fetch bus details for id {}: {}", issue.getBusId(), e.getMessage());
          response.put("currentBusDetails", null);
          response.put("currentStops", List.of());
        }
      } else {
        response.put("currentBusDetails", null);
        response.put("currentStops", List.of());
      }

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error fetching issue details", e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to fetch issue details"));
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

  private Map<String, Object> toResponse(RouteIssueJpaEntity issue) {
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

  private Map<String, Object> toPublicResponse(RouteIssueJpaEntity issue) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("id", issue.getId());
    response.put("issueType", issue.getIssueType());
    response.put("status", issue.getStatus());
    response.put("reportCount", issue.getReportCount());
    response.put("resolution", issue.getResolution());
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
