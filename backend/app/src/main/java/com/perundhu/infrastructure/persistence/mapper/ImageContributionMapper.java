package com.perundhu.infrastructure.persistence.mapper;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.infrastructure.persistence.entity.ImageContributionJpaEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between ImageContribution domain model and
 * ImageContributionJpaEntity
 */
@Component
public class ImageContributionMapper {

  /**
   * Convert ImageContributionJpaEntity to ImageContribution domain model
   */
  public ImageContribution toDomain(ImageContributionJpaEntity entity) {
    if (entity == null) {
      return null;
    }
    return entity.toDomainModel();
  }

  /**
   * Convert ImageContribution domain model to ImageContributionJpaEntity
   */
  public ImageContributionJpaEntity toEntity(ImageContribution domain) {
    if (domain == null) {
      return null;
    }
    return ImageContributionJpaEntity.fromDomainModel(domain);
  }

  /**
   * Convert ImageContributionJpaEntity to ImageContribution domain model (alias
   * for compatibility)
   */
  public ImageContribution toDomainModel(ImageContributionJpaEntity entity) {
    return toDomain(entity);
  }

  /**
   * Convert ImageContribution domain model to ImageContributionJpaEntity (alias
   * for compatibility)
   */
  public ImageContributionJpaEntity toJpaEntity(ImageContribution domain) {
    return toEntity(domain);
  }
}