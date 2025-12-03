package com.perundhu.adapter.out.persistence.repository;

import com.perundhu.adapter.out.persistence.entity.SocialMediaPostJpaEntity;
import com.perundhu.domain.model.SocialMediaPlatform;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA repository for SocialMediaPost entities.
 */
@Repository
public interface SocialMediaPostJpaRepository extends JpaRepository<SocialMediaPostJpaEntity, Long> {

  /**
   * Find a post by platform and external post ID.
   */
  Optional<SocialMediaPostJpaEntity> findByPlatformAndPostId(SocialMediaPlatform platform, String postId);

  /**
   * Check if a post already exists by platform and post ID.
   */
  boolean existsByPlatformAndPostId(SocialMediaPlatform platform, String postId);
}
