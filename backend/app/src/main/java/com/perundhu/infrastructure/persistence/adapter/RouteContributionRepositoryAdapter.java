package com.perundhu.infrastructure.persistence.adapter;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.RouteContributionRepository;
import com.perundhu.infrastructure.persistence.entity.RouteContributionJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.RouteContributionJpaRepository;

/**
 * Implementation of RouteContributionRepository that delegates to Spring Data JPA
 */
@Repository
@Transactional
public class RouteContributionRepositoryAdapter implements RouteContributionRepository {

    private final RouteContributionJpaRepository repository;
    
    public RouteContributionRepositoryAdapter(
            @Qualifier("jpaPackageRouteContributionJpaRepository")
            RouteContributionJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public RouteContribution save(RouteContribution contribution) {
        RouteContributionJpaEntity entity = mapToJpaEntity(contribution);
        RouteContributionJpaEntity saved = repository.save(entity);
        return mapToDomainModel(saved);
    }

    @Override
    public Optional<RouteContribution> findById(Long id) {
        return repository.findById(id.toString()).map(this::mapToDomainModel);
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
    public List<RouteContribution> findAll() {
        return repository.findAll().stream()
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id.toString());
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

    // Helper methods for mapping between domain model and JPA entity
    private RouteContributionJpaEntity mapToJpaEntity(RouteContribution contribution) {
        // Need to fix the ID conversion to ensure it fits in the database column
        String idValue = contribution.getId();
        // If ID is null or longer than 36 characters (UUID length), generate a new one
        if (idValue == null || idValue.length() > 36) {
            idValue = java.util.UUID.randomUUID().toString();
        }

        return RouteContributionJpaEntity.builder()
                .id(idValue)
                .userId(contribution.getUserId())
                .busNumber(contribution.getBusNumber())
                .fromLocationName(contribution.getFromLocationName())
                .toLocationName(contribution.getToLocationName())
                .fromLatitude(contribution.getFromLatitude())
                .fromLongitude(contribution.getFromLongitude())
                .toLatitude(contribution.getToLatitude())
                .toLongitude(contribution.getToLongitude())
                .scheduleInfo(contribution.getScheduleInfo())
                .status(contribution.getStatus())
                .submissionDate(contribution.getSubmissionDate())
                .processedDate(contribution.getProcessedDate())
                .additionalNotes(contribution.getAdditionalNotes())
                .validationMessage(contribution.getValidationMessage())
                .build();
    }

    private RouteContribution mapToDomainModel(RouteContributionJpaEntity entity) {
        RouteContribution contribution = RouteContribution.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .busNumber(entity.getBusNumber())
                .fromLocationName(entity.getFromLocationName())
                .toLocationName(entity.getToLocationName())
                .fromLatitude(entity.getFromLatitude())
                .fromLongitude(entity.getFromLongitude())
                .toLatitude(entity.getToLatitude())
                .toLongitude(entity.getToLongitude())
                .scheduleInfo(entity.getScheduleInfo())
                .status(entity.getStatus())
                .submissionDate(entity.getSubmissionDate())
                .processedDate(entity.getProcessedDate())
                .additionalNotes(entity.getAdditionalNotes())
                .validationMessage(entity.getValidationMessage())
                .build();

        // Stops would need to be loaded and mapped separately if needed
        return contribution;
    }
}
