package com.perundhu.application.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.application.port.in.AdminUseCase;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.port.RouteContributionPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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
    List<RouteContribution> pending = routeContributionPort.findRouteContributionsByStatus("PENDING");

    log.debug("Found {} PENDING contributions", pending.size());
    return pending;
  }

  @Override
  @Transactional
  public RouteContribution approveRouteContribution(String id) {
    log.info("Approving route contribution with ID: {}", id);

    RouteContribution contribution = routeContributionPort.findRouteContributionById(id)
        .orElseThrow(() -> new RuntimeException("Route contribution not found: " + id));

    // Update status to approved
    contribution.setStatus("APPROVED");
    contribution.setProcessedDate(java.time.LocalDateTime.now());
    contribution.setValidationMessage("Approved by admin");

    // Save first
    RouteContribution saved = routeContributionPort.saveRouteContribution(contribution);

    // Trigger immediate integration into bus database
    try {
      contributionProcessingService.integrateApprovedContribution(saved);
      log.info("Successfully integrated route contribution ID {} after admin approval", id);
    } catch (Exception e) {
      log.error("Failed to integrate route contribution ID {} after approval: {}", id, e.getMessage(), e);
      // Don't throw - contribution is still approved, integration will be retried by
      // scheduled job
    }

    return saved;
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
  public List<ImageContribution> getPendingImageContributionsPaged(int page, int size) {
    log.debug("Getting pending image contributions with pagination - page: {}, size: {}", page, size);
    return imageContributionOutputPort.findByStatusPaged("PENDING", page, size);
  }

  @Override
  public List<ImageContribution> getImageContributionsPaged(int page, int size) {
    log.debug("Getting all image contributions with pagination - page: {}, size: {}", page, size);
    return imageContributionOutputPort.findAllPaged(page, size);
  }

  @Override
  public long countPendingImageContributions() {
    log.debug("Counting pending image contributions");
    return imageContributionOutputPort.countByStatus("PENDING");
  }

  @Override
  public long countAllImageContributions() {
    log.debug("Counting all image contributions");
    return imageContributionOutputPort.count();
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