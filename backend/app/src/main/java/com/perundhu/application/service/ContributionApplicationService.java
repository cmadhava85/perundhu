package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.StopContribution;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.port.ContributionInputPort;
import com.perundhu.domain.port.RouteContributionOutputPort;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.port.InputValidationPort;
import com.perundhu.domain.port.SecurityMonitoringPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Application service implementing contribution use cases.
 * This is the primary entry point for all contribution-related operations.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ContributionApplicationService implements ContributionInputPort {

  private final RouteContributionOutputPort routeContributionOutputPort;
  private final ImageContributionOutputPort imageContributionOutputPort;
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
  public ImageContribution submitImageContribution(Map<String, Object> contributionData, String userId) {
    log.info("Processing image contribution submission for user: {}", userId);

    // Validate input data
    var validationResult = inputValidationPort.validateContributionData(contributionData);
    if (!validationResult.valid()) {
      throw new IllegalArgumentException("Invalid contribution data: " + validationResult.errors());
    }

    // Create domain model from validated data
    ImageContribution contribution = createImageContributionFromData(validationResult.sanitizedValues(), userId);

    // Save contribution
    ImageContribution saved = imageContributionOutputPort.save(contribution);

    log.info("Successfully saved image contribution with ID: {}", saved.getId());
    return saved;
  }

  @Override
  public void processPendingContributions() {
    log.info("Processing pending contributions");

    // Get pending route contributions
    List<RouteContribution> pendingRoutes = routeContributionOutputPort.findByStatus("PENDING");
    for (RouteContribution contribution : pendingRoutes) {
      // Process validation logic here
      processRouteContribution(contribution);
    }

    // Get pending image contributions
    List<ImageContribution> pendingImages = imageContributionOutputPort.findByStatus("PENDING");
    for (ImageContribution contribution : pendingImages) {
      // Process validation logic here
      processImageContribution(contribution);
    }
  }

  @Override
  public List<Map<String, Object>> getUserContributions(String userId) {
    List<Map<String, Object>> result = new ArrayList<>();

    // Get route contributions
    List<RouteContribution> routeContributions = routeContributionOutputPort.findByUserId(userId);
    for (RouteContribution contribution : routeContributions) {
      Map<String, Object> contributionMap = createContributionMap(contribution, "ROUTE");
      result.add(contributionMap);
    }

    // Get image contributions
    List<ImageContribution> imageContributions = imageContributionOutputPort.findByUserId(userId);
    for (ImageContribution contribution : imageContributions) {
      Map<String, Object> contributionMap = createContributionMap(contribution, "IMAGE");
      result.add(contributionMap);
    }

    return result;
  }

  @Override
  public void updateContributionStatus(String contributionId, String status, String reason) {
    log.info("Updating contribution {} to status: {}", contributionId, status);

    // Try to find as route contribution first
    Optional<RouteContribution> routeOpt = routeContributionOutputPort.findById(contributionId);
    if (routeOpt.isPresent()) {
      RouteContribution updated = routeOpt.get().toBuilder()
          .status(status)
          .validationMessage(reason)
          .processedDate(LocalDateTime.now())
          .build();
      routeContributionOutputPort.save(updated);
      return;
    }

    // Try to find as image contribution
    Optional<ImageContribution> imageOpt = imageContributionOutputPort.findById(contributionId);
    if (imageOpt.isPresent()) {
      ImageContribution updated = imageOpt.get().toBuilder()
          .status(status)
          .validationMessage(reason)
          .processedDate(LocalDateTime.now())
          .build();
      imageContributionOutputPort.save(updated);
      return;
    }

    throw new IllegalArgumentException("Contribution not found: " + contributionId);
  }

  @Override
  public List<Map<String, Object>> getAllContributions() {
    List<Map<String, Object>> result = new ArrayList<>();

    // Get all route contributions
    List<RouteContribution> routeContributions = routeContributionOutputPort.findAll();
    for (RouteContribution contribution : routeContributions) {
      Map<String, Object> contributionMap = createContributionMap(contribution, "ROUTE");
      contributionMap.put("userId", contribution.getUserId());
      result.add(contributionMap);
    }

    // Get all image contributions
    List<ImageContribution> imageContributions = imageContributionOutputPort.findAll();
    for (ImageContribution contribution : imageContributions) {
      Map<String, Object> contributionMap = createContributionMap(contribution, "IMAGE");
      contributionMap.put("userId", contribution.getUserId());
      result.add(contributionMap);
    }

    return result;
  }

  @Override
  public List<RouteContribution> getPendingRouteContributions() {
    return routeContributionOutputPort.findByStatus("PENDING");
  }

  @Override
  public List<ImageContribution> getPendingImageContributions() {
    return imageContributionOutputPort.findByStatus("PENDING");
  }

  @Override
  public void approveRouteContribution(String contributionId, String adminId) {
    updateContributionStatus(contributionId, "APPROVED", "Approved by admin: " + adminId);
  }

  @Override
  public void rejectRouteContribution(String contributionId, String reason, String adminId) {
    updateContributionStatus(contributionId, "REJECTED", reason + " (Admin: " + adminId + ")");
  }

  @Override
  public void approveImageContribution(String contributionId, String adminId) {
    updateContributionStatus(contributionId, "APPROVED", "Approved by admin: " + adminId);
  }

  @Override
  public void rejectImageContribution(String contributionId, String reason, String adminId) {
    updateContributionStatus(contributionId, "REJECTED", reason + " (Admin: " + adminId + ")");
  }

  @Override
  public Map<String, Object> getContributionStatistics() {
    Map<String, Object> stats = new HashMap<>();

    // Route contribution stats
    long totalRoutes = routeContributionOutputPort.count();
    long pendingRoutes = routeContributionOutputPort.countByStatus("PENDING");
    long approvedRoutes = routeContributionOutputPort.countByStatus("APPROVED");
    long rejectedRoutes = routeContributionOutputPort.countByStatus("REJECTED");

    // Image contribution stats
    long totalImages = imageContributionOutputPort.count();
    long pendingImages = imageContributionOutputPort.countByStatus("PENDING");
    long approvedImages = imageContributionOutputPort.countByStatus("APPROVED");
    long rejectedImages = imageContributionOutputPort.countByStatus("REJECTED");

    stats.put("totalContributions", totalRoutes + totalImages);
    stats.put("totalRouteContributions", totalRoutes);
    stats.put("totalImageContributions", totalImages);
    stats.put("pendingContributions", pendingRoutes + pendingImages);
    stats.put("approvedContributions", approvedRoutes + approvedImages);
    stats.put("rejectedContributions", rejectedRoutes + rejectedImages);

    return stats;
  }

  @Override
  public Optional<ImageContribution> findById(String contributionId) {
    return imageContributionOutputPort.findById(contributionId);
  }

  // Private helper methods
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
        .status("PENDING")
        .submissionDate(LocalDateTime.now())
        .additionalNotes((String) data.get("additionalNotes"))
        .submittedBy(userId)
        .stops(stops)
        .sourceBusId(sourceBusId)
        .contributionType((String) data.get("contributionType"))
        .build();
  }

  private ImageContribution createImageContributionFromData(Map<String, Object> data, String userId) {
    return ImageContribution.builder()
        .id(UUID.randomUUID().toString())
        .userId(userId)
        .description((String) data.get("description"))
        .location((String) data.get("location"))
        .routeName((String) data.get("routeName"))
        .imageUrl((String) data.get("imageUrl"))
        .status("PENDING")
        .submissionDate(LocalDateTime.now())
        .additionalNotes((String) data.get("additionalNotes"))
        .build();
  }

  private void processRouteContribution(RouteContribution contribution) {
    // Add business logic for route contribution processing
    log.info("Processing route contribution: {}", contribution.getId());
  }

  private void processImageContribution(ImageContribution contribution) {
    // Add business logic for image contribution processing
    log.info("Processing image contribution: {}", contribution.getId());
  }

  private Map<String, Object> createContributionMap(RouteContribution contribution, String type) {
    Map<String, Object> map = new HashMap<>();
    map.put("id", contribution.getId());
    map.put("type", type);
    map.put("status", contribution.getStatus());
    map.put("submissionDate", contribution.getSubmissionDate().toString());
    map.put("fromLocation", contribution.getFromLocationName());
    map.put("toLocation", contribution.getToLocationName());
    map.put("busNumber", contribution.getBusNumber());
    return map;
  }

  private Map<String, Object> createContributionMap(ImageContribution contribution, String type) {
    Map<String, Object> map = new HashMap<>();
    map.put("id", contribution.getId());
    map.put("type", type);
    map.put("status", contribution.getStatus());
    map.put("submissionDate", contribution.getSubmissionDate().toString());
    map.put("description", contribution.getDescription());
    map.put("location", contribution.getLocation());
    map.put("imageUrl", contribution.getImageUrl());
    return map;
  }
}