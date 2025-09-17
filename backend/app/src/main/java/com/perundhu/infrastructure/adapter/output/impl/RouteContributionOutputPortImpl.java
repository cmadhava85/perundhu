package com.perundhu.infrastructure.adapter.output.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.RouteContributionOutputPort;
import com.perundhu.domain.port.RouteContributionRepository;

/**
 * Implementation of RouteContributionOutputPort that delegates to the domain
 * repository
 * This follows hexagonal architecture by adapting the infrastructure output
 * port to the domain repository
 */
@Component
public class RouteContributionOutputPortImpl implements RouteContributionOutputPort {

  private final RouteContributionRepository repository;

  public RouteContributionOutputPortImpl(RouteContributionRepository repository) {
    this.repository = repository;
  }

  @Override
  public RouteContribution save(RouteContribution contribution) {
    return repository.save(contribution);
  }

  @Override
  public Optional<RouteContribution> findById(String id) {
    return repository.findById(id);
  }

  @Override
  public List<RouteContribution> findAll() {
    return repository.findAll();
  }

  @Override
  public List<RouteContribution> findByUserId(String userId) {
    return repository.findByUserId(userId);
  }

  @Override
  public List<RouteContribution> findByStatus(String status) {
    return repository.findByStatus(status);
  }

  @Override
  public List<RouteContribution> findBySubmittedBy(String submittedBy) {
    return repository.findBySubmittedBy(submittedBy);
  }

  @Override
  public List<RouteContribution> findBySubmittedByAndSubmissionDateAfter(String submittedBy,
      LocalDateTime submissionDate) {
    return repository.findBySubmittedByAndSubmissionDateAfter(submittedBy, submissionDate);
  }

  @Override
  public void deleteById(String id) {
    repository.deleteById(id);
  }

  @Override
  public long count() {
    return repository.count();
  }

  @Override
  public long countByStatus(String status) {
    return repository.countByStatus(status);
  }
}