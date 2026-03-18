package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.ContributionStatus;
import com.perundhu.domain.port.ImageContributionInputPort;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.port.InputValidationPort;
import com.perundhu.domain.port.SecurityMonitoringPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Application service for image contribution operations.
 * Follows Single Responsibility Principle - handles only image contributions.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ImageContributionService implements ImageContributionInputPort {

  private final ImageContributionOutputPort imageContributionOutputPort;
  private final InputValidationPort inputValidationPort;
  private final SecurityMonitoringPort securityMonitoringPort;

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
  public void approveImageContribution(String contributionId, String adminId) {
    log.info("Approving image contribution {} by admin: {}", contributionId, adminId);
    updateContributionStatus(contributionId, ContributionStatus.APPROVED, "Approved by admin: " + adminId);
  }

  @Override
  public void rejectImageContribution(String contributionId, String reason, String adminId) {
    log.info("Rejecting image contribution {} - Reason: {} by admin: {}", contributionId, reason, adminId);
    updateContributionStatus(contributionId, ContributionStatus.REJECTED, reason + " (Admin: " + adminId + ")");
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<ImageContribution> findById(String contributionId) {
    return imageContributionOutputPort.findById(contributionId);
  }

  // Private helper methods
  private void updateContributionStatus(String contributionId, ContributionStatus status, String reason) {
    Optional<ImageContribution> imageOpt = imageContributionOutputPort.findById(contributionId);
    if (imageOpt.isPresent()) {
      ImageContribution updated = imageOpt.get().toBuilder()
          .status(status.getValue())
          .validationMessage(reason)
          .processedDate(LocalDateTime.now())
          .build();
      imageContributionOutputPort.save(updated);
    } else {
      throw new IllegalArgumentException("Image contribution not found: " + contributionId);
    }
  }

  private ImageContribution createImageContributionFromData(Map<String, Object> data, String userId) {
    return ImageContribution.builder()
        .id(UUID.randomUUID().toString())
        .userId(userId)
        .description((String) data.get("description"))
        .location((String) data.get("location"))
        .routeName((String) data.get("routeName"))
        .imageUrl((String) data.get("imageUrl"))
        .status(ContributionStatus.PENDING.getValue())
        .submissionDate(LocalDateTime.now())
        .additionalNotes((String) data.get("additionalNotes"))
        .build();
  }
}
