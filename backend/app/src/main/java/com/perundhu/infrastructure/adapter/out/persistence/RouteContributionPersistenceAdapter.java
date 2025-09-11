package com.perundhu.infrastructure.adapter.out.persistence;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.RouteContributionOutputPort;
import com.perundhu.infrastructure.persistence.entity.RouteContributionJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.RouteContributionJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Outbound adapter for route contribution persistence.
 * Implements the RouteContributionOutputPort using JPA.
 */
@Component
@Transactional
@RequiredArgsConstructor
public class RouteContributionPersistenceAdapter implements RouteContributionOutputPort {

  private final RouteContributionJpaRepository repository;

  @Override
  public RouteContribution save(RouteContribution contribution) {
    RouteContributionJpaEntity entity = mapToJpaEntity(contribution);
    RouteContributionJpaEntity saved = repository.save(entity);
    return mapToDomainModel(saved);
  }

  @Override
  public Optional<RouteContribution> findById(String id) {
    return repository.findById(id).map(this::mapToDomainModel);
  }

  @Override
  public List<RouteContribution> findAll() {
    return repository.findAll().stream()
        .map(this::mapToDomainModel)
        .toList();
  }

  @Override
  public List<RouteContribution> findByUserId(String userId) {
    return repository.findByUserId(userId).stream()
        .map(this::mapToDomainModel)
        .toList();
  }

  @Override
  public List<RouteContribution> findByStatus(String status) {
    return repository.findByStatus(status).stream()
        .map(this::mapToDomainModel)
        .toList();
  }

  @Override
  public List<RouteContribution> findBySubmittedBy(String submittedBy) {
    return repository.findAll().stream()
        .filter(entity -> submittedBy.equals(entity.getSubmittedBy()))
        .map(this::mapToDomainModel)
        .toList();
  }

  @Override
  public List<RouteContribution> findBySubmittedByAndSubmissionDateAfter(String submittedBy,
      LocalDateTime submissionDate) {
    return repository.findAll().stream()
        .filter(entity -> submittedBy.equals(entity.getSubmittedBy()) &&
            entity.getSubmissionDate() != null &&
            entity.getSubmissionDate().isAfter(submissionDate))
        .map(this::mapToDomainModel)
        .toList();
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
    return repository.findByStatus(status).size();
  }

  // Mapping methods
  private RouteContributionJpaEntity mapToJpaEntity(RouteContribution contribution) {
    String idValue = contribution.getId();
    if (idValue == null || idValue.length() > 36) {
      idValue = java.util.UUID.randomUUID().toString();
    }

    return RouteContributionJpaEntity.builder()
        .id(idValue)
        .userId(contribution.getUserId())
        .busNumber(contribution.getBusNumber())
        .busName(contribution.getBusName())
        .fromLocationName(contribution.getFromLocationName())
        .toLocationName(contribution.getToLocationName())
        .fromLatitude(contribution.getFromLatitude())
        .fromLongitude(contribution.getFromLongitude())
        .toLatitude(contribution.getToLatitude())
        .toLongitude(contribution.getToLongitude())
        .departureTime(contribution.getDepartureTime())
        .arrivalTime(contribution.getArrivalTime())
        .scheduleInfo(contribution.getScheduleInfo())
        .status(contribution.getStatus())
        .submissionDate(contribution.getSubmissionDate())
        .processedDate(contribution.getProcessedDate())
        .additionalNotes(contribution.getAdditionalNotes())
        .validationMessage(contribution.getValidationMessage())
        .submittedBy(contribution.getSubmittedBy())
        .build();
  }

  private RouteContribution mapToDomainModel(RouteContributionJpaEntity entity) {
    return RouteContribution.builder()
        .id(entity.getId())
        .userId(entity.getUserId())
        .busNumber(entity.getBusNumber())
        .busName(entity.getBusName())
        .fromLocationName(entity.getFromLocationName())
        .toLocationName(entity.getToLocationName())
        .fromLatitude(entity.getFromLatitude())
        .fromLongitude(entity.getFromLongitude())
        .toLatitude(entity.getToLatitude())
        .toLongitude(entity.getToLongitude())
        .departureTime(entity.getDepartureTime())
        .arrivalTime(entity.getArrivalTime())
        .scheduleInfo(entity.getScheduleInfo())
        .status(entity.getStatus())
        .submissionDate(entity.getSubmissionDate())
        .processedDate(entity.getProcessedDate())
        .additionalNotes(entity.getAdditionalNotes())
        .validationMessage(entity.getValidationMessage())
        .submittedBy(entity.getSubmittedBy())
        .build();
  }
}