package com.perundhu.domain.port.output;

import com.perundhu.domain.model.SocialMediaPost;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Output port for Instagram Graph API operations.
 * This interface defines what the domain needs from Instagram API.
 * Implementations will be in the infrastructure layer.
 */
public interface InstagramApiOutputPort {

  /**
   * Search for Instagram posts with branded hashtag.
   * 
   * @param hashtag    The hashtag to search for (without #)
   * @param userId     The Instagram business account user ID
   * @param since      Only fetch posts after this timestamp
   * @param maxResults Maximum number of results to return
   * @return List of social media posts with the hashtag
   */
  List<SocialMediaPost> searchByHashtag(String hashtag, String userId, LocalDateTime since, int maxResults);

  /**
   * Fetch media from the official Instagram account.
   * 
   * @param userId     The Instagram business account user ID
   * @param since      Only fetch media after this timestamp
   * @param maxResults Maximum number of results to return
   * @return List of media posts from the account
   */
  List<SocialMediaPost> fetchAccountMedia(String userId, LocalDateTime since, int maxResults);

  /**
   * Fetch comments on a specific media post.
   * 
   * @param mediaId    The media ID
   * @param maxResults Maximum number of comments to return
   * @return List of comments as social media posts
   */
  List<SocialMediaPost> fetchMediaComments(String mediaId, int maxResults);

  /**
   * Check if the API is configured and ready.
   * 
   * @return true if API credentials are configured
   */
  boolean isConfigured();
}
