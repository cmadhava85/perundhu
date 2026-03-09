package com.perundhu.infrastructure.adapter;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.RouteContributionPort;
import com.perundhu.domain.port.RouteContributionRepository;

import java.util.List;
import java.util.Optional;

/**
 * Adapter implementation for RouteContributionPort that delegates to
 * RouteContributionRepository
 */
@Component
@RequiredArgsConstructor
public class RouteContributionPortAdapter implements RouteContributionPort {

  private final RouteContributionRepository routeContributionRepository;

  @Override
  @Transactional(readOnly = true)
  public List<RouteContribution> findAllRouteContributions() {
    return routeContributionRepository.findAll();
  }

  @Override
  @Transactional(readOnly = true)
  public List<RouteContribution> findAllRouteContributionsPaged(int page, int size) {
    return routeContributionRepository.findAllPaged(page, size);
  }

  @Override
  @Transactional(readOnly = true)
  public long countAllRouteContributions() {
    return routeContributionRepository.count();
  }

  @Override
  @Transactional(readOnly = true)
  public List<RouteContribution> findRouteContributionsByStatus(String status) {
    return routeContributionRepository.findByStatus(status);
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<RouteContribution> findRouteContributionById(String id) {
    return routeContributionRepository.findById(id);
  }

  @Override
  public RouteContribution saveRouteContribution(RouteContribution contribution) {
    return routeContributionRepository.save(contribution);
  }

  @Override
  public void deleteRouteContribution(String id) {
    routeContributionRepository.deleteById(id);
  }
}