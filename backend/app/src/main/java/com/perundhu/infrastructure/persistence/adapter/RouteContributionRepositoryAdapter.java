package com.perundhu.infrastructure.persistence.adapter;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.RouteContributionRepository;
import com.perundhu.infrastructure.persistence.entity.RouteContributionJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.RouteContributionJpaRepository;

/**
 * Implementation of RouteContributionRepository that delegates to Spring Data
 * JPA
 */
@Repository
@Transactional
public class RouteContributionRepositoryAdapter implements RouteContributionRepository {

    private final RouteContributionJpaRepository repository;

    public RouteContributionRepositoryAdapter(
            @Qualifier("jpaPackageRouteContributionJpaRepository") RouteContributionJpaRepository repository) {
        this.repository = repository;
    }

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
    public List<RouteContribution> findByUserId(String userId) {
        return repository.findByUserId(userId).stream()
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<RouteContribution> findByStatus(String status) {
        // Since the repository doesn't have findByStatus, we'll need to filter manually
        return repository.findAll().stream()
                .filter(entity -> status.equals(entity.getStatus()))
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<RouteContribution> findBySubmittedBy(String submittedBy) {
        // Filter by submittedBy field
        return repository.findAll().stream()
                .filter(entity -> submittedBy.equals(entity.getSubmittedBy()))
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<RouteContribution> findBySubmittedByAndSubmissionDateAfter(String submittedBy,
            LocalDateTime submissionDate) {
        // Filter by submittedBy and submission date
        return repository.findAll().stream()
                .filter(entity -> submittedBy.equals(entity.getSubmittedBy()) &&
                        entity.getSubmissionDate() != null &&
                        entity.getSubmissionDate().isAfter(submissionDate))
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<RouteContribution> findAll() {
        return repository.findAll().stream()
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
        // Since the repository doesn't have countByStatus, we'll need to count manually
        return repository.findAll().stream()
                .filter(entity -> status.equals(entity.getStatus()))
                .count();
    }

    @Override
    public boolean existsByBusNumberAndFromLocationNameAndToLocationName(String busNumber, String fromLocationName,
            String toLocationName) {
        return repository.findAll().stream()
                .anyMatch(entity -> busNumber.equals(entity.getBusNumber()) &&
                        fromLocationName.equals(entity.getFromLocationName()) &&
                        toLocationName.equals(entity.getToLocationName()));
    }

    // Helper methods for mapping between domain model and JPA entity
    private RouteContributionJpaEntity mapToJpaEntity(RouteContribution contribution) {
        // Generate UUID if ID is null or too long
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
