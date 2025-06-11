package com.perundhu.infrastructure.persistence.adapter;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.port.ImageContributionRepository;
import com.perundhu.infrastructure.persistence.entity.ImageContributionJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.ImageContributionJpaRepository;

/**
 * Implementation of ImageContributionRepository that delegates to Spring Data JPA
 */
@Repository
@Transactional
public class ImageContributionRepositoryAdapter implements ImageContributionRepository {

    private final ImageContributionJpaRepository repository;
    
    public ImageContributionRepositoryAdapter(
            @Qualifier("jpaPackageImageContributionJpaRepository")
            ImageContributionJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public ImageContribution save(ImageContribution contribution) {
        ImageContributionJpaEntity entity = mapToJpaEntity(contribution);
        ImageContributionJpaEntity saved = repository.save(entity);
        return mapToDomainModel(saved);
    }

    @Override
    public Optional<ImageContribution> findById(Long id) {
        return repository.findById(id.toString()).map(this::mapToDomainModel);
    }

    @Override
    public List<ImageContribution> findByUserId(String userId) {
        return repository.findByUserId(userId).stream()
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<ImageContribution> findByStatus(String status) {
        // Since the repository doesn't have findByStatus, filter manually
        return repository.findAll().stream()
                .filter(entity -> status.equals(entity.getStatus()))
                .map(this::mapToDomainModel)
                .toList();
    }

    @Override
    public List<ImageContribution> findAll() {
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
        // Since the repository doesn't have countByStatus, count manually
        return repository.findAll().stream()
                .filter(entity -> status.equals(entity.getStatus()))
                .count();
    }

    // Helper methods for mapping between domain model and JPA entity
    private ImageContributionJpaEntity mapToJpaEntity(ImageContribution contribution) {
        return ImageContributionJpaEntity.builder()
                .id(contribution.getId() != null ? contribution.getId().toString() : null)
                .userId(contribution.getUserId())
                .description(contribution.getDescription())
                .location(contribution.getLocation())
                .routeName(contribution.getRouteName())
                .imageUrl(contribution.getImageUrl())
                .status(contribution.getStatus())
                .submissionDate(contribution.getSubmissionDate())
                .additionalNotes(contribution.getAdditionalNotes())
                .build();
    }

    private ImageContribution mapToDomainModel(ImageContributionJpaEntity entity) {
        return ImageContribution.builder()
                .id(entity.getId())  // Keep as String, no parsing needed
                .userId(entity.getUserId())
                .description(entity.getDescription())
                .location(entity.getLocation())
                .routeName(entity.getRouteName())
                .imageUrl(entity.getImageUrl())
                .status(entity.getStatus())
                .submissionDate(entity.getSubmissionDate())
                .additionalNotes(entity.getAdditionalNotes())
                .build();
    }
}
