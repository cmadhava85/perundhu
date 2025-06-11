package com.perundhu.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.perundhu.infrastructure.persistence.entity.ImageContributionEntity;

/**
 * Spring Data JPA repository for ImageContributionEntity
 */
@Repository("repositoryPackageImageContributionJpaRepository")
public interface ImageContributionJpaRepository extends JpaRepository<ImageContributionEntity, Long> {
    
    /**
     * Find all image contributions by a user
     */
    List<ImageContributionEntity> findByUserId(String userId);
    
    /**
     * Find all image contributions with a specific status
     */
    List<ImageContributionEntity> findByStatus(String status);
    
    /**
     * Count image contributions with a specific status
     */
    long countByStatus(String status);
}

