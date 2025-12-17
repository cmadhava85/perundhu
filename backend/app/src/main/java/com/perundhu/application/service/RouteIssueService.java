package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.RouteIssue;
import com.perundhu.domain.model.RouteIssue.IssuePriority;
import com.perundhu.domain.model.RouteIssue.IssueStatus;
import com.perundhu.domain.model.RouteIssue.IssueType;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.RouteIssuePort;
import com.perundhu.domain.port.RouteIssuePort.PagedResult;

import lombok.RequiredArgsConstructor;

/**
 * Application service for route issue management.
 * Follows hexagonal architecture - uses domain ports, not infrastructure
 * repositories.
 */
@Service
@RequiredArgsConstructor
public class RouteIssueService {

  private static final Logger log = LoggerFactory.getLogger(RouteIssueService.class);

  private final RouteIssuePort routeIssuePort;
  private final BusRepository busRepository;
  private final BusScheduleService busScheduleService;
  private final CacheManager cacheManager;

  /**
   * Submit a new route issue report
   */
  @Transactional
  public SubmitResult submitIssue(RouteIssueRequest request) {
    log.info("Received route issue report: type={}, busId={}, from={}, to={}",
        request.issueType(), request.busId(), request.fromLocation(), request.toLocation());

    if (request.issueType() == null) {
      return SubmitResult.validationError("Issue type is required");
    }

    // Check for similar existing issue
    if (request.busId() != null) {
      List<IssueStatus> activeStatuses = Arrays.asList(
          IssueStatus.PENDING, IssueStatus.UNDER_REVIEW, IssueStatus.CONFIRMED);

      Optional<RouteIssue> existingIssue = routeIssuePort
          .findFirstByBusIdAndIssueTypeAndStatusIn(
              request.busId(), request.issueType(), activeStatuses);

      if (existingIssue.isPresent()) {
        RouteIssue issue = existingIssue.get();
        issue.setReportCount(issue.getReportCount() + 1);

        if (issue.getReportCount() >= 5 && issue.getPriority() != IssuePriority.CRITICAL) {
          issue.setPriority(IssuePriority.CRITICAL);
        } else if (issue.getReportCount() >= 3 && issue.getPriority() == IssuePriority.MEDIUM) {
          issue.setPriority(IssuePriority.HIGH);
        }

        if (request.description() != null && !request.description().isBlank()) {
          String existingDesc = issue.getDescription() != null ? issue.getDescription() : "";
          issue.setDescription(existingDesc + "\n\n---\nAdditional report:\n" + request.description());
        }

        RouteIssue saved = routeIssuePort.save(issue);

        log.info("Incremented report count for existing issue id={}, count={}",
            saved.getId(), saved.getReportCount());

        return SubmitResult.existingIssue(saved.getId(), saved.getReportCount());
      }
    }

    IssuePriority priority = determinePriority(request.issueType());

    RouteIssue issue = RouteIssue.builder()
        .busId(request.busId())
        .busName(request.busName())
        .busNumber(request.busNumber())
        .fromLocation(request.fromLocation())
        .toLocation(request.toLocation())
        .issueType(request.issueType())
        .description(request.description())
        .suggestedDepartureTime(request.suggestedDepartureTime())
        .suggestedArrivalTime(request.suggestedArrivalTime())
        .lastTraveledDate(request.lastTraveledDate())
        .status(IssueStatus.PENDING)
        .priority(priority)
        .reporterId(request.reporterId())
        .createdAt(LocalDateTime.now())
        .build();

    RouteIssue saved = routeIssuePort.save(issue);

    log.info("Created new route issue id={}, type={}, priority={}",
        saved.getId(), saved.getIssueType(), saved.getPriority());

    return SubmitResult.success(saved.getId(), saved.getStatus());
  }

  /**
   * Get user's own reports
   */
  public List<RouteIssue> getReportsByReporterId(String reporterId) {
    return routeIssuePort.findByReporterIdOrderByCreatedAtDesc(reporterId);
  }

  /**
   * Get confirmed issues for a route
   */
  public List<RouteIssue> getConfirmedIssuesForRoute(String from, String to) {
    return routeIssuePort.findIssuesForRoute(from, to).stream()
        .filter(i -> i.getStatus() == IssueStatus.CONFIRMED)
        .toList();
  }

  /**
   * Get confirmed issues for a bus
   */
  public List<RouteIssue> getConfirmedIssuesForBus(Long busId) {
    return routeIssuePort.findByBusId(busId).stream()
        .filter(i -> i.getStatus() == IssueStatus.CONFIRMED)
        .toList();
  }

  /**
   * Get pending issues with pagination (Admin)
   */
  public PagedResult<RouteIssue> getPendingIssues(int page, int size) {
    return routeIssuePort.findByStatus(IssueStatus.PENDING, page, size);
  }

  /**
   * Get high priority issues (Admin)
   */
  public List<RouteIssue> getHighPriorityIssues() {
    return routeIssuePort.findHighPriorityIssues();
  }

  /**
   * Get issues by status with pagination (Admin)
   */
  public PagedResult<RouteIssue> getIssuesByStatus(IssueStatus status, int page, int size) {
    return routeIssuePort.findByStatus(status, page, size);
  }

  /**
   * Get statistics (Admin)
   */
  public IssueStatistics getStatistics() {
    Map<String, Long> statusCounts = new HashMap<>();
    for (IssueStatus status : IssueStatus.values()) {
      statusCounts.put(status.name(), routeIssuePort.countByStatus(status));
    }

    Map<String, Long> typeCounts = new HashMap<>();
    for (IssueType type : IssueType.values()) {
      typeCounts.put(type.name(), routeIssuePort.countByIssueType(type));
    }

    return new IssueStatistics(
        statusCounts,
        typeCounts,
        routeIssuePort.countByStatus(IssueStatus.PENDING),
        routeIssuePort.findHighPriorityIssues().size());
  }

  /**
   * Update issue status (Admin)
   */
  @Transactional
  public StatusUpdateResult updateStatus(Long issueId, IssueStatus newStatus,
      String adminNotes, String resolution) {
    Optional<RouteIssue> optIssue = routeIssuePort.findById(issueId);
    if (optIssue.isEmpty()) {
      return StatusUpdateResult.notFound();
    }

    RouteIssue issue = optIssue.get();
    IssueStatus oldStatus = issue.getStatus();
    issue.setStatus(newStatus);

    if (adminNotes != null) {
      issue.setAdminNotes(adminNotes);
    }
    if (resolution != null) {
      issue.setResolution(resolution);
    }
    if (newStatus == IssueStatus.RESOLVED) {
      issue.setResolvedAt(LocalDateTime.now());
    }

    // Handle bus deactivation for confirmed BUS_NOT_AVAILABLE or SERVICE_SUSPENDED
    // issues
    boolean busDeactivated = false;
    if (newStatus == IssueStatus.CONFIRMED && issue.getBusId() != null) {
      IssueType issueType = issue.getIssueType();
      if (issueType == IssueType.BUS_NOT_AVAILABLE || issueType == IssueType.SERVICE_SUSPENDED) {
        Optional<Bus> busOpt = busRepository.findById(issue.getBusId());
        if (busOpt.isPresent()) {
          Bus bus = busOpt.get();
          Bus deactivatedBus = bus.withActive(false);
          busRepository.save(deactivatedBus);
          busDeactivated = true;
          log.info("Deactivated bus {} (ID: {}) due to confirmed {} issue",
              bus.busNumber(), bus.id().value(), issueType);

          // Clear the bus search cache
          var busSearchCache = cacheManager.getCache("busSearchCache");
          if (busSearchCache != null) {
            busSearchCache.clear();
            log.info("Cleared busSearchCache after deactivating bus {}", bus.id().value());
          }

          // Update resolution message
          String deactivationNote = String.format("Bus deactivated from search results. Issue type: %s",
              issueType);
          issue.setResolution(issue.getResolution() != null
              ? issue.getResolution() + " | " + deactivationNote
              : deactivationNote);
        }
      }
    }

    RouteIssue savedIssue = routeIssuePort.save(issue);

    log.info("Updated issue {} status: {} -> {}", issueId, oldStatus, newStatus);

    return StatusUpdateResult.success(savedIssue, busDeactivated);
  }

  /**
   * Update issue priority (Admin)
   */
  @Transactional
  public boolean updatePriority(Long issueId, IssuePriority priority) {
    Optional<RouteIssue> optIssue = routeIssuePort.findById(issueId);
    if (optIssue.isEmpty()) {
      return false;
    }

    RouteIssue issue = optIssue.get();
    issue.setPriority(priority);
    routeIssuePort.save(issue);

    log.info("Updated issue {} priority to {}", issueId, priority);
    return true;
  }

  /**
   * Get detailed issue information including bus route details (Admin)
   */
  public Optional<IssueDetails> getIssueDetails(Long issueId) {
    Optional<RouteIssue> optIssue = routeIssuePort.findById(issueId);
    if (optIssue.isEmpty()) {
      return Optional.empty();
    }

    RouteIssue issue = optIssue.get();
    BusDTO busDetails = null;
    List<StopDTO> stops = List.of();
    boolean busNotFound = false;

    if (issue.getBusId() != null) {
      try {
        Optional<BusDTO> busOpt = busScheduleService.getBusById(issue.getBusId());
        if (busOpt.isPresent()) {
          busDetails = busOpt.get();
          try {
            stops = busScheduleService.getStopsForBus(issue.getBusId(), "en");
          } catch (Exception e) {
            log.warn("Could not fetch stops for bus {}: {}", issue.getBusId(), e.getMessage());
          }
        } else {
          busNotFound = true;
        }
      } catch (Exception e) {
        log.warn("Could not fetch bus details for id {}: {}", issue.getBusId(), e.getMessage());
      }
    }

    return Optional.of(new IssueDetails(issue, busDetails, stops, busNotFound));
  }

  private IssuePriority determinePriority(IssueType type) {
    return switch (type) {
      case BUS_NOT_AVAILABLE, SERVICE_SUSPENDED -> IssuePriority.HIGH;
      case WRONG_TIMING, ROUTE_CHANGED -> IssuePriority.MEDIUM;
      case WRONG_STOPS, WRONG_FARE, WRONG_SCHEDULE -> IssuePriority.MEDIUM;
      case OTHER -> IssuePriority.LOW;
    };
  }

  // ================== DTOs ==================

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

  public record IssueStatistics(
      Map<String, Long> byStatus,
      Map<String, Long> byType,
      long totalPending,
      int highPriorityCount) {
  }

  public record IssueDetails(
      RouteIssue issue,
      BusDTO currentBusDetails,
      List<StopDTO> currentStops,
      boolean busNotFound) {
  }

  public sealed interface SubmitResult {
    static SubmitResult success(Long issueId, IssueStatus status) {
      return new Success(issueId, status);
    }

    static SubmitResult existingIssue(Long issueId, int reportCount) {
      return new ExistingIssue(issueId, reportCount);
    }

    static SubmitResult validationError(String error) {
      return new ValidationError(error);
    }

    record Success(Long issueId, IssueStatus status) implements SubmitResult {
    }

    record ExistingIssue(Long issueId, int reportCount) implements SubmitResult {
    }

    record ValidationError(String error) implements SubmitResult {
    }
  }

  public sealed interface StatusUpdateResult {
    static StatusUpdateResult success(RouteIssue issue, boolean busDeactivated) {
      return new Success(issue, busDeactivated);
    }

    static StatusUpdateResult notFound() {
      return new NotFound();
    }

    record Success(RouteIssue issue, boolean busDeactivated) implements StatusUpdateResult {
    }

    record NotFound() implements StatusUpdateResult {
    }
  }
}
