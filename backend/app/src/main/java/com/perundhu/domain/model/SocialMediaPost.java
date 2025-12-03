package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Domain model representing a social media post that may contain route
 * information.
 * Part of the core domain - no framework dependencies.
 */
public class SocialMediaPost {
  private String id;
  private SocialMediaPlatform platform;
  private String postId;
  private String authorId;
  private String authorName;
  private String content;
  private List<String> imageUrls;
  private String postUrl;
  private LocalDateTime publishedAt;
  private boolean processed;
  private Double confidenceScore;

  // Private constructor for builder pattern
  private SocialMediaPost() {
    this.imageUrls = new ArrayList<>();
    this.processed = false;
  }

  // Getters
  public String getId() {
    return id;
  }

  public SocialMediaPlatform getPlatform() {
    return platform;
  }

  public String getPostId() {
    return postId;
  }

  public String getAuthorId() {
    return authorId;
  }

  public String getAuthorName() {
    return authorName;
  }

  public String getContent() {
    return content;
  }

  public List<String> getImageUrls() {
    return new ArrayList<>(imageUrls);
  }

  public String getPostUrl() {
    return postUrl;
  }

  public LocalDateTime getPublishedAt() {
    return publishedAt;
  }

  public boolean isProcessed() {
    return processed;
  }

  public Double getConfidenceScore() {
    return confidenceScore;
  }

  // Business methods
  public void markAsProcessed(Double confidenceScore) {
    this.processed = true;
    this.confidenceScore = confidenceScore;
  }

  public boolean hasImages() {
    return imageUrls != null && !imageUrls.isEmpty();
  }

  public boolean hasContent() {
    return content != null && !content.trim().isEmpty();
  }

  // Builder
  public static Builder builder() {
    return new Builder();
  }

  public static class Builder {
    private final SocialMediaPost post;

    private Builder() {
      this.post = new SocialMediaPost();
    }

    public Builder id(String id) {
      post.id = id;
      return this;
    }

    public Builder platform(SocialMediaPlatform platform) {
      post.platform = platform;
      return this;
    }

    public Builder postId(String postId) {
      post.postId = postId;
      return this;
    }

    public Builder authorId(String authorId) {
      post.authorId = authorId;
      return this;
    }

    public Builder authorName(String authorName) {
      post.authorName = authorName;
      return this;
    }

    public Builder content(String content) {
      post.content = content;
      return this;
    }

    public Builder imageUrls(List<String> imageUrls) {
      if (imageUrls != null) {
        post.imageUrls = new ArrayList<>(imageUrls);
      }
      return this;
    }

    public Builder addImageUrl(String imageUrl) {
      if (imageUrl != null) {
        post.imageUrls.add(imageUrl);
      }
      return this;
    }

    public Builder postUrl(String postUrl) {
      post.postUrl = postUrl;
      return this;
    }

    public Builder publishedAt(LocalDateTime publishedAt) {
      post.publishedAt = publishedAt;
      return this;
    }

    public Builder processed(boolean processed) {
      post.processed = processed;
      return this;
    }

    public Builder confidenceScore(Double confidenceScore) {
      post.confidenceScore = confidenceScore;
      return this;
    }

    public SocialMediaPost build() {
      // Validation
      if (post.platform == null) {
        throw new IllegalStateException("Platform is required");
      }
      if (post.postId == null || post.postId.trim().isEmpty()) {
        throw new IllegalStateException("Post ID is required");
      }
      if (post.authorId == null || post.authorId.trim().isEmpty()) {
        throw new IllegalStateException("Author ID is required");
      }
      if (!post.hasContent() && !post.hasImages()) {
        throw new IllegalStateException("Post must have either content or images");
      }

      return post;
    }
  }
}
