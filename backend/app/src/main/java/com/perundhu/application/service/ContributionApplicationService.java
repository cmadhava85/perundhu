package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.port.ContributionInputPort;
import com.perundhu.domain.port.ContributionProcessingPort;
import com.perundhu.domain.port.RouteContributionInputPort;
import com.perundhu.domain.port.ImageContributionInputPort;
import com.perundhu.domain.port.ContributionQueryPort;
import com.perundhu.domain.port.RouteContributionOutputPort;
import com.perundhu.domain.port.ImageContributionOutputPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Legacy application service - delegates to new SOLID-compliant services.
 * 
 * @deprecated Use the new split services instead:
 *   - {@link RouteContributionService} for route operations
 *   - {@link ImageContributionService} for image operations
 *   - {@link ContributionQueryService} for query operations
 * 
 * This class is maintained for backward compatibility only.
 */
@Deprecated
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ContributionApplicationService implements ContributionInputPort, ContributionProcessingPort {

  // New SOLID-compliant services
  private final RouteContributionInputPort routeContributionService;
  private final ImageContributionInputPort imageContributionService;
  private final ContributionQueryPort contributionQueryService;
  
  // Keep for backward compatibility with processing logic
  private final RouteContributionOutputPort routeContributionOutputPort;
  private final ImageContributionOutputPort imageContributionOutputPort;

  @Override
  public RouteContribution submitRouteContribution(Map<String, Object> contributionData, String userId) {
    log.debug("Legacy service - delegating to RouteContributionService");
    return routeContributionService.submitRouteContribution(contributionData, userId);
  }

  @Override
  public ImageContribution submitImageContribution(Map<String, Object> contributionData, String userId) {
    log.debug("Legacy service - delegating to ImageContributionService");
    return imageContributionService.submitImageContribution(contributionData, userId);
  }

  @Override
  public void processPendingContributions() {
    log.info("Processing pending contributions");
    List<RouteContribution> pendingRoutes = routeContributionOutputPort.findByStatus("PENDING");
    for (RouteContribution contribution : pendingRoutes) {
      log.info("Processing route contribution: {}", contribution.getId());
    }
    List<ImageContribution> pendingImages = imageContributionOutputPort.findByStatus("PENDING");
    for (ImageContribution contribution : pendingImages) {
      log.info("Processing image contribution: {}", contribution.getId());
    }
  }

  @Override
  public List<Map<String, Object>> getUserContributions(String userId) {
    log.debug("Legacy service - delegating to ContributionQueryService");
    return contributionQueryService.getUserContributions(userId);
  }

  @Override
  public void updateContributionStatus(String contributionId, String status, String reason) {
    log.info("Updating contribution {} to status: {}", contributionId, status);
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
    log.debug("Legacy service - delegating to ContributionQueryService");
    return contributionQueryService.getAllContributions();
  }

  @Override
  public List<RouteContribution> getPendingRouteContributions() {
    log.debug("Legacy service - delegating to ContributionQueryService");
    return contributionQueryService.getPendingRouteContributions();
  }

  @Override
  public List<ImageContribution> getPendingImageContributions() {
    log.debug("Legacy service - delegating to ContributionQueryService");
    return contributionQueryService.getPendingImageContributions();
  }

  @Override
  public void approveRouteContribution(String contributionId, String adminId) {
    log.debug("Legacy service - delegating to RouteContributionService");
    routeContributionService.approveRouteContribution(contributionId, adminId);
  }

  @Override
  public void rejectRouteContribution(String contributionId, String reason, String adminId) {
    log.debug("Legacy service - delegating to RouteContributionService");
    routeContributionService.rejectRouteContribution(contributionId, reason, adminId);
  }

  @Override
  public void approveImageContribution(String contributionId, String adminId) {
    log.debug("Legacy service - delegating to ImageContributionService");
    imageContributionService.approveImageContribution(contributionId, adminId);
  }

  @Override
  public void rejectImageContribution(String contributionId, String reason, String adminId) {
    log.debug("Legacy service - delegating to ImageContributionService");
    imageContributionService.rejectImageContribution(contributionId, reason, adminId);
  }

  @Override
  public Map<String, Object> getContributionStatistics() {
    log.debug("Legacy service - computing statistics from repositories");
    Map<String, Object> stats = new HashMap<>();
    long totalRoutes = routeContributionOutputPort.count();
    long pendingRoutes = routeContributionOutputPort.countByStatus("PENDING");
    long approvedRoutes = routeContributionOutputPort.countByStatus("APPROVED");
    long rejectedRoutes = routeContributionOutputPort.countByStatus("REJECTED");
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
    log.debug("Legacy service - delegating to ImageContributionService");
    return imageContributionService.findById(contributionId);
  }
}
