package com.perundhu.adapter.out.socialmedia;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.perundhu.domain.model.SocialMediaPost;
import com.perundhu.domain.port.output.TwitterApiOutputPort;
import com.perundhu.infrastructure.config.SocialMediaProperties.TwitterConfig;

/**
 * Adapter for Twitter API operations.
 * Implements the TwitterApiOutputPort using Twitter4J library.
 * This is an outbound adapter in the hexagonal architecture.
 */
public class TwitterApiAdapter implements TwitterApiOutputPort {

  private static final Logger log = LoggerFactory.getLogger(TwitterApiAdapter.class);

  public TwitterApiAdapter(TwitterConfig config) {
    log.warn("Twitter integration disabled - Twitter4J dependency not available");
  }

  @Override
  public List<SocialMediaPost> searchMentions(String accountHandle, LocalDateTime since, int maxResults) {
    log.debug("Twitter API disabled");
    return List.of();
  }

  @Override
  public List<SocialMediaPost> searchByHashtags(List<String> hashtags, LocalDateTime since, int maxResults) {
    log.debug("Twitter API disabled");
    return List.of();
  }

  @Override
  public boolean replyToTweet(String tweetId, String message) {
    log.debug("Twitter API disabled");
    return false;
  }

  @Override
  public boolean isConfigured() {
    return false;
  }
}
