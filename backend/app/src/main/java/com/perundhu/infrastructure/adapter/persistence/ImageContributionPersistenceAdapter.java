package com.perundhu.infrastructure.adapter.persistence;

import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.infrastructure.persistence.entity.ImageContributionJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.ImageContributionJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class ImageContributionPersistenceAdapter implements ImageContributionOutputPort {

  private final ImageContributionJpaRepository repository;

  public ImageContributionPersistenceAdapter(ImageContributionJpaRepository repository) {
    this.repository = repository;
  }

  @Override
  public ImageContribution save(ImageContribution contribution) {
    ImageContributionJpaEntity entity = ImageContributionJpaEntity.fromDomainModel(contribution);
    ImageContributionJpaEntity savedEntity = repository.save(entity);
    return savedEntity.toDomainModel();
  }

  @Override
  public Optional<ImageContribution> findById(String id) {
    return repository.findById(id)
        .map(ImageContributionJpaEntity::toDomainModel);
  }

  @Override
  public List<ImageContribution> findByUserId(String userId) {
    return repository.findByUserId(userId)
        .stream()
        .map(ImageContributionJpaEntity::toDomainModel)
        .collect(Collectors.toList());
  }

  @Override
  public List<ImageContribution> findByStatus(String status) {
    return repository.findByStatus(status)
        .stream()
        .map(ImageContributionJpaEntity::toDomainModel)
        .collect(Collectors.toList());
  }

  @Override
  public void deleteById(String id) {
    repository.deleteById(id);
  }

  @Override
  public List<ImageContribution> findAll() {
    return repository.findAll()
        .stream()
        .map(ImageContributionJpaEntity::toDomainModel)
        .collect(Collectors.toList());
  }

  @Override
  public long count() {
    return repository.count();
  }

  @Override
  public long countByStatus(String status) {
    return repository.countByStatus(status);
  }
}