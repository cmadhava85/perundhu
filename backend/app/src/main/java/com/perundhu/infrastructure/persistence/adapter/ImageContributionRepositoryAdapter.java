package com.perundhu.infrastructure.persistence.adapter;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.port.ImageContributionRepository;
import com.perundhu.infrastructure.persistence.entity.ImageContributionJpaEntity;
import com.perundhu.infrastructure.persistence.repository.ImageContributionJpaRepository;

/**
 * Implementation of ImageContributionRepository that delegates to Spring Data
 * JPA
 * Updated to use Java 17 record syntax and complete interface implementation
 */
@Repository
@Primary
@Transactional
public class ImageContributionRepositoryAdapter implements ImageContributionRepository {

    private final ImageContributionJpaRepository repository;

    public ImageContributionRepositoryAdapter(
            @Qualifier("repositoryPackageImageContributionJpaRepository") ImageContributionJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public ImageContribution save(ImageContribution contribution) {
        ImageContributionJpaEntity entity = mapToJpaEntity(contribution);
        ImageContributionJpaEntity saved = repository.save(entity);
        return mapToDomainModel(saved);
    }

    @Override
    public Optional<ImageContribution> findById(ImageContribution.ImageContributionId id) {
        return repository.findById(id.value()).map(this::mapToDomainModel);
    }

    @Override
    public List<ImageContribution> findByUserId(String userId) {
        return repository.findByUserId(userId).stream()
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<ImageContribution> findByStatus(ImageContribution.ContributionStatus status) {
        return repository.findByStatus(status.name()).stream()
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<ImageContribution> findPendingContributions() {
        return findByStatus(ImageContribution.ContributionStatus.PENDING);
    }

    @Override
    public List<ImageContribution> findBySubmissionDateBetween(LocalDateTime start, LocalDateTime end) {
        return repository.findBySubmissionDateBetween(start, end).stream()
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public void delete(ImageContribution.ImageContributionId id) {
        repository.deleteById(id.value());
    }

    @Override
    public List<ImageContribution> findByUserIdAndStatus(String userId, ImageContribution.ContributionStatus status) {
        return repository.findByUserIdAndStatus(userId, status.name()).stream()
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public long countByStatus(ImageContribution.ContributionStatus status) {
        return repository.countByStatus(status.name());
    }

    @Override
    public long count() {
        return repository.count();
    }

    @Override
    public List<ImageContribution> findByBusNumber(String busNumber) {
        // Since busNumber is not available in the current JPA entity structure, return
        // empty list
        // In a real implementation, this would require adding busNumber field to the
        // entity
        // or creating a custom query that joins with related tables
        return List.of();
    }

    @Override
    public List<ImageContribution> findByLocationName(String locationName) {
        if (locationName == null || locationName.trim().isEmpty()) {
            return List.of();
        }

        // Use the location field in the JPA entity to search for matching location
        // names
        return repository.findByLocationContainingIgnoreCase(locationName.trim()).stream()
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public boolean existsByImageUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            return false;
        }

        return repository.existsByImageUrl(imageUrl.trim());
    }

    // Helper methods for mapping between domain model and JPA entity

    private ImageContributionJpaEntity mapToJpaEntity(ImageContribution contribution) {
        return ImageContributionJpaEntity.builder()
                .id(contribution.id() != null ? contribution.id().value() : null)
                .userId(contribution.userId())
                .description(contribution.description())
                .location(contribution.location())
                .routeName(contribution.routeName())
                .imageUrl(contribution.imageUrl())
                .status(contribution.status() != null ? contribution.status().name() : null)
                .submissionDate(contribution.submissionDate())
                .createdAt(contribution.submissionDate())
                .updatedAt(contribution.processedDate())
                .additionalNotes(contribution.additionalNotes())
                .build();
    }

    private ImageContribution mapToDomainModel(ImageContributionJpaEntity entity) {
        return new ImageContribution(
                entity.getId() != null ? new ImageContribution.ImageContributionId(entity.getId()) : null,
                entity.getUserId(),
                entity.getDescription(),
                entity.getLocation(),
                entity.getRouteName(),
                entity.getImageUrl(),
                entity.getStatus() != null ? ImageContribution.ContributionStatus.valueOf(entity.getStatus()) : null,
                entity.getSubmissionDate(),
                entity.getUpdatedAt(), // Map updatedAt to processedDate
                entity.getAdditionalNotes(),
                null, // validationMessage - not available in current JPA entity
                null, // busNumber - not available in current JPA entity
                null, // imageDescription - not available in current JPA entity
                null, // locationName - not available in current JPA entity
                null // extractedData - not available in current JPA entity
        );
    }
}
