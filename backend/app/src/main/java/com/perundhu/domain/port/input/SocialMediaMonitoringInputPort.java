package com.perundhu.domain.port.input;

import com.perundhu.domain.model.SocialMediaPlatform;
import com.perundhu.domain.model.SocialMediaPost;

import java.util.List;

/**
 * Input port for social media monitoring use cases.
 * This interface defines the operations the application layer provides for
 * social media monitoring.
 * Implemented by application services.
 */
public interface SocialMediaMonitoringInputPort {

  /**
   * Monitor all configured social media platforms for new route contributions.
   * This is typically called by a scheduled job.
   * 
   * @return Summary of monitoring results (posts found, processed, etc.)
   */
  MonitoringResult monitorAllPlatforms();

  /**
   * Monitor a specific platform for new route contributions.
   * 
   * @param platform The platform to monitor
   * @return List of newly discovered posts
   */
  List<SocialMediaPost> monitorPlatform(SocialMediaPlatform platform);

  /**
   * Process a social media post to extract route information.
   * 
   * @param post The social media post to process
   * @return true if route contribution was successfully created
   */
  boolean processPost(SocialMediaPost post);

  /**
   * Get monitoring statistics.
   * 
   * @return Monitoring statistics
   */
  MonitoringStatistics getStatistics();

  /**
   * Result of monitoring operation.
   */
  class MonitoringResult {
    private final int totalPostsFound;
    private final int newPostsProcessed;
    private final int contributionsCreated;
    private final List<String> errors;

    public MonitoringResult(int totalPostsFound, int newPostsProcessed,
        int contributionsCreated, List<String> errors) {
      this.totalPostsFound = totalPostsFound;
      this.newPostsProcessed = newPostsProcessed;
      this.contributionsCreated = contributionsCreated;
      this.errors = errors;
    }

    public int getTotalPostsFound() {
      return totalPostsFound;
    }

    public int getNewPostsProcessed() {
      return newPostsProcessed;
    }

    public int getContributionsCreated() {
      return contributionsCreated;
    }

    public List<String> getErrors() {
      return errors;
    }
  }

  /**
   * Statistics about social media monitoring.
   */
  class MonitoringStatistics {
    private final long totalPostsMonitored;
    private final long totalContributionsCreated;
    private final long lastMonitoringTimestamp;

    public MonitoringStatistics(long totalPostsMonitored, long totalContributionsCreated,
        long lastMonitoringTimestamp) {
      this.totalPostsMonitored = totalPostsMonitored;
      this.totalContributionsCreated = totalContributionsCreated;
      this.lastMonitoringTimestamp = lastMonitoringTimestamp;
    }

    public long getTotalPostsMonitored() {
      return totalPostsMonitored;
    }

    public long getTotalContributionsCreated() {
      return totalContributionsCreated;
    }

    public long getLastMonitoringTimestamp() {
      return lastMonitoringTimestamp;
    }
  }
}
