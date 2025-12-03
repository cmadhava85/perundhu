package com.perundhu.adapter.out.socialmedia;

import com.perundhu.domain.model.SocialMediaPost;
import com.perundhu.domain.port.output.InstagramApiOutputPort;
import com.perundhu.infrastructure.config.SocialMediaProperties.InstagramConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Adapter for Instagram API operations.
 * Implements the InstagramApiOutputPort using RestFB library.
 * This is an outbound adapter in the hexagonal architecture.
 * NOTE: RestFB dependency disabled - stub implementation
 */
public class InstagramApiAdapter implements InstagramApiOutputPort {

  private static final Logger log = LoggerFactory.getLogger(InstagramApiAdapter.class);

  public InstagramApiAdapter(InstagramConfig config) {
    log.warn("Instagram integration disabled - RestFB dependency not available");
  }

  @Override
  public List<SocialMediaPost> searchByHashtag(String hashtag, String userId, LocalDateTime since, int maxResults) {
    log.debug("Instagram API disabled");
    return List.of();
  }

  @Override
  public List<SocialMediaPost> fetchAccountMedia(String userId, LocalDateTime since, int maxResults) {
    log.debug("Instagram API disabled");
    return List.of();
  }

  @Override
  public List<SocialMediaPost> fetchMediaComments(String mediaId, int maxResults) {
    log.debug("Instagram API disabled");
    return List.of();
  }

  @Override
  public boolean isConfigured() {
    return false;
  }
}
