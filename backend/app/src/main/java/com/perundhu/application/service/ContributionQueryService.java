package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.port.ContributionQueryPort;
import com.perundhu.domain.port.RouteContributionOutputPort;
import com.perundhu.domain.port.ImageContributionOutputPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Query service for contribution read operations.
 * Follows Single Responsibility Principle - handles only queries.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class ContributionQueryService implements ContributionQueryPort {

  private final RouteContributionOutputPort routeContributionOutputPort;
  private final ImageContributionOutputPort imageContributionOutputPort;

  @Override
  public List<Map<String, Object>> getUserContributions(String userId) {
    log.debug("Fetching all contributions for user: {}", userId);
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
  public List<Map<String, Object>> getAllContributions() {
    log.debug("Fetching all contributions from database");
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
    log.debug("Fetching pending route contributions");
    List<RouteContribution> pending = routeContributionOutputPort.findByStatus("PENDING");
    log.debug("Found {} pending route contributions", pending.size());
    return pending;
  }

  @Override
  public List<ImageContribution> getPendingImageContributions() {
    log.debug("Fetching pending image contributions");
    List<ImageContribution> pending = imageContributionOutputPort.findByStatus("PENDING");
    log.debug("Found {} pending image contributions", pending.size());
    return pending;
  }

  // Private helper methods
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
