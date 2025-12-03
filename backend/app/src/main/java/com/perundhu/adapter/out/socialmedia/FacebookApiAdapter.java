package com.perundhu.adapter.out.socialmedia;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.perundhu.domain.model.SocialMediaPost;
import com.perundhu.domain.port.output.FacebookApiOutputPort;
import com.perundhu.infrastructure.config.SocialMediaProperties.FacebookConfig;

/**
 * Adapter for Facebook API operations.
 * Implements the FacebookApiOutputPort using RestFB library.
 * This is an outbound adapter in the hexagonal architecture.
 * NOTE: RestFB dependency disabled - stub implementation
 */
public class FacebookApiAdapter implements FacebookApiOutputPort {

  private static final Logger log = LoggerFactory.getLogger(FacebookApiAdapter.class);

  public FacebookApiAdapter(FacebookConfig config) {
    log.warn("Facebook integration disabled - RestFB dependency not available");
  }

  @Override
  public List<SocialMediaPost> fetchPagePosts(String pageId, LocalDateTime since, int maxResults) {
    log.debug("Facebook API disabled");
    return List.of();
  }

  @Override
  public List<SocialMediaPost> fetchVisitorPosts(String pageId, LocalDateTime since, int maxResults) {
    log.debug("Facebook API disabled");
    return List.of();
  }

  @Override
  public List<SocialMediaPost> fetchPostComments(String postId, int maxResults) {
    log.debug("Facebook API disabled");
    return List.of();
  }

  @Override
  public boolean commentOnPost(String postId, String message) {
    log.debug("Facebook API disabled");
    return false;
  }

  @Override
  public boolean isConfigured() {
    return false;
  }
}
