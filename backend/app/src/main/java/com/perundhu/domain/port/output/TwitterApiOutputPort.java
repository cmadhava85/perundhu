package com.perundhu.domain.port.output;

import com.perundhu.domain.model.SocialMediaPost;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Output port for Twitter API operations.
 * This interface defines what the domain needs from Twitter API.
 * Implementations will be in the infrastructure layer.
 */
public interface TwitterApiOutputPort {

  /**
   * Search for tweets mentioning the official account.
   * 
   * @param accountHandle The account handle to search for mentions (e.g.,
   *                      "@PerundhuRoutes")
   * @param since         Only fetch tweets after this timestamp
   * @param maxResults    Maximum number of results to return
   * @return List of social media posts from Twitter mentions
   */
  List<SocialMediaPost> searchMentions(String accountHandle, LocalDateTime since, int maxResults);

  /**
   * Search for tweets containing specific hashtags.
   * 
   * @param hashtags   List of hashtags to search for
   * @param since      Only fetch tweets after this timestamp
   * @param maxResults Maximum number of results to return
   * @return List of social media posts containing the hashtags
   */
  List<SocialMediaPost> searchByHashtags(List<String> hashtags, LocalDateTime since, int maxResults);

  /**
   * Reply to a tweet to acknowledge contribution.
   * 
   * @param tweetId The ID of the tweet to reply to
   * @param message The reply message
   * @return true if reply was successful
   */
  boolean replyToTweet(String tweetId, String message);

  /**
   * Check if the API is configured and ready.
   * 
   * @return true if API credentials are configured
   */
  boolean isConfigured();
}
