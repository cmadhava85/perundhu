package com.perundhu.application.service;

import com.perundhu.application.port.in.AdminUseCase;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.port.RouteContributionPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service implementation for admin operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService implements AdminUseCase {

  private final RouteContributionPort routeContributionPort;
  private final ImageContributionOutputPort imageContributionOutputPort;
  private final ContributionProcessingService contributionProcessingService;

  @Override
  public List<RouteContribution> getAllRouteContributions() {
    log.debug("Getting all route contributions");
    return routeContributionPort.findAllRouteContributions();
  }

  @Override
  public List<RouteContribution> getPendingRouteContributions() {
    log.debug("Getting pending route contributions");
    return routeContributionPort.findRouteContributionsByStatus("PENDING");
  }

  @Override
  @Transactional
  public RouteContribution approveRouteContribution(String id) {
    log.info("Approving route contribution with ID: {}", id);
    RouteContribution contribution = routeContributionPort.findRouteContributionById(id)
        .orElseThrow(() -> new RuntimeException("Route contribution not found: " + id));

    contribution.setStatus("APPROVED");
    RouteContribution savedContribution = routeContributionPort.saveRouteContribution(contribution);

    // Integrate the approved contribution into main bus tables
    try {
      contributionProcessingService.integrateApprovedContribution(savedContribution);
      log.info("Successfully integrated approved route contribution ID: {}", id);
    } catch (Exception e) {
      log.error("Error integrating approved route contribution ID {}: {}", id, e.getMessage(), e);
      // Update status to indicate integration failure
      savedContribution.setStatus("INTEGRATION_FAILED");
      savedContribution.setValidationMessage("Failed to integrate into bus system: " + e.getMessage());
      savedContribution = routeContributionPort.saveRouteContribution(savedContribution);
    }

    return savedContribution;
  }

  @Override
  @Transactional
  public RouteContribution rejectRouteContribution(String id, String reason) {
    log.info("Rejecting route contribution with ID: {} for reason: {}", id, reason);
    RouteContribution contribution = routeContributionPort.findRouteContributionById(id)
        .orElseThrow(() -> new RuntimeException("Route contribution not found: " + id));

    contribution.setStatus("REJECTED");
    contribution.setValidationMessage(reason);
    return routeContributionPort.saveRouteContribution(contribution);
  }

  @Override
  @Transactional
  public void deleteRouteContribution(String id) {
    log.info("Deleting route contribution with ID: {}", id);
    routeContributionPort.deleteRouteContribution(id);
  }

  @Override
  public List<ImageContribution> getAllImageContributions() {
    log.debug("Getting all image contributions");
    return imageContributionOutputPort.findAll();
  }

  @Override
  public List<ImageContribution> getPendingImageContributions() {
    log.debug("Getting pending image contributions");
    return imageContributionOutputPort.findByStatus("PENDING");
  }

  @Override
  @Transactional
  public ImageContribution approveImageContribution(String id) {
    log.info("Approving image contribution with ID: {}", id);
    ImageContribution contribution = imageContributionOutputPort.findById(id)
        .orElseThrow(() -> new RuntimeException("Image contribution not found: " + id));

    contribution.setStatus("APPROVED");
    return imageContributionOutputPort.save(contribution);
  }

  @Override
  @Transactional
  public ImageContribution rejectImageContribution(String id, String reason) {
    log.info("Rejecting image contribution with ID: {} for reason: {}", id, reason);
    ImageContribution contribution = imageContributionOutputPort.findById(id)
        .orElseThrow(() -> new RuntimeException("Image contribution not found: " + id));

    contribution.setStatus("REJECTED");
    contribution.setValidationMessage(reason);
    return imageContributionOutputPort.save(contribution);
  }

  @Override
  @Transactional
  public void deleteImageContribution(String id) {
    log.info("Deleting image contribution with ID: {}", id);
    imageContributionOutputPort.deleteById(id);
  }
}