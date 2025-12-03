package com.perundhu.adapter.out.persistence;

import java.util.Optional;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.perundhu.adapter.out.persistence.entity.SocialMediaPostJpaEntity;
import com.perundhu.adapter.out.persistence.repository.SocialMediaPostJpaRepository;
import com.perundhu.domain.model.SocialMediaPost;
import com.perundhu.domain.port.output.SocialMediaPostOutputPort;

/**
 * Persistence adapter for social media posts.
 * Implements the SocialMediaPostOutputPort using JPA repository.
 * This is an outbound adapter in the hexagonal architecture.
 */
@Component
@ConditionalOnProperty(prefix = "socialmedia", name = "enabled", havingValue = "true", matchIfMissing = false)
public class SocialMediaPostPersistenceAdapter implements SocialMediaPostOutputPort {

  private final SocialMediaPostJpaRepository repository;

  public SocialMediaPostPersistenceAdapter(SocialMediaPostJpaRepository repository) {
    this.repository = repository;
  }

  @Override
  public SocialMediaPost save(SocialMediaPost post) {
    SocialMediaPostJpaEntity entity = toEntity(post);
    SocialMediaPostJpaEntity saved = repository.save(entity);
    return toDomain(saved);
  }

  @Override
  public Optional<SocialMediaPost> findByPlatformAndPostId(String platform, String postId) {
    return repository.findByPlatformAndPostId(
        com.perundhu.domain.model.SocialMediaPlatform.valueOf(platform),
        postId).map(this::toDomain);
  }

  @Override
  public boolean isAlreadyProcessed(String platform, String postId) {
    return repository.existsByPlatformAndPostId(
        com.perundhu.domain.model.SocialMediaPlatform.valueOf(platform),
        postId);
  }

  // Mapping methods

  private SocialMediaPostJpaEntity toEntity(SocialMediaPost domain) {
    SocialMediaPostJpaEntity entity = new SocialMediaPostJpaEntity();

    if (domain.getId() != null && !domain.getId().isEmpty()) {
      try {
        entity.setId(Long.parseLong(domain.getId()));
      } catch (NumberFormatException e) {
        // ID will be auto-generated
      }
    }

    entity.setPlatform(domain.getPlatform());
    entity.setPostId(domain.getPostId());
    entity.setAuthorId(domain.getAuthorId());
    entity.setAuthorName(domain.getAuthorName());
    entity.setContent(domain.getContent());
    entity.setImageUrls(domain.getImageUrls());
    entity.setPostUrl(domain.getPostUrl());
    entity.setPublishedAt(domain.getPublishedAt());
    entity.setProcessed(domain.isProcessed());
    entity.setConfidenceScore(domain.getConfidenceScore());

    return entity;
  }

  private SocialMediaPost toDomain(SocialMediaPostJpaEntity entity) {
    SocialMediaPost.Builder builder = SocialMediaPost.builder()
        .id(entity.getId() != null ? String.valueOf(entity.getId()) : null)
        .platform(entity.getPlatform())
        .postId(entity.getPostId())
        .authorId(entity.getAuthorId())
        .authorName(entity.getAuthorName())
        .content(entity.getContent())
        .postUrl(entity.getPostUrl())
        .publishedAt(entity.getPublishedAt())
        .processed(entity.isProcessed());

    // Add image URLs
    if (entity.getImageUrls() != null) {
      entity.getImageUrls().forEach(builder::addImageUrl);
    }

    if (entity.getConfidenceScore() != null) {
      builder.confidenceScore(entity.getConfidenceScore());
    }

    return builder.build();
  }
}
