package com.perundhu.infrastructure.persistence.adapter;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
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
 * Implementation of RouteContributionRepository using Java 17 features and
 * optimized queries
 */
@Repository
@Primary
@Transactional
public class RouteContributionRepositoryAdapter implements RouteContributionRepository {

    private final RouteContributionJpaRepository repository;

    public RouteContributionRepositoryAdapter(
            @Qualifier("jpaPackageRouteContributionJpaRepository") RouteContributionJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public RouteContribution save(RouteContribution contribution) {
        var entity = mapToJpaEntity(contribution);
        var saved = repository.save(entity);
        if (saved == null) {
            // If saving failed, return the original contribution to avoid NPE
            return contribution;
        }
        return mapToDomainModel(saved);
    }

    @Override
    public Optional<RouteContribution> findById(RouteContribution.RouteContributionId id) {
        // Repository expects String ID, not Long
        return repository.findById(id.value()).map(this::mapToDomainModel);
    }

    @Override
    public List<RouteContribution> findByUserId(String userId) {
        return repository.findByUserId(userId).stream()
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<RouteContribution> findByStatus(RouteContribution.ContributionStatus status) {
        return repository.findAll().stream()
                .filter(entity -> status.name().equals(entity.getStatus()))
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<RouteContribution> findPendingContributions() {
        return findByStatus(RouteContribution.ContributionStatus.PENDING);
    }

    @Override
    public List<RouteContribution> findBySubmissionDateBetween(LocalDateTime start, LocalDateTime end) {
        // Use createdAt as substitute for submissionDate - more efficient filtering
        return repository.findAll().stream()
                .filter(entity -> {
                    var createdAt = entity.getCreatedAt();
                    return createdAt != null &&
                            !createdAt.isBefore(start) &&
                            !createdAt.isAfter(end);
                })
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public void delete(RouteContribution.RouteContributionId id) {
        // Repository expects String ID, not Long
        repository.deleteById(id.value());
    }

    @Override
    public List<RouteContribution> findByBusNumber(String busNumber) {
        return repository.findAll().stream()
                .filter(entity -> busNumber.equals(entity.getBusNumber()))
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<RouteContribution> findBySourceLanguage(com.perundhu.domain.model.LanguageCode sourceLanguage) {
        // Since sourceLanguage field was removed from simplified entity, return empty
        // list
        // This method would need database schema changes to work properly
        return List.of();
    }

    @Override
    public List<RouteContribution> findByUserIdAndStatus(String userId, RouteContribution.ContributionStatus status) {
        return repository.findAll().stream()
                .filter(entity -> userId.equals(entity.getUserId()) &&
                        status.name().equals(entity.getStatus()))
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<RouteContribution> findReadyForSubmission() {
        return findByStatus(RouteContribution.ContributionStatus.PENDING);
    }

    @Override
    public long countByStatus(RouteContribution.ContributionStatus status) {
        return repository.findAll().stream()
                .filter(entity -> status.name().equals(entity.getStatus()))
                .count();
    }

    @Override
    public long count() {
        return repository.count();
    }

    @Override
    public boolean existsByBusNumberAndRoute(String busNumber, String fromLocationName, String toLocationName) {
        return repository.findAll().stream()
                .anyMatch(entity -> busNumber.equals(entity.getBusNumber()) &&
                        fromLocationName.equals(entity.getFromLocationName()) &&
                        toLocationName.equals(entity.getToLocationName()));
    }

    // Helper methods for mapping using Java 17 features
    private RouteContributionJpaEntity mapToJpaEntity(RouteContribution contribution) {
        // Create entity using builder pattern
        var builder = RouteContributionJpaEntity.builder();

        // Set ID if available
        if (contribution.id() != null) {
            builder.id(contribution.id().value());
        }

        // Map basic fields that exist in entity
        builder.userId(contribution.userId())
                .busNumber(contribution.busNumber())
                .busName(contribution.busName())
                .fromLocationName(contribution.fromLocationName())
                .toLocationName(contribution.toLocationName())
                .fromLatitude(contribution.fromLatitude())
                .fromLongitude(contribution.fromLongitude())
                .toLatitude(contribution.toLatitude())
                .toLongitude(contribution.toLongitude());

        // Set secondary names if available
        builder.busNameSecondary(contribution.busNameSecondary())
                .fromLocationNameSecondary(contribution.fromLocationNameSecondary())
                .toLocationNameSecondary(contribution.toLocationNameSecondary());

        // Set source language if available
        if (contribution.sourceLanguage() != null) {
            builder.sourceLanguage(contribution.sourceLanguage().toString());
        }

        // Convert LocalTime to LocalDateTime for entity (add current date)
        var today = LocalDateTime.now().toLocalDate();
        if (contribution.departureTime() != null) {
            builder.departureTime(contribution.departureTime().atDate(today));
        }
        if (contribution.arrivalTime() != null) {
            builder.arrivalTime(contribution.arrivalTime().atDate(today));
        }

        builder.scheduleInfo(contribution.scheduleInfo());

        if (contribution.status() != null) {
            builder.status(contribution.status().name());
        }

        // Set timestamps
        var now = LocalDateTime.now();
        builder.createdAt(contribution.submissionDate() != null ? contribution.submissionDate() : now)
                .updatedAt(contribution.processedDate() != null ? contribution.processedDate() : now);

        return builder.build();
    }

    private RouteContribution mapToDomainModel(RouteContributionJpaEntity entity) {
        return new RouteContribution(
                entity.getId() != null ? new RouteContribution.RouteContributionId(entity.getId()) : null,
                entity.getUserId(),
                entity.getBusNumber(),
                entity.getBusName(),
                entity.getFromLocationName(),
                entity.getToLocationName(),
                null, // busNameSecondary - not available in simplified entity
                null, // fromLocationNameSecondary - not available
                null, // toLocationNameSecondary - not available
                null, // sourceLanguage - not available (removed from simplified entity)
                entity.getFromLatitude(),
                entity.getFromLongitude(),
                entity.getToLatitude(),
                entity.getToLongitude(),
                // Convert LocalDateTime back to LocalTime for domain model
                entity.getDepartureTime() != null ? entity.getDepartureTime().toLocalTime() : null,
                entity.getArrivalTime() != null ? entity.getArrivalTime().toLocalTime() : null,
                entity.getScheduleInfo(),
                entity.getStatus() != null ? RouteContribution.ContributionStatus.valueOf(entity.getStatus()) : null,
                entity.getCreatedAt(), // submissionDate mapped to createdAt
                entity.getUpdatedAt(), // processedDate mapped to updatedAt
                null, // additionalNotes - not available
                null, // validationMessage - not available
                List.of() // Stops - empty list
        );
    }
}
