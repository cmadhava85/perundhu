package com.perundhu.infrastructure.persistence.adapter;

import org.springframework.beans.factory.annotation.Qualifier;
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
// Remove @Repository annotation - managed by HexagonalConfig
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
        // Use optimized JPA query instead of loading all records
        return repository.findByStatus(status).stream()
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<RouteContribution> findBySubmittedBy(String submittedBy) {
        // Use optimized JPA query instead of loading all records
        return repository.findBySubmittedBy(submittedBy).stream()
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<RouteContribution> findBySubmittedByAndSubmissionDateAfter(String submittedBy,
            LocalDateTime submissionDate) {
        // Use optimized JPA query with proper indexing
        return repository.findBySubmittedByAndSubmissionDateAfter(submittedBy, submissionDate).stream()
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
        // Use optimized COUNT query instead of loading all records
        return repository.countByStatus(status);
    }

    @Override
    public boolean existsByBusNumberAndFromLocationNameAndToLocationName(String busNumber, String fromLocationName,
            String toLocationName) {
        // Use optimized EXISTS query - returns immediately on first match
        return repository.existsByBusNumberAndFromLocationNameAndToLocationName(
                busNumber, fromLocationName, toLocationName);
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
                .busName(entity.getBusName())
                .busNumber(entity.getBusNumber())
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
                .stops(new java.util.ArrayList<>()) // Initialize empty stops list
                .build();
    }
}
