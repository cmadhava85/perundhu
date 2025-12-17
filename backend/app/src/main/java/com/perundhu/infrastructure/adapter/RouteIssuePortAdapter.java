package com.perundhu.infrastructure.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import com.perundhu.domain.model.RouteIssue;
import com.perundhu.domain.port.RouteIssuePort;
import com.perundhu.infrastructure.persistence.entity.RouteIssueJpaEntity;
import com.perundhu.infrastructure.persistence.repository.RouteIssueJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Infrastructure adapter for RouteIssue persistence.
 * Implements the domain port using JPA repository.
 * Following hexagonal architecture pattern.
 */
@Component
@RequiredArgsConstructor
public class RouteIssuePortAdapter implements RouteIssuePort {

  private final RouteIssueJpaRepository jpaRepository;

  @Override
  public RouteIssue save(RouteIssue routeIssue) {
    RouteIssueJpaEntity entity = toEntity(routeIssue);
    RouteIssueJpaEntity saved = jpaRepository.save(entity);
    return toDomain(saved);
  }

  @Override
  public Optional<RouteIssue> findById(Long id) {
    return jpaRepository.findById(id).map(this::toDomain);
  }

  @Override
  public List<RouteIssue> findByStatus(RouteIssue.IssueStatus status) {
    return jpaRepository.findByStatus(toJpaStatus(status))
        .stream()
        .map(this::toDomain)
        .toList();
  }

  @Override
  public PagedResult<RouteIssue> findByStatus(RouteIssue.IssueStatus status, int page, int size) {
    Page<RouteIssueJpaEntity> pagedResult = jpaRepository.findByStatus(
        toJpaStatus(status),
        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

    return new PagedResult<>(
        pagedResult.getContent().stream().map(this::toDomain).toList(),
        pagedResult.getTotalElements(),
        page,
        pagedResult.getTotalPages());
  }

  @Override
  public List<RouteIssue> findByBusId(Long busId) {
    return jpaRepository.findByBusId(busId)
        .stream()
        .map(this::toDomain)
        .toList();
  }

  @Override
  public List<RouteIssue> findByReporterIdOrderByCreatedAtDesc(String reporterId) {
    return jpaRepository.findByReporterIdOrderByCreatedAtDesc(reporterId)
        .stream()
        .map(this::toDomain)
        .toList();
  }

  @Override
  public Optional<RouteIssue> findFirstByBusIdAndIssueTypeAndStatusIn(
      Long busId, RouteIssue.IssueType issueType, List<RouteIssue.IssueStatus> statuses) {
    List<RouteIssueJpaEntity.IssueStatus> jpaStatuses = statuses.stream()
        .map(this::toJpaStatus)
        .toList();
    return jpaRepository.findFirstByBusIdAndIssueTypeAndStatusIn(
        busId, toJpaIssueType(issueType), jpaStatuses)
        .map(this::toDomain);
  }

  @Override
  public List<RouteIssue> findIssuesForRoute(String fromLocation, String toLocation) {
    return jpaRepository.findIssuesForRoute(fromLocation, toLocation)
        .stream()
        .map(this::toDomain)
        .toList();
  }

  @Override
  public List<RouteIssue> findHighPriorityIssues() {
    return jpaRepository.findHighPriorityIssues()
        .stream()
        .map(this::toDomain)
        .toList();
  }

  @Override
  public long countByStatus(RouteIssue.IssueStatus status) {
    return jpaRepository.countByStatus(toJpaStatus(status));
  }

  @Override
  public long countByIssueType(RouteIssue.IssueType issueType) {
    return jpaRepository.countByIssueType(toJpaIssueType(issueType));
  }

  @Override
  public void deleteById(Long id) {
    jpaRepository.deleteById(id);
  }

  // ================== MAPPING METHODS ==================

  private RouteIssue toDomain(RouteIssueJpaEntity entity) {
    return RouteIssue.builder()
        .id(entity.getId())
        .busId(entity.getBusId())
        .busName(entity.getBusName())
        .busNumber(entity.getBusNumber())
        .fromLocation(entity.getFromLocation())
        .toLocation(entity.getToLocation())
        .issueType(toDomainIssueType(entity.getIssueType()))
        .description(entity.getDescription())
        .suggestedDepartureTime(entity.getSuggestedDepartureTime())
        .suggestedArrivalTime(entity.getSuggestedArrivalTime())
        .lastTraveledDate(entity.getLastTraveledDate())
        .status(toDomainStatus(entity.getStatus()))
        .priority(toDomainPriority(entity.getPriority()))
        .reportCount(entity.getReportCount())
        .reporterId(entity.getReporterId())
        .adminNotes(entity.getAdminNotes())
        .resolution(entity.getResolution())
        .createdAt(entity.getCreatedAt())
        .updatedAt(entity.getUpdatedAt())
        .resolvedAt(entity.getResolvedAt())
        .build();
  }

  private RouteIssueJpaEntity toEntity(RouteIssue domain) {
    return RouteIssueJpaEntity.builder()
        .id(domain.getId())
        .busId(domain.getBusId())
        .busName(domain.getBusName())
        .busNumber(domain.getBusNumber())
        .fromLocation(domain.getFromLocation())
        .toLocation(domain.getToLocation())
        .issueType(toJpaIssueType(domain.getIssueType()))
        .description(domain.getDescription())
        .suggestedDepartureTime(domain.getSuggestedDepartureTime())
        .suggestedArrivalTime(domain.getSuggestedArrivalTime())
        .lastTraveledDate(domain.getLastTraveledDate())
        .status(toJpaStatus(domain.getStatus()))
        .priority(toJpaPriority(domain.getPriority()))
        .reportCount(domain.getReportCount())
        .reporterId(domain.getReporterId())
        .adminNotes(domain.getAdminNotes())
        .resolution(domain.getResolution())
        .createdAt(domain.getCreatedAt())
        .updatedAt(domain.getUpdatedAt())
        .resolvedAt(domain.getResolvedAt())
        .build();
  }

  // Status mapping
  private RouteIssue.IssueStatus toDomainStatus(RouteIssueJpaEntity.IssueStatus jpaStatus) {
    return RouteIssue.IssueStatus.valueOf(jpaStatus.name());
  }

  private RouteIssueJpaEntity.IssueStatus toJpaStatus(RouteIssue.IssueStatus domainStatus) {
    return RouteIssueJpaEntity.IssueStatus.valueOf(domainStatus.name());
  }

  // Priority mapping
  private RouteIssue.IssuePriority toDomainPriority(RouteIssueJpaEntity.IssuePriority jpaPriority) {
    return RouteIssue.IssuePriority.valueOf(jpaPriority.name());
  }

  private RouteIssueJpaEntity.IssuePriority toJpaPriority(RouteIssue.IssuePriority domainPriority) {
    return RouteIssueJpaEntity.IssuePriority.valueOf(domainPriority.name());
  }

  // IssueType mapping
  private RouteIssue.IssueType toDomainIssueType(RouteIssueJpaEntity.IssueType jpaType) {
    return RouteIssue.IssueType.valueOf(jpaType.name());
  }

  private RouteIssueJpaEntity.IssueType toJpaIssueType(RouteIssue.IssueType domainType) {
    return RouteIssueJpaEntity.IssueType.valueOf(domainType.name());
  }
}
