package com.perundhu.adapter.out.persistence.entity;

import com.perundhu.domain.model.SocialMediaPlatform;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity for social media posts.
 * This is a persistence entity in the infrastructure layer.
 */
@Entity
@Table(name = "social_media_posts", uniqueConstraints = @UniqueConstraint(columnNames = { "platform",
    "post_id" }), indexes = {
        @Index(name = "idx_platform_post_id", columnList = "platform,post_id"),
        @Index(name = "idx_published_at", columnList = "published_at"),
        @Index(name = "idx_processed", columnList = "processed")
    })
public class SocialMediaPostJpaEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private SocialMediaPlatform platform;

  @Column(name = "post_id", nullable = false, length = 100)
  private String postId;

  @Column(name = "author_id", nullable = false, length = 100)
  private String authorId;

  @Column(name = "author_name", nullable = false, length = 255)
  private String authorName;

  @Column(columnDefinition = "TEXT")
  private String content;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "image_urls", columnDefinition = "JSON")
  private List<String> imageUrls = new ArrayList<>();

  @Column(name = "post_url", length = 500)
  private String postUrl;

  @Column(name = "published_at", nullable = false)
  private LocalDateTime publishedAt;

  @Column(nullable = false)
  private boolean processed = false;

  @Column(name = "confidence_score")
  private Double confidenceScore;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  // Getters and Setters

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public SocialMediaPlatform getPlatform() {
    return platform;
  }

  public void setPlatform(SocialMediaPlatform platform) {
    this.platform = platform;
  }

  public String getPostId() {
    return postId;
  }

  public void setPostId(String postId) {
    this.postId = postId;
  }

  public String getAuthorId() {
    return authorId;
  }

  public void setAuthorId(String authorId) {
    this.authorId = authorId;
  }

  public String getAuthorName() {
    return authorName;
  }

  public void setAuthorName(String authorName) {
    this.authorName = authorName;
  }

  public String getContent() {
    return content;
  }

  public void setContent(String content) {
    this.content = content;
  }

  public List<String> getImageUrls() {
    return imageUrls;
  }

  public void setImageUrls(List<String> imageUrls) {
    this.imageUrls = imageUrls;
  }

  public String getPostUrl() {
    return postUrl;
  }

  public void setPostUrl(String postUrl) {
    this.postUrl = postUrl;
  }

  public LocalDateTime getPublishedAt() {
    return publishedAt;
  }

  public void setPublishedAt(LocalDateTime publishedAt) {
    this.publishedAt = publishedAt;
  }

  public boolean isProcessed() {
    return processed;
  }

  public void setProcessed(boolean processed) {
    this.processed = processed;
  }

  public Double getConfidenceScore() {
    return confidenceScore;
  }

  public void setConfidenceScore(Double confidenceScore) {
    this.confidenceScore = confidenceScore;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
