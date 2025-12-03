package com.perundhu.domain.port.output;

import com.perundhu.domain.model.SocialMediaPost;

import java.util.Optional;

/**
 * Output port for persisting social media posts.
 * This interface defines what the domain needs for social media post
 * persistence.
 * Implementations will be in the infrastructure layer.
 */
public interface SocialMediaPostOutputPort {

  /**
   * Save a social media post.
   * 
   * @param post The post to save
   * @return The saved post with generated ID
   */
  SocialMediaPost save(SocialMediaPost post);

  /**
   * Find a post by platform and post ID.
   * 
   * @param platform The social media platform code
   * @param postId   The platform-specific post ID
   * @return Optional containing the post if found
   */
  Optional<SocialMediaPost> findByPlatformAndPostId(String platform, String postId);

  /**
   * Check if a post has already been processed.
   * 
   * @param platform The social media platform code
   * @param postId   The platform-specific post ID
   * @return true if post exists and is processed
   */
  boolean isAlreadyProcessed(String platform, String postId);
}
