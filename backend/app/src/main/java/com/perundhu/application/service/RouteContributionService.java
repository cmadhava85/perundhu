package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.StopContribution;
import com.perundhu.domain.model.ContributionStatus;
import com.perundhu.domain.port.RouteContributionInputPort;
import com.perundhu.domain.port.RouteContributionOutputPort;
import com.perundhu.domain.port.InputValidationPort;
import com.perundhu.domain.port.SecurityMonitoringPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Application service for route contribution operations.
 * Follows Single Responsibility Principle - handles only route contributions.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class RouteContributionService implements RouteContributionInputPort {

  private final RouteContributionOutputPort routeContributionOutputPort;
  private final InputValidationPort inputValidationPort;
  private final SecurityMonitoringPort securityMonitoringPort;

  @Override
  public RouteContribution submitRouteContribution(Map<String, Object> contributionData, String userId) {
    log.info("Processing route contribution submission for user: {}", userId);

    // Validate input data
    var validationResult = inputValidationPort.validateContributionData(contributionData);
    if (!validationResult.valid()) {
      throw new IllegalArgumentException("Invalid contribution data: " + validationResult.errors());
    }

    // Create domain model from validated data
    RouteContribution contribution = createRouteContributionFromData(validationResult.sanitizedValues(), userId);

    // Save contribution
    RouteContribution saved = routeContributionOutputPort.save(contribution);

    log.info("Successfully saved route contribution with ID: {}", saved.getId());
    return saved;
  }

  @Override
  public void approveRouteContribution(String contributionId, String adminId) {
    log.info("Approving route contribution {} by admin: {}", contributionId, adminId);
    updateContributionStatus(contributionId, ContributionStatus.APPROVED, "Approved by admin: " + adminId);
  }

  @Override
  public void rejectRouteContribution(String contributionId, String reason, String adminId) {
    log.info("Rejecting route contribution {} - Reason: {} by admin: {}", contributionId, reason, adminId);
    updateContributionStatus(contributionId, ContributionStatus.REJECTED, reason + " (Admin: " + adminId + ")");
  }

  // Private helper methods
  private void updateContributionStatus(String contributionId, ContributionStatus status, String reason) {
    Optional<RouteContribution> routeOpt = routeContributionOutputPort.findById(contributionId);
    if (routeOpt.isPresent()) {
      RouteContribution updated = routeOpt.get().toBuilder()
          .status(status.getValue())
          .validationMessage(reason)
          .processedDate(LocalDateTime.now())
          .build();
      routeContributionOutputPort.save(updated);
    } else {
      throw new IllegalArgumentException("Route contribution not found: " + contributionId);
    }
  }

  private RouteContribution createRouteContributionFromData(Map<String, Object> data, String userId) {
    // Extract stops if present
    List<StopContribution> stops = new ArrayList<>();
    @SuppressWarnings("unchecked")
    List<Map<String, Object>> stopsData = (List<Map<String, Object>>) data.get("stops");
    if (stopsData != null && !stopsData.isEmpty()) {
      for (Map<String, Object> stopData : stopsData) {
        StopContribution stop = StopContribution.builder()
            .name((String) stopData.get("name"))
            .arrivalTime((String) stopData.get("arrivalTime"))
            .departureTime((String) stopData.get("departureTime"))
            .stopOrder(stopData.get("stopOrder") != null ? 
                Integer.valueOf(stopData.get("stopOrder").toString()) : null)
            .latitude(stopData.get("latitude") != null ? 
                Double.valueOf(stopData.get("latitude").toString()) : null)
            .longitude(stopData.get("longitude") != null ? 
                Double.valueOf(stopData.get("longitude").toString()) : null)
            .build();
        stops.add(stop);
      }
    }

    // Extract sourceBusId if present
    Long sourceBusId = null;
    if (data.get("sourceBusId") != null) {
      sourceBusId = Long.valueOf(data.get("sourceBusId").toString());
    }

    return RouteContribution.builder()
        .id(UUID.randomUUID().toString())
        .userId(userId)
        .busNumber((String) data.get("busNumber"))
        .busName((String) data.get("busName"))
        .fromLocationName((String) data.get("fromLocationName"))
        .toLocationName((String) data.get("toLocationName"))
        .fromLatitude((Double) data.get("fromLatitude"))
        .fromLongitude((Double) data.get("fromLongitude"))
        .toLatitude((Double) data.get("toLatitude"))
        .toLongitude((Double) data.get("toLongitude"))
        .departureTime((String) data.get("departureTime"))
        .arrivalTime((String) data.get("arrivalTime"))
        .scheduleInfo((String) data.get("scheduleInfo"))
        .status(ContributionStatus.PENDING.getValue())
        .submissionDate(LocalDateTime.now())
        .additionalNotes((String) data.get("additionalNotes"))
        .submittedBy(userId)
        .stops(stops)
        .sourceBusId(sourceBusId)
        .contributionType((String) data.get("contributionType"))
        .build();
  }
}
