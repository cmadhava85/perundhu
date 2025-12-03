package com.perundhu.infrastructure.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.perundhu.domain.port.input.SocialMediaMonitoringInputPort;
import com.perundhu.domain.port.input.SocialMediaMonitoringInputPort.MonitoringResult;

/**
 * Scheduler for social media monitoring.
 * Runs periodically to check all platforms for new posts.
 */
@Component
@ConditionalOnProperty(prefix = "socialmedia", name = "enabled", havingValue = "true")
public class SocialMediaMonitoringScheduler {

  private static final Logger log = LoggerFactory.getLogger(SocialMediaMonitoringScheduler.class);

  private final SocialMediaMonitoringInputPort monitoringService;

  public SocialMediaMonitoringScheduler(SocialMediaMonitoringInputPort monitoringService) {
    this.monitoringService = monitoringService;
  }

  /**
   * Scheduled job to monitor all platforms.
   * Runs every 5 minutes by default (configured in application.yml).
   */
  @Scheduled(cron = "${socialmedia.monitoring.schedule:0 */5 * * * ?}")
  public void monitorAllPlatforms() {
    log.info("Starting scheduled social media monitoring");

    try {
      MonitoringResult result = monitoringService.monitorAllPlatforms();

      log.info("Social media monitoring completed - " +
          "Posts found: {}, Contributions created: {}, Errors: {}",
          result.getTotalPostsFound(),
          result.getContributionsCreated(),
          result.getErrors().size());

      if (!result.getErrors().isEmpty()) {
        log.warn("Errors during monitoring: {}", result.getErrors());
      }

    } catch (Exception e) {
      log.error("Error during scheduled social media monitoring", e);
    }
  }
}
