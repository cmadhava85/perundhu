package com.perundhu.domain.port.output;

import com.perundhu.domain.model.SocialMediaPost;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Output port for Facebook Graph API operations.
 * This interface defines what the domain needs from Facebook API.
 * Implementations will be in the infrastructure layer.
 */
public interface FacebookApiOutputPort {

  /**
   * Fetch posts from the official Perundhu Facebook page.
   * 
   * @param pageId     The Facebook page ID
   * @param since      Only fetch posts after this timestamp
   * @param maxResults Maximum number of results to return
   * @return List of social media posts from the page
   */
  List<SocialMediaPost> fetchPagePosts(String pageId, LocalDateTime since, int maxResults);

  /**
   * Fetch visitor posts on the page (if enabled).
   * 
   * @param pageId     The Facebook page ID
   * @param since      Only fetch posts after this timestamp
   * @param maxResults Maximum number of results to return
   * @return List of visitor posts
   */
  List<SocialMediaPost> fetchVisitorPosts(String pageId, LocalDateTime since, int maxResults);

  /**
   * Fetch comments on a specific post.
   * 
   * @param postId     The post ID
   * @param maxResults Maximum number of comments to return
   * @return List of comments as social media posts
   */
  List<SocialMediaPost> fetchPostComments(String postId, int maxResults);

  /**
   * Comment on a post to acknowledge contribution.
   * 
   * @param postId  The ID of the post to comment on
   * @param message The comment message
   * @return true if comment was successful
   */
  boolean commentOnPost(String postId, String message);

  /**
   * Check if the API is configured and ready.
   * 
   * @return true if API credentials are configured
   */
  boolean isConfigured();
}
