package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.perundhu.domain.model.SocialMediaPlatform;
import com.perundhu.domain.model.SocialMediaPost;
import com.perundhu.domain.port.ContributionInputPort;
import com.perundhu.domain.port.input.SocialMediaMonitoringInputPort;
import com.perundhu.domain.port.output.FacebookApiOutputPort;
import com.perundhu.domain.port.output.InstagramApiOutputPort;
import com.perundhu.domain.port.output.SocialMediaPostOutputPort;
import com.perundhu.domain.port.output.TwitterApiOutputPort;

/**
 * Application service implementing social media monitoring use cases.
 * Orchestrates the monitoring of social media platforms for bus route
 * contributions.
 * Follows hexagonal architecture - depends only on domain ports.
 */
@Service
@ConditionalOnProperty(prefix = "socialmedia", name = "enabled", havingValue = "true", matchIfMissing = false)
public class SocialMediaMonitoringService implements SocialMediaMonitoringInputPort {

  private static final Logger log = LoggerFactory.getLogger(SocialMediaMonitoringService.class);

  private static final int DEFAULT_MAX_RESULTS = 50;
  private static final int DEFAULT_LOOKBACK_MINUTES = 10; // Look back 10 minutes
  private static final double MIN_CONFIDENCE_THRESHOLD = 0.6; // 60% confidence minimum

  private final TwitterApiOutputPort twitterApi;
  private final FacebookApiOutputPort facebookApi;
  private final InstagramApiOutputPort instagramApi;
  private final SocialMediaPostOutputPort postRepository;
  private final RouteTextParser routeTextParser;
  private final ContributionInputPort contributionInputPort;

  // Statistics tracking
  private long totalPostsMonitored = 0;
  private long totalContributionsCreated = 0;
  private long lastMonitoringTimestamp = 0;

  public SocialMediaMonitoringService(
      TwitterApiOutputPort twitterApi,
      FacebookApiOutputPort facebookApi,
      InstagramApiOutputPort instagramApi,
      SocialMediaPostOutputPort postRepository,
      RouteTextParser routeTextParser,
      ContributionInputPort contributionInputPort) {
    this.twitterApi = twitterApi;
    this.facebookApi = facebookApi;
    this.instagramApi = instagramApi;
    this.postRepository = postRepository;
    this.routeTextParser = routeTextParser;
    this.contributionInputPort = contributionInputPort;
  }

  @Override
  public MonitoringResult monitorAllPlatforms() {
    log.info("Starting social media monitoring across all platforms");

    int totalFound = 0;
    int newProcessed = 0;
    int contributionsCreated = 0;
    List<String> errors = new ArrayList<>();

    try {
      // Monitor each platform
      List<SocialMediaPost> twitterPosts = monitorPlatform(SocialMediaPlatform.TWITTER);
      List<SocialMediaPost> facebookPosts = monitorPlatform(SocialMediaPlatform.FACEBOOK);
      List<SocialMediaPost> instagramPosts = monitorPlatform(SocialMediaPlatform.INSTAGRAM);

      totalFound = twitterPosts.size() + facebookPosts.size() + instagramPosts.size();

      // Process all posts
      List<SocialMediaPost> allPosts = new ArrayList<>();
      allPosts.addAll(twitterPosts);
      allPosts.addAll(facebookPosts);
      allPosts.addAll(instagramPosts);

      for (SocialMediaPost post : allPosts) {
        try {
          if (processPost(post)) {
            newProcessed++;
            if (post.getConfidenceScore() != null && post.getConfidenceScore() >= MIN_CONFIDENCE_THRESHOLD) {
              contributionsCreated++;
            }
          }
        } catch (Exception e) {
          String error = String.format("Error processing %s post %s: %s",
              post.getPlatform(), post.getPostId(), e.getMessage());
          log.error(error, e);
          errors.add(error);
        }
      }

      // Update statistics
      totalPostsMonitored += totalFound;
      totalContributionsCreated += contributionsCreated;
      lastMonitoringTimestamp = System.currentTimeMillis();

      log.info("Monitoring complete. Found: {}, Processed: {}, Contributions: {}, Errors: {}",
          totalFound, newProcessed, contributionsCreated, errors.size());

    } catch (Exception e) {
      log.error("Error during platform monitoring", e);
      errors.add("Platform monitoring error: " + e.getMessage());
    }

    return new MonitoringResult(totalFound, newProcessed, contributionsCreated, errors);
  }

  @Override
  public List<SocialMediaPost> monitorPlatform(SocialMediaPlatform platform) {
    log.debug("Monitoring platform: {}", platform);

    List<SocialMediaPost> posts = new ArrayList<>();
    LocalDateTime since = LocalDateTime.now().minusMinutes(DEFAULT_LOOKBACK_MINUTES);

    try {
      switch (platform) {
        case TWITTER:
          if (twitterApi.isConfigured()) {
            posts.addAll(monitorTwitter(since));
          } else {
            log.warn("Twitter API not configured, skipping");
          }
          break;

        case FACEBOOK:
          if (facebookApi.isConfigured()) {
            posts.addAll(monitorFacebook(since));
          } else {
            log.warn("Facebook API not configured, skipping");
          }
          break;

        case INSTAGRAM:
          if (instagramApi.isConfigured()) {
            posts.addAll(monitorInstagram(since));
          } else {
            log.warn("Instagram API not configured, skipping");
          }
          break;

        default:
          log.warn("Unsupported platform: {}", platform);
      }
    } catch (Exception e) {
      log.error("Error monitoring platform {}: {}", platform, e.getMessage(), e);
    }

    return posts;
  }

  @Override
  public boolean processPost(SocialMediaPost post) {
    log.debug("Processing post: {} from {}", post.getPostId(), post.getPlatform());

    // Check if already processed
    if (postRepository.isAlreadyProcessed(post.getPlatform().getCode(), post.getPostId())) {
      log.debug("Post {} already processed, skipping", post.getPostId());
      return false;
    }

    try {
      // Extract route data from content
      RouteTextParser.RouteData routeData = null;

      if (post.hasContent()) {
        routeData = routeTextParser.extractRouteFromText(post.getContent());
      }

      // TODO: If post has images, run OCR and extract route data
      // This would require OCR service integration

      if (routeData != null && routeData.isValid() &&
          routeData.getConfidence() >= MIN_CONFIDENCE_THRESHOLD) {

        // Create route contribution
        Map<String, Object> contributionData = new HashMap<>();
        contributionData.put("source", "SOCIAL_MEDIA_" + post.getPlatform().getCode().toUpperCase());
        contributionData.put("sourceUrl", post.getPostUrl());
        contributionData.put("busNumber", routeData.getBusNumber());
        contributionData.put("fromLocationName", routeData.getFromLocation());
        contributionData.put("toLocationName", routeData.getToLocation());
        contributionData.put("rawContent", post.getContent());
        contributionData.put("confidenceScore", routeData.getConfidence());

        // Add stops if available
        if (routeData.getStops() != null && !routeData.getStops().isEmpty()) {
          contributionData.put("intermediateStops", routeData.getStops());
        }

        // Add timings if available
        if (routeData.getTimings() != null && !routeData.getTimings().isEmpty()) {
          contributionData.put("timings", routeData.getTimings());
        }

        // Submit contribution (will go through approval workflow)
        String userId = "social_media_" + post.getPlatform().getCode() + "_" + post.getAuthorId();
        contributionInputPort.submitRouteContribution(contributionData, userId);

        // Mark post as processed
        post.markAsProcessed(routeData.getConfidence());
        postRepository.save(post);

        log.info("Created contribution from {} post {} with confidence {}",
            post.getPlatform(), post.getPostId(), routeData.getConfidence());

        return true;
      } else {
        log.debug("Post {} did not contain valid route data or confidence too low", post.getPostId());

        // Still save the post to avoid reprocessing
        post.markAsProcessed(routeData != null ? routeData.getConfidence() : 0.0);
        postRepository.save(post);

        return false;
      }

    } catch (Exception e) {
      log.error("Error processing post {}: {}", post.getPostId(), e.getMessage(), e);
      return false;
    }
  }

  @Override
  public MonitoringStatistics getStatistics() {
    return new MonitoringStatistics(
        totalPostsMonitored,
        totalContributionsCreated,
        lastMonitoringTimestamp);
  }

  // Private helper methods

  private List<SocialMediaPost> monitorTwitter(LocalDateTime since) {
    List<SocialMediaPost> posts = new ArrayList<>();

    try {
      // Monitor mentions (e.g., @PerundhuRoutes)
      // Note: Account handle will come from configuration
      List<SocialMediaPost> mentions = twitterApi.searchMentions("@PerundhuRoutes", since, DEFAULT_MAX_RESULTS);
      posts.addAll(mentions);
      log.debug("Found {} Twitter mentions", mentions.size());

      // Monitor branded hashtags
      List<String> brandedHashtags = List.of("PerundhuRoutes", "PerundhuBus", "ShareBusRoute");
      List<SocialMediaPost> hashtagPosts = twitterApi.searchByHashtags(brandedHashtags, since, DEFAULT_MAX_RESULTS);
      posts.addAll(hashtagPosts);
      log.debug("Found {} Twitter hashtag posts", hashtagPosts.size());

    } catch (Exception e) {
      log.error("Error monitoring Twitter: {}", e.getMessage(), e);
    }

    return posts;
  }

  private List<SocialMediaPost> monitorFacebook(LocalDateTime since) {
    List<SocialMediaPost> posts = new ArrayList<>();

    try {
      // Note: Page ID will come from configuration
      String pageId = "perundhu-page-id"; // Placeholder

      // Monitor page posts
      List<SocialMediaPost> pagePosts = facebookApi.fetchPagePosts(pageId, since, DEFAULT_MAX_RESULTS);
      posts.addAll(pagePosts);
      log.debug("Found {} Facebook page posts", pagePosts.size());

      // Monitor visitor posts (if enabled)
      List<SocialMediaPost> visitorPosts = facebookApi.fetchVisitorPosts(pageId, since, DEFAULT_MAX_RESULTS);
      posts.addAll(visitorPosts);
      log.debug("Found {} Facebook visitor posts", visitorPosts.size());

    } catch (Exception e) {
      log.error("Error monitoring Facebook: {}", e.getMessage(), e);
    }

    return posts;
  }

  private List<SocialMediaPost> monitorInstagram(LocalDateTime since) {
    List<SocialMediaPost> posts = new ArrayList<>();

    try {
      // Note: User ID will come from configuration
      String userId = "perundhu-instagram-id"; // Placeholder
      String brandedHashtag = "PerundhuRoutes";

      // Monitor branded hashtag
      List<SocialMediaPost> hashtagPosts = instagramApi.searchByHashtag(brandedHashtag, userId, since,
          DEFAULT_MAX_RESULTS);
      posts.addAll(hashtagPosts);
      log.debug("Found {} Instagram hashtag posts", hashtagPosts.size());

    } catch (Exception e) {
      log.error("Error monitoring Instagram: {}", e.getMessage(), e);
    }

    return posts;
  }
}
