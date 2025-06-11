package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.ImageContributionJpaEntity;

/**
 * Spring Data JPA repository for image contributions
 */
@Repository("jpaPackageImageContributionJpaRepository")
public interface ImageContributionJpaRepository extends JpaRepository<ImageContributionJpaEntity, String> {
    
    /**
     * Find all image contributions by user ID
     * 
     * @param userId The user ID
     * @return List of image contributions
     */
    List<ImageContributionJpaEntity> findByUserId(String userId);
}

