package com.perundhu.infrastructure.adapter;

import org.springframework.stereotype.Component;
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
  public List<RouteContribution> findAllRouteContributions() {
    return routeContributionRepository.findAll();
  }

  @Override
  public List<RouteContribution> findRouteContributionsByStatus(String status) {
    return routeContributionRepository.findByStatus(status);
  }

  @Override
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